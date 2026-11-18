// API v1 (B7) com store em memória, fonte simulada e relógio simulado.
import {
  SourceRateLimitError,
  createSimulatedForecast,
  createSimulatedMarine,
  frameTimes,
  loadConfig,
  storagePath,
  type Env,
  type ForecastSource,
  type MarineSource,
  type Sources,
} from '@mariners-compass/core'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryApiStore } from './memory-store.ts'
import { createHandler, type AppDeps } from './router.ts'

const H = 3_600_000
const RUN = '2026-11-18T02:15:03Z'
const T0 = Date.parse(RUN) + 2 * H // 04:15:03Z

class Clock {
  t = T0
  now = () => this.t
}

/** Fonte contável e controlável. */
function countingSources(clock: Clock) {
  const state = { forecastCalls: 0, marineCalls: 0, forecastFail: null as null | (() => Error), marineFail: null as null | (() => Error) }
  const fc = createSimulatedForecast({ now: clock.now })
  const mr = createSimulatedMarine({ now: clock.now })
  const forecast: ForecastSource = {
    fetchPoint: async (req) => {
      state.forecastCalls++
      if (state.forecastFail) throw state.forecastFail()
      return fc.fetchPoint(req)
    },
  }
  const marine: MarineSource = {
    fetchPoint: async (req) => {
      state.marineCalls++
      if (state.marineFail) throw state.marineFail()
      return mr.fetchPoint(req)
    },
  }
  const sources: Sources = { forecast, marine, modelLabel: 'auto' }
  return { sources, state }
}

function setup(env: Env = {}) {
  const clock = new Clock()
  const store = new MemoryApiStore()
  const { sources, state } = countingSources(clock)
  const cfg = loadConfig({ SOURCE_MODE: 'simulated', POINT_CLIENT_LIMIT: 'off', ...env })
  const deps: AppDeps = { cfg, store, now: clock.now, sources: () => sources, clientSecret: 'test-secret' }
  const handle = createHandler(() => deps, () => {})
  const get = (path: string, headers: Record<string, string> = {}) => handle(new Request(`https://app.test${path}`, { headers }))
  return { clock, store, state, get, cfg }
}

function addRun(store: MemoryApiStore, runTime = RUN) {
  const id = `run-${runTime}`
  store.runs.push({ id, source: 'openmeteo', model: 'auto', runTime, ingestedAt: runTime, status: 'closed' })
  for (const region of ['wide', 'bay']) {
    for (const layer of ['wind', 'waves']) {
      for (const t of frameTimes(runTime)) {
        const path = storagePath(runTime, region, layer as 'wind' | 'waves', t)
        store.layers.push({ runId: id, region, layer, validTime: t, path })
        store.files.set(path, JSON.stringify([{ header: { region, layer, t }, data: [] }]))
      }
    }
  }
}

const POINT = '/api/v1/point?lat=-22.9&lon=-43.1'

describe('roteamento', () => {
  it('rota desconhecida = 404; método não GET = 405; /route = 501', async () => {
    const { get } = setup()
    expect((await get('/api/v1/nada')).status).toBe(404)
    expect((await get('/api/v1/route')).status).toBe(501)
    const { store } = setup()
    const h = createHandler(() => ({ cfg: loadConfig({ SOURCE_MODE: 'simulated' }), store, now: Date.now, sources: () => { throw new Error() }, clientSecret: null }))
    expect((await h(new Request('https://app.test/api/v1/frames', { method: 'POST' }))).status).toBe(405)
  })
  it('erros têm corpo { error: { code, message } } e Cache-Control: no-store', async () => {
    const { get } = setup()
    const r = await get('/api/v1/route')
    expect(r.headers.get('Cache-Control')).toBe('no-store')
    expect(await r.json()).toEqual({ error: { code: 'not_implemented', message: expect.any(String) } })
  })
  it('configuração ausente = 503 service_unavailable', async () => {
    const h = createHandler(() => { throw new Error('SUPABASE_URL is required') }, () => {})
    const r = await h(new Request('https://app.test/api/v1/frames?layer=wind'))
    expect(r.status).toBe(503)
    expect((await r.json()).error.code).toBe('service_unavailable')
  })
})

describe('/frames (AC-MVP-07)', () => {
  it('rodada recente: ok, 57 instantes, max-age=60', async () => {
    const { store, get } = setup()
    addRun(store)
    const r = await get('/api/v1/frames?layer=wind')
    expect(r.status).toBe(200)
    expect(r.headers.get('Cache-Control')).toBe('public, max-age=60')
    const body = await r.json()
    expect(body.meta).toMatchObject({ run_time: RUN, status: 'ok', units: { u: 'm/s', v: 'm/s' }, attribution: ['Dados: Open-Meteo.com (CC BY 4.0)'] })
    expect(body.times).toHaveLength(57)
  })
  it('mais de 18 h: stale (200); mais de 48 h: 503 data_expired', async () => {
    const { store, get, clock } = setup()
    addRun(store)
    clock.t = Date.parse(RUN) + 19 * H
    expect((await (await get('/api/v1/frames?layer=waves')).json()).meta.status).toBe('stale')
    clock.t = Date.parse(RUN) + 49 * H
    const r = await get('/api/v1/frames?layer=waves')
    expect([r.status, (await r.json()).error.code]).toEqual([503, 'data_expired'])
  })
  it('sem rodada = 503 data_expired; layer inválida = 422', async () => {
    const { get } = setup()
    expect((await get('/api/v1/frames?layer=wind')).status).toBe(503)
    expect((await get('/api/v1/frames?layer=rain')).status).toBe(422)
  })
})

describe('/grid (AC-MVP-02, 04, 07)', () => {
  const t = frameTimes(RUN)[2]
  const base = `/api/v1/grid?layer=wind&run_time=${RUN}&time=${t}`
  it('sem run_time = 422', async () => {
    const { store, get } = setup()
    addRun(store)
    const r = await get(`/api/v1/grid?layer=wind&time=${t}`)
    expect([r.status, (await r.json()).error.code]).toEqual([422, 'invalid_parameter'])
  })
  it('rodada fechada: imutável, cabeçalhos só imutáveis, sem X-Status', async () => {
    const { store, get } = setup()
    addRun(store)
    const r = await get(base)
    expect(r.status).toBe(200)
    expect(r.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable')
    expect(r.headers.get('X-Run-Time')).toBe(RUN)
    expect(r.headers.get('X-Source')).toBe('openmeteo')
    expect(decodeURIComponent(r.headers.get('X-Attribution')!)).toBe('Dados: Open-Meteo.com (CC BY 4.0)')
    expect(r.headers.get('Access-Control-Expose-Headers')).toBe('X-Source, X-Run-Time, X-Attribution')
    expect(r.headers.get('X-Status')).toBeNull()
    expect(r.headers.get('X-Updated-At')).toBeNull()
    expect((await r.json())[0].header.region).toBe('wide')
  })
  it('pares pré-gerados aceitos; outro valor ou par misto = 422', async () => {
    const { store, get } = setup()
    addRun(store)
    expect((await (await get(`${base}&bbox=-44,-24,-42,-22&res=0.25`)).json())[0].header.region).toBe('bay')
    expect((await get(`${base}&bbox=-54,-35,-30,5&res=2`)).status).toBe(200)
    expect((await get(`${base}&bbox=-44,-24,-42,-22&res=2`)).status).toBe(422)
    expect((await get(`${base}&bbox=-44,-24,-42,-22`)).status).toBe(422)
    expect((await get(`${base}&bbox=-45,-24,-42,-22&res=0.25`)).status).toBe(422)
  })
  it('run_time inexistente = 404 run_not_found; time fora dos quadros = 422', async () => {
    const { store, get } = setup()
    addRun(store)
    const other = '2026-11-18T01:00:00Z'
    const r = await get(`/api/v1/grid?layer=wind&run_time=${other}&time=${frameTimes(other)[0]}`)
    expect([r.status, (await r.json()).error.code]).toEqual([404, 'run_not_found'])
    expect((await get(`/api/v1/grid?layer=wind&run_time=${RUN}&time=2026-11-18T04:00:00Z`)).status).toBe(422)
  })
  it('run_time com mais de 48 h = 503 data_expired, sem ir ao banco', async () => {
    const { store, get, clock } = setup()
    addRun(store)
    store.down = true
    clock.t = Date.parse(RUN) + 49 * H
    const r = await get(base)
    expect([r.status, (await r.json()).error.code]).toEqual([503, 'data_expired'])
  })
})

describe('/point: validação (AC-MVP-21)', () => {
  it('fora do bbox ou não numérico = 422 invalid_coordinates', async () => {
    const { get } = setup()
    for (const q of ['lat=10&lon=-43', 'lat=-22&lon=-60', 'lat=abc&lon=-43', 'lon=-43']) {
      const r = await get(`/api/v1/point?${q}`)
      expect([r.status, (await r.json()).error.code]).toEqual([422, 'invalid_coordinates'])
    }
  })
  it('hours fora de 1..168 ou vars desconhecida = 422 invalid_parameter', async () => {
    const { get } = setup()
    for (const q of ['hours=0', 'hours=169', 'hours=2.5', 'vars=temperature_2m']) {
      const r = await get(`${POINT}&${q}`)
      expect([r.status, (await r.json()).error.code]).toEqual([422, 'invalid_parameter'])
    }
  })
  it('hours=24: começa na hora UTC atual (floor) e tem 24 entradas; coordenada arredondada', async () => {
    const { get } = setup()
    const body = await (await get(`${POINT}&hours=24&vars=wind_speed_10m,wave_height`)).json()
    expect(body.hourly.time).toHaveLength(24)
    expect(body.hourly.time[0]).toBe('2026-11-18T04:00:00Z')
    expect(Object.keys(body.hourly).sort()).toEqual(['time', 'wave_height', 'wind_speed_10m'])
    expect(body.meta).toMatchObject({ status: 'ok', point: { lat: -23, lon: -43 }, units: { wind_speed_10m: 'kn', wave_height: 'm' } })
  })
})

describe('/point: cache e coalescência (AC-MVP-06, 26)', () => {
  let s: ReturnType<typeof setup>
  beforeEach(() => (s = setup()))

  it('cliques sequenciais no mesmo ponto arredondado, com vars e hours diferentes = 1 miss (2 chamadas)', async () => {
    await s.get('/api/v1/point?lat=-22.9&lon=-43.1&hours=12')
    await s.get('/api/v1/point?lat=-22.95&lon=-43.05&vars=wave_height')
    await s.get('/api/v1/point?lat=-23.1&lon=-42.9&hours=168')
    expect([s.state.forecastCalls, s.state.marineCalls]).toEqual([1, 1])
    expect(s.store.calls('day', s.clock.t)).toBe(2)
  })
  it('ok com 2 h = hit; com 4 h e fonte disponível = renova (conta 2)', async () => {
    await s.get(POINT)
    s.clock.t += 2 * H
    expect((await (await s.get(POINT)).json()).meta.status).toBe('ok')
    expect(s.state.forecastCalls).toBe(1)
    s.clock.t += 2 * H
    await s.get(POINT)
    expect(s.state.forecastCalls).toBe(2)
    expect(s.store.calls('day', s.clock.t)).toBe(4)
  })
  it('com 4 h e fonte falhando = stale (200); com 7 h = 503 service_unavailable', async () => {
    await s.get(POINT)
    s.state.forecastFail = s.state.marineFail = () => new Error('down')
    s.clock.t += 4 * H
    const r = await s.get(POINT)
    expect([r.status, (await r.json()).meta.status]).toEqual([200, 'stale'])
    s.clock.t += 3 * H
    const r2 = await s.get(POINT)
    expect([r2.status, (await r2.json()).error.code]).toEqual([503, 'service_unavailable'])
  })
  it('falha parcial = partial, conta 2, vale 15 min; depois repete as 2 e conta mais 2', async () => {
    s.state.marineFail = () => new Error('down')
    const body = await (await s.get(POINT)).json()
    expect(body.meta.status).toBe('partial')
    expect(body.hourly.wave_height.every((x: unknown) => x === null)).toBe(true)
    expect(body.hourly.wind_speed_10m.some((x: unknown) => x !== null)).toBe(true)
    expect(s.store.calls('day', s.clock.t)).toBe(2)
    s.clock.t += 10 * 60_000
    expect((await (await s.get(POINT)).json()).meta.status).toBe('partial')
    expect(s.state.marineCalls).toBe(1)
    s.state.marineFail = null
    s.clock.t += 6 * 60_000
    expect((await (await s.get(POINT)).json()).meta.status).toBe('ok')
    expect([s.state.forecastCalls, s.state.marineCalls]).toEqual([2, 2])
    expect(s.store.calls('day', s.clock.t)).toBe(4)
  })
  it('entrada ilegível = miss, conta 2 uma única vez', async () => {
    s.store.cache.set('-23:-43', { key: '-23:-43', status: 'ok', fetched_at: '2026-11-18T04:00:00Z', payload: { broken: true } })
    expect((await (await s.get(POINT)).json()).meta.status).toBe('ok')
    expect(s.store.calls('day', s.clock.t)).toBe(2)
  })
})

describe('/point: orçamento e tetos (AC-MVP-05, 18, 20, 23)', () => {
  const pointN = (i: number) => `/api/v1/point?lat=${-34 + Math.floor(i / 96) * 0.25}&lon=${-53.75 + (i % 96) * 0.25}`

  it('1.600º miss passa; 1.601º = 503 quota_exhausted; contador de 2 em 2; hit segue', async () => {
    const s = setup({ POINT_MAX_PER_MIN: '100000', POINT_MAX_PER_HOUR: '100000' })
    for (let i = 0; i < 1600; i++) expect((await s.get(pointN(i))).status).toBe(200)
    expect(s.store.calls('day', s.clock.t)).toBe(3200)
    const r = await s.get(pointN(1600))
    expect([r.status, (await r.json()).error.code]).toEqual([503, 'quota_exhausted'])
    expect(Number(r.headers.get('Retry-After'))).toBe(Math.ceil((Date.UTC(2026, 10, 19) - s.clock.t) / 1000))
    expect(s.store.calls('day', s.clock.t)).toBe(3200)
    expect((await s.get(pointN(0))).status).toBe(200)
  })
  it('minuto: 50º passa, 51º = 429 com Retry-After; minuto seguinte volta', async () => {
    const s = setup()
    s.clock.t = Date.UTC(2026, 10, 18, 4, 15, 0)
    for (let i = 0; i < 50; i++) expect((await s.get(pointN(i))).status).toBe(200)
    const r = await s.get(pointN(50))
    expect([r.status, (await r.json()).error.code]).toEqual([429, 'rate_limited'])
    expect(r.headers.get('Retry-After')).toBe('60')
    expect(s.store.calls('minute', s.clock.t)).toBe(100)
    s.clock.t += 60_000
    expect((await s.get(pointN(50))).status).toBe(200)
  })
  it('hora: 500º passa, 501º = 429', async () => {
    const s = setup({ POINT_MAX_PER_MIN: '100000' })
    for (let i = 0; i < 500; i++) expect((await s.get(pointN(i))).status).toBe(200)
    expect((await s.get(pointN(500))).status).toBe(429)
  })
  it('dia e minuto estourados juntos = 503 quota_exhausted', async () => {
    const s = setup({ POINT_DAILY_BUDGET: '100', POINT_OPERATING_PCT: '100' })
    for (let i = 0; i < 50; i++) await s.get(pointN(i))
    const r = await s.get(pointN(50))
    expect([r.status, (await r.json()).error.code]).toEqual([503, 'quota_exhausted'])
  })
  it('429 da fonte: stale se houver cache até 6 h, senão 503; sem nova tentativa', async () => {
    const s = setup()
    await s.get(POINT)
    s.clock.t += 4 * H
    s.state.forecastFail = s.state.marineFail = () => new SourceRateLimitError('429')
    expect((await (await s.get(POINT)).json()).meta.status).toBe('stale')
    expect([s.state.forecastCalls, s.state.marineCalls]).toEqual([2, 2])
    const r = await s.get('/api/v1/point?lat=-30&lon=-50')
    expect(r.status).toBe(503)
    expect([s.state.forecastCalls, s.state.marineCalls]).toEqual([3, 3])
  })
  it('Supabase indisponível = 503 service_unavailable sem chamar a fonte', async () => {
    const s = setup()
    s.store.down = true
    const r = await s.get(POINT)
    expect([r.status, (await r.json()).error.code]).toEqual([503, 'service_unavailable'])
    expect(s.state.forecastCalls + s.state.marineCalls).toBe(0)
  })
})

describe('/point: limite por cliente', () => {
  const ip = (n: number) => ({ 'x-forwarded-for': `203.0.113.${n}` })
  it('21º miss do mesmo IP na hora = 429; outro IP segue; hit não é limitado', async () => {
    const s = setup({ POINT_CLIENT_LIMIT: 'on' })
    for (let i = 0; i < 20; i++) expect((await s.get(`/api/v1/point?lat=-30&lon=${-53 + i * 0.25}`, ip(1))).status).toBe(200)
    const r = await s.get('/api/v1/point?lat=-31&lon=-50', ip(1))
    expect([r.status, (await r.json()).error.code]).toEqual([429, 'rate_limited'])
    expect((await s.get('/api/v1/point?lat=-31&lon=-50', ip(2))).status).toBe(200)
    expect((await s.get('/api/v1/point?lat=-30&lon=-53', ip(1))).status).toBe(200)
  })
  it('limite ligado sem CLIENT_HASH_SECRET = 503', async () => {
    const store = new MemoryApiStore()
    const cfg = loadConfig({ SOURCE_MODE: 'simulated', POINT_CLIENT_LIMIT: 'on' })
    const h = createHandler(() => ({ cfg, store, now: () => T0, sources: () => { throw new Error('never') }, clientSecret: null }), () => {})
    expect((await h(new Request(`https://app.test${POINT}`))).status).toBe(503)
  })
})

describe('/notices (AC-MVP-17, parte da API)', () => {
  it('só avisos válidos, com crédito, link e datas de registro e conferência', async () => {
    const { store, get } = setup()
    store.notices = [
      { id: '1', title: 'Mar grosso', body: 'texto', issued_at: null, valid_until: '2026-11-20T00:00:00Z', source_url: 'https://www.marinha.mil.br/chm', registered_at: '2026-11-17T10:00:00Z' },
      { id: '2', title: 'Antigo', body: 'texto', issued_at: null, valid_until: '2026-11-01T00:00:00Z', source_url: 'https://www.marinha.mil.br/chm', registered_at: '2026-11-01T10:00:00Z' },
    ]
    store.checks = ['2026-11-18T03:00:00Z']
    const r = await get('/api/v1/notices')
    expect(r.headers.get('Cache-Control')).toBe('public, max-age=60')
    const body = await r.json()
    expect(body.notices.map((n: { id: string }) => n.id)).toEqual(['1'])
    expect(body.meta).toMatchObject({
      attribution: ['Fonte: Marinha do Brasil, CHM/DHN'],
      bulletin_url: 'https://www.marinha.mil.br/chm',
      last_registered_at: '2026-11-17T10:00:00Z',
      last_checked_at: '2026-11-18T03:00:00Z',
    })
  })
  it('sem aviso: lista vazia e datas nulas', async () => {
    const body = await (await setup().get('/api/v1/notices')).json()
    expect(body).toMatchObject({ notices: [], meta: { last_registered_at: null, last_checked_at: null } })
  })
})

describe('AC-MVP-16: só o /point chama a fonte', () => {
  it('nenhum arquivo da API, exceto point.ts, router.ts e env.ts, usa fontes ou URL do Open-Meteo', () => {
    const here = dirname(fileURLToPath(import.meta.url))
    const files = [
      ...readdirSync(here).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts')).map((f) => join(here, f)),
      join(here, '../../../api/index.ts'),
    ]
    const allowed = new Set(['point.ts', 'router.ts', 'env.ts'])
    const offenders = files.filter((f) => {
      const name = f.split(/[\\/]/).at(-1)!
      if (allowed.has(name)) return false
      return /createSources|fetchPoint|open-meteo\.com/.test(readFileSync(f, 'utf8'))
    })
    expect(offenders).toEqual([])
  })
})

// Adaptadores (B5). Nenhum teste usa rede: o adaptador real recebe um fetch falso.
import { describe, expect, it, vi } from 'vitest'
import { ConfigError, loadConfig, pointOperatingDailyLimit } from '../config.ts'
import { createSources, modelLabel } from './index.ts'
import { createOpenMeteoForecast, createOpenMeteoMarine, type FetchLike } from './openmeteo.ts'
import { createSimulatedForecast, createSimulatedMarine } from './simulated.ts'
import {
  MARINE_VARIABLES,
  SourceConfigError,
  SourceRateLimitError,
  SourceRequestError,
  SourceUnavailableError,
  type AttemptInfo,
} from './types.ts'

const FORECAST_URL = 'https://forecast.example.test/v1/forecast'
const MARINE_URL = 'https://marine.example.test/v1/marine'
const now = Date.UTC(2026, 10, 17, 21, 1)

// Resposta no formato observado na sondagem 1 (T-07), reduzida a 2 horas.
const forecastBody = {
  latitude: -22.88225,
  longitude: -43.07611,
  timezone: 'GMT',
  hourly_units: { time: 'iso8601', wind_speed_10m: 'm/s', wind_direction_10m: '°', wind_gusts_10m: 'm/s' },
  hourly: {
    time: ['2026-11-17T00:00', '2026-11-17T01:00'],
    wind_speed_10m: [1.8, null],
    wind_direction_10m: [109, 0],
    wind_gusts_10m: [3.1, 0],
  },
}

function fakeFetch(status: number, body: unknown = forecastBody) {
  return vi.fn<FetchLike>(async () => ({ ok: status >= 200 && status < 300, status, json: async () => body }))
}

describe('Open-Meteo real (fetch falso)', () => {
  it('monta a URL com uma coordenada, variáveis do B5, GMT e unidade pedida', async () => {
    const f = fakeFetch(200)
    await createOpenMeteoForecast({ url: FORECAST_URL, model: null, fetch: f }).fetchPoint({
      lat: -22.75,
      lon: -43.25,
      days: 9,
      windUnit: 'kn',
    })
    const u = new URL(f.mock.calls[0][0])
    expect(u.origin + u.pathname).toBe(FORECAST_URL)
    expect(u.searchParams.get('latitude')).toBe('-22.75')
    expect(u.searchParams.get('longitude')).toBe('-43.25')
    expect(u.searchParams.get('hourly')).toBe('wind_speed_10m,wind_direction_10m,wind_gusts_10m')
    expect(u.searchParams.get('forecast_days')).toBe('9')
    expect(u.searchParams.get('wind_speed_unit')).toBe('kn')
    expect(u.searchParams.get('timezone')).toBe('GMT')
    expect(u.searchParams.has('models')).toBe(false)
  })

  it('normaliza o tempo, preserva null, converte ° em deg e marca modelo auto', async () => {
    const r = await createOpenMeteoForecast({ url: FORECAST_URL, model: null, fetch: fakeFetch(200) }).fetchPoint({
      lat: -22.9,
      lon: -43.1,
      days: 9,
    })
    expect(r.hourly.time).toEqual(['2026-11-17T00:00:00Z', '2026-11-17T01:00:00Z'])
    expect(r.hourly.wind_speed_10m).toEqual([1.8, null])
    expect(r.meta.units.wind_direction_10m).toBe('deg')
    expect(r.meta.units.wind_speed_10m).toBe('m/s')
    expect(r.meta.model).toBe('auto')
    expect(r.meta.latitude).toBe(-22.88225)
  })

  it('fixa o modelo quando configurado', async () => {
    const f = fakeFetch(200)
    const r = await createOpenMeteoForecast({ url: FORECAST_URL, model: 'ecmwf_ifs', fetch: f }).fetchPoint({
      lat: 0,
      lon: 0,
      days: 9,
    })
    expect(new URL(f.mock.calls[0][0]).searchParams.get('models')).toBe('ecmwf_ifs')
    expect(r.meta.model).toBe('ecmwf_ifs')
  })

  it('chama onAttempt uma vez por tentativa HTTP, inclusive quando falha', async () => {
    const attempts: AttemptInfo[] = []
    const src = createOpenMeteoForecast({ url: FORECAST_URL, model: null, fetch: fakeFetch(500) })
    await expect(src.fetchPoint({ lat: 0, lon: 0, days: 9, onAttempt: (a) => attempts.push(a) })).rejects.toThrow(
      SourceUnavailableError,
    )
    expect(attempts).toHaveLength(1)
    expect(attempts[0].source).toBe('forecast')
  })

  it('HTTP 429 vira SourceRateLimitError', async () => {
    const src = createOpenMeteoForecast({ url: FORECAST_URL, model: null, fetch: fakeFetch(429) })
    await expect(src.fetchPoint({ lat: 0, lon: 0, days: 9 })).rejects.toThrow(SourceRateLimitError)
  })

  it('falha de rede e resposta malformada viram SourceUnavailableError', async () => {
    const down = vi.fn<FetchLike>(async () => {
      throw new Error('ECONNRESET')
    })
    await expect(
      createOpenMeteoForecast({ url: FORECAST_URL, model: null, fetch: down }).fetchPoint({ lat: 0, lon: 0, days: 9 }),
    ).rejects.toThrow(SourceUnavailableError)
    const bad = fakeFetch(200, { latitude: 0, longitude: 0, hourly: { time: ['2026-11-17T00:00'], wind_speed_10m: [] } })
    await expect(
      createOpenMeteoForecast({ url: FORECAST_URL, model: null, fetch: bad }).fetchPoint({ lat: 0, lon: 0, days: 9 }),
    ).rejects.toThrow(/malformed/)
  })

  it('recusa mais de 14 dias sem chamar a fonte', async () => {
    const f = fakeFetch(200)
    await expect(
      createOpenMeteoForecast({ url: FORECAST_URL, model: null, fetch: f }).fetchPoint({ lat: 0, lon: 0, days: 15 }),
    ).rejects.toThrow(SourceRequestError)
    expect(f).not.toHaveBeenCalled()
  })

  it('sem URL configurada falha sem chamar a fonte (fail-closed)', async () => {
    const f = fakeFetch(200)
    await expect(
      createOpenMeteoMarine({ url: null, model: null, fetch: f }).fetchPoint({ lat: 0, lon: 0, days: 9 }),
    ).rejects.toThrow(SourceConfigError)
    expect(f).not.toHaveBeenCalled()
  })

  it('Marine pede as 9 variáveis, sem wind_speed_unit', async () => {
    const hourly = Object.fromEntries(MARINE_VARIABLES.map((v) => [v, [null]]))
    const f = fakeFetch(200, { latitude: 0, longitude: 0, hourly: { time: ['2026-11-17T00:00'], ...hourly } })
    const r = await createOpenMeteoMarine({ url: MARINE_URL, model: null, fetch: f }).fetchPoint({ lat: 0, lon: 0, days: 9 })
    const u = new URL(f.mock.calls[0][0])
    expect(u.searchParams.get('hourly')!.split(',')).toHaveLength(9)
    expect(u.searchParams.has('wind_speed_unit')).toBe(false)
    expect(r.hourly.wave_height).toEqual([null])
  })
})

describe('fonte simulada', () => {
  const opts = { now: () => now }

  it('série desde 00:00 UTC do dia, 24 valores por dia', async () => {
    const r = await createSimulatedForecast(opts).fetchPoint({ lat: -22.9, lon: -43.1, days: 9 })
    expect(r.hourly.time).toHaveLength(216)
    expect(r.hourly.time[0]).toBe('2026-11-17T00:00:00Z')
    expect(r.meta.units.wind_speed_10m).toBe('m/s')
  })
  it('é determinística', async () => {
    const a = await createSimulatedForecast(opts).fetchPoint({ lat: -22.9, lon: -43.1, days: 2 })
    const b = await createSimulatedForecast(opts).fetchPoint({ lat: -22.9, lon: -43.1, days: 2 })
    expect(a).toEqual(b)
  })
  it('kn: velocidade convertida e unidade declarada', async () => {
    const ms = await createSimulatedForecast(opts).fetchPoint({ lat: 0, lon: 0, days: 1 })
    const kn = await createSimulatedForecast(opts).fetchPoint({ lat: 0, lon: 0, days: 1, windUnit: 'kn' })
    expect(kn.meta.units.wind_speed_10m).toBe('kn')
    expect(kn.hourly.wind_speed_10m[0]!).toBeGreaterThan(ms.hourly.wind_speed_10m[0]!)
  })
  it('land: ondas null, nunca zero', async () => {
    const r = await createSimulatedMarine({ ...opts, mode: 'land' }).fetchPoint({ lat: -22.5, lon: -43.25, days: 1 })
    expect(r.hourly.wave_height.every((x) => x === null)).toBe(true)
  })
  it('short: um dia a menos (rodada incompleta)', async () => {
    const r = await createSimulatedMarine({ ...opts, mode: 'short' }).fetchPoint({ lat: 0, lon: 0, days: 9 })
    expect(r.hourly.time).toHaveLength(192)
  })
  it('rate_limited e error contam a tentativa e lançam o erro tipado', async () => {
    const attempts: AttemptInfo[] = []
    const onAttempt = (a: AttemptInfo) => attempts.push(a)
    await expect(
      createSimulatedForecast({ ...opts, mode: 'rate_limited' }).fetchPoint({ lat: 0, lon: 0, days: 1, onAttempt }),
    ).rejects.toThrow(SourceRateLimitError)
    await expect(
      createSimulatedMarine({ ...opts, mode: 'error' }).fetchPoint({ lat: 0, lon: 0, days: 1, onAttempt }),
    ).rejects.toThrow(SourceUnavailableError)
    expect(attempts.map((a) => a.source)).toEqual(['forecast', 'marine'])
  })
  it('resposta lenta respeita o atraso', async () => {
    vi.useFakeTimers()
    try {
      const p = createSimulatedForecast({ ...opts, delayMs: 5000 }).fetchPoint({ lat: 0, lon: 0, days: 1 })
      let done = false
      void p.then(() => (done = true))
      await vi.advanceTimersByTimeAsync(4999)
      expect(done).toBe(false)
      await vi.advanceTimersByTimeAsync(1)
      expect(done).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('configuração e seleção de fonte', () => {
  it('SOURCE_MODE é obrigatório', () => {
    expect(() => loadConfig({})).toThrow(ConfigError)
    expect(() => loadConfig({ SOURCE_MODE: 'prod' })).toThrow(ConfigError)
  })
  it('padrões do B9', () => {
    const c = loadConfig({ SOURCE_MODE: 'simulated' })
    expect(c.forecastDays).toBe(9)
    expect(c.point).toMatchObject({ dailyBudget: 4000, operatingPct: 80, cacheTtlS: 10800, maxPerMin: 100, maxPerHour: 1000 })
    expect(c.grid).toEqual({ staleHours: 18, expiredHours: 48 })
    expect(c.ingest).toEqual({ roundBudget: 885, dailyBudget: 3540, retryMax: 2, maxPerMin: 300 })
    expect(pointOperatingDailyLimit(c)).toBe(3200)
  })
  it('valores inválidos dão erro claro', () => {
    expect(() => loadConfig({ SOURCE_MODE: 'live', FORECAST_DAYS: '15' })).toThrow(/FORECAST_DAYS/)
    expect(() => loadConfig({ SOURCE_MODE: 'live', OPENMETEO_FORECAST_URL: 'http://x.test' })).toThrow(/https/)
  })
  it('live sem URLs falha ao criar as fontes, sem chamar nada', () => {
    const f = fakeFetch(200)
    expect(() => createSources(loadConfig({ SOURCE_MODE: 'live' }), { fetch: f })).toThrow(SourceConfigError)
    expect(f).not.toHaveBeenCalled()
  })
  it('live com URLs usa o adaptador real; simulated usa o simulado', async () => {
    const f = fakeFetch(200)
    const live = createSources(
      loadConfig({ SOURCE_MODE: 'live', OPENMETEO_FORECAST_URL: FORECAST_URL, OPENMETEO_MARINE_URL: MARINE_URL }),
      { fetch: f },
    )
    await live.forecast.fetchPoint({ lat: 0, lon: 0, days: 9 })
    expect(f).toHaveBeenCalledTimes(1)
    expect(live.modelLabel).toBe('auto')
    const sim = createSources(loadConfig({ SOURCE_MODE: 'simulated' }))
    expect((await sim.marine.fetchPoint({ lat: 0, lon: 0, days: 1 })).meta.source).toBe('simulated-marine')
  })
  it('modelLabel segue o formato de model_runs.model', () => {
    expect(modelLabel(null, null)).toBe('auto')
    expect(modelLabel('ecmwf_ifs', null)).toBe('forecast:ecmwf_ifs|marine:auto')
  })
})

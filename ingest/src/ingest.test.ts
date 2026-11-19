// AC-MVP-19 e regras de B6: fonte simulada, store em memória e relógio simulado.
import {
  SourceRateLimitError,
  SourceUnavailableError,
  createSimulatedForecast,
  createSimulatedMarine,
  loadConfig,
  type ForecastSource,
  type MarineSource,
  type SimulatedOptions,
  type Sources,
} from '@mariners-compass/core'
import { describe, expect, it } from 'vitest'
import { runIngest, type IngestDeps } from './ingest.ts'
import type { IngestStore, LayerRow, ReserveResult, RunRow } from './store.ts'

const START = Date.UTC(2026, 10, 17, 20, 15, 3)

class MemoryStore implements IngestStore {
  runs: (RunRow & { model: string })[] = []
  files = new Map<string, string>()
  layers: LayerRow[] = []
  reservations = 0
  /** Resposta forçada para as próximas reservas. */
  denyQueue: ReserveResult['reason'][] = []
  down = false
  private seq = 0

  private guard() {
    if (this.down) throw new Error('supabase unavailable')
  }
  async reserve(): Promise<ReserveResult> {
    this.guard()
    const forced = this.denyQueue.shift()
    if (forced) return { allowed: false, reason: forced }
    this.reservations++
    return { allowed: true, reason: null }
  }
  async createRun(r: { model: string; runTime: string }) {
    this.guard()
    const id = `run-${++this.seq}`
    this.runs.push({ id, runTime: r.runTime, status: 'open', model: r.model })
    return id
  }
  async setRunStatus(id: string, status: 'closed' | 'aborted') {
    this.runs.find((r) => r.id === id)!.status = status
  }
  async uploadFile(path: string, body: string) {
    if (this.files.has(path)) throw new Error(`exists: ${path}`)
    this.files.set(path, body)
  }
  async removeFiles(paths: string[]) {
    paths.forEach((p) => this.files.delete(p))
  }
  async insertLayers(rows: LayerRow[]) {
    this.layers.push(...rows)
  }
  async countLayers(id: string) {
    return this.layers.filter((l) => l.run_id === id).length
  }
  async listRuns() {
    return [...this.runs].sort((a, b) => (a.runTime < b.runTime ? 1 : -1))
  }
  async deleteRun(id: string) {
    this.runs = this.runs.filter((r) => r.id !== id)
    this.layers = this.layers.filter((l) => l.run_id !== id)
  }
  cleaned: [string, string] | null = null
  async cleanupCaches(a: string, b: string) {
    this.cleaned = [a, b]
  }
}

const cfg = loadConfig({ SOURCE_MODE: 'simulated' })

function sources(forecast: SimulatedOptions = {}, marine: SimulatedOptions = {}): Sources {
  return {
    forecast: createSimulatedForecast({ now: () => START, ...forecast }),
    marine: createSimulatedMarine({ now: () => START, ...marine }),
    modelLabel: 'simulated',
  }
}

function deps(store: MemoryStore, src: Sources, extra: Partial<IngestDeps> = {}) {
  let clock = START
  const slept: number[] = []
  const d: IngestDeps = {
    cfg,
    sources: src,
    store,
    now: () => clock,
    sleep: async (ms) => {
      slept.push(ms)
      clock += ms
    },
    retryBaseMs: 10,
    ...extra,
  }
  return { d, slept }
}

/** Fonte que falha nas primeiras `failures` chamadas com o erro dado. */
function flaky<T extends ForecastSource | MarineSource>(inner: T, failures: number, err: () => Error): T & { calls: number } {
  const wrapped = {
    calls: 0,
    fetchPoint: async (req: Parameters<T['fetchPoint']>[0]) => {
      wrapped.calls++
      if (wrapped.calls <= failures) throw err()
      return inner.fetchPoint(req)
    },
  }
  return wrapped as unknown as T & { calls: number }
}

describe('runIngest', () => {
  it('rodada normal: 708 tentativas, 228 arquivos e linhas, closed', async () => {
    const store = new MemoryStore()
    const r = await runIngest(deps(store, sources()).d)
    expect(r).toMatchObject({ status: 'closed', attempts: 708, files: 228, runTime: '2026-11-17T20:15:03Z' })
    expect(store.reservations).toBe(708)
    expect(store.files.size).toBe(228)
    expect(store.layers).toHaveLength(228)
    expect(store.runs[0].status).toBe('closed')
    const row = store.layers.find((l) => l.region === 'bay' && l.layer === 'wind')!
    expect(row).toMatchObject({ bbox: [-44, -24, -42, -22], res: 0.25, expires_at: '2026-11-19T20:15:03Z' })
    expect(row.valid_time).toBe('2026-11-17T21:00:00Z')
  })

  it('arquivo de vento: U antes de V, 81 valores na baía', async () => {
    const store = new MemoryStore()
    await runIngest(deps(store, sources()).d)
    const body = JSON.parse(store.files.get('runs/2026-11-17T20-15-03Z/bay/wind/2026-11-17T21-00-00Z.json')!)
    expect(body[0].header.parameterNumber).toBe(2)
    expect(body[1].header.parameterNumber).toBe(3)
    expect(body[0].data).toHaveLength(81)
  })

  it('série curta: aborted, nada publicado, rodada anterior intacta', async () => {
    const store = new MemoryStore()
    await runIngest(deps(store, sources()).d)
    const before = new Map(store.files)
    const { d } = deps(store, sources({}, { mode: 'short' }))
    d.now = () => START + 6 * 3_600_000
    const r = await runIngest(d)
    expect(r).toMatchObject({ status: 'aborted', reason: 'incomplete_series', files: 0 })
    expect(store.files).toEqual(before)
    expect(store.runs.filter((x) => x.status === 'closed')).toHaveLength(1)
  })

  it('erro transitório: retry com espera crescente; cada tentativa conta', async () => {
    const store = new MemoryStore()
    const src = sources()
    src.forecast = flaky(src.forecast, 2, () => new SourceUnavailableError('HTTP 503', 503))
    const { d, slept } = deps(store, src, { concurrency: 1 })
    const r = await runIngest(d)
    expect(r.status).toBe('closed')
    expect(r.attempts).toBe(710)
    expect(slept.slice(0, 2)).toEqual([10, 30])
  })

  it('mais de INGEST_RETRY_MAX falhas seguidas: aborted', async () => {
    const store = new MemoryStore()
    const src = sources()
    src.marine = flaky(src.marine, 3, () => new SourceUnavailableError('HTTP 503', 503))
    const r = await runIngest(deps(store, src, { concurrency: 1 }).d)
    expect(r).toMatchObject({ status: 'aborted', reason: 'source_error', attempts: 4 })
  })

  it('INGEST_RETRY_MAX=3: aguenta 3 falhas seguidas no mesmo pedido', async () => {
    const store = new MemoryStore()
    const src = sources()
    src.marine = flaky(src.marine, 3, () => new SourceUnavailableError('connect timeout'))
    const { d, slept } = deps(store, src, { concurrency: 1 })
    d.cfg = loadConfig({ SOURCE_MODE: 'simulated', INGEST_RETRY_MAX: '3' })
    const r = await runIngest(d)
    expect(r).toMatchObject({ status: 'closed', attempts: 711 })
    expect(slept.slice(0, 3)).toEqual([10, 30, 90])
  })

  it('429 da fonte: sem nova tentativa, aborted', async () => {
    const store = new MemoryStore()
    const src = sources()
    const f = flaky(src.forecast, 1, () => new SourceRateLimitError('429'))
    src.forecast = f
    const r = await runIngest(deps(store, src, { concurrency: 1 }).d)
    expect(r).toMatchObject({ status: 'aborted', reason: 'rate_limited' })
    expect(f.calls).toBe(1)
  })

  it('teto da rodada (885): passa disso = aborted', async () => {
    const store = new MemoryStore()
    const src = sources()
    // Cada chamada falha 2 vezes antes de dar certo: 3 tentativas por pedido.
    let n = 0
    const inner = src.forecast
    src.forecast = {
      fetchPoint: async (req) => {
        if (++n % 3 !== 0) throw new SourceUnavailableError('HTTP 503', 503)
        return inner.fetchPoint(req)
      },
    }
    const r = await runIngest(deps(store, src, { concurrency: 1 }).d)
    expect(r).toMatchObject({ status: 'aborted', reason: 'round_budget', attempts: 885 })
    expect(store.reservations).toBe(885)
  })

  it('teto da rodada com 4 workers e reserva lenta: nunca passa de 885 chamadas', async () => {
    // A reserva no banco leva tempo: sem tomar a vaga antes do await, vários
    // workers passavam juntos pela checagem do teto.
    class SlowStore extends MemoryStore {
      override async reserve(): Promise<ReserveResult> {
        await new Promise((r) => setImmediate(r))
        return super.reserve()
      }
    }
    const store = new SlowStore()
    const src = sources()
    // Cada ponto falha 2 vezes antes de dar certo (contagem por coordenada, não global).
    const tries = new Map<string, number>()
    const inner = src.forecast
    src.forecast = {
      fetchPoint: async (req) => {
        const key = `${req.lat}:${req.lon}`
        const n = (tries.get(key) ?? 0) + 1
        tries.set(key, n)
        if (n <= 2) throw new SourceUnavailableError('HTTP 503', 503)
        return inner.fetchPoint(req)
      },
    }
    const r = await runIngest(deps(store, src, { concurrency: 4 }).d)
    expect(r).toMatchObject({ status: 'aborted', reason: 'round_budget' })
    expect(store.reservations).toBeLessThanOrEqual(885)
  })

  it('reserva negada por minuto: espera o próximo minuto e segue', async () => {
    const store = new MemoryStore()
    store.denyQueue = ['minute']
    const { d, slept } = deps(store, sources(), { concurrency: 1 })
    const r = await runIngest(d)
    expect(r.status).toBe('closed')
    expect(slept[0]).toBe(60_000 - (START % 60_000) + 250)
  })

  it('reserva negada pelo teto diário: aborted', async () => {
    const store = new MemoryStore()
    store.denyQueue = ['day']
    const r = await runIngest(deps(store, sources(), { concurrency: 1 }).d)
    expect(r).toMatchObject({ status: 'aborted', reason: 'daily_budget', attempts: 0 })
  })

  it('Supabase indisponível: aborta sem chamar a fonte', async () => {
    const store = new MemoryStore()
    store.down = true
    const src = sources()
    const f = flaky(src.forecast, 0, () => new Error('never'))
    src.forecast = f
    const r = await runIngest(deps(store, src).d)
    expect(r).toMatchObject({ status: 'aborted', runId: null, attempts: 0 })
    expect(f.calls).toBe(0)
  })

  it('limpeza: mantém só as 2 rodadas fechadas mais recentes', async () => {
    const store = new MemoryStore()
    for (let i = 0; i < 3; i++) {
      const { d } = deps(store, sources())
      d.now = () => START + i * 6 * 3_600_000
      expect((await runIngest(d)).status).toBe('closed')
    }
    expect(store.runs.map((r) => r.runTime).sort()).toEqual(['2026-11-18T02:15:03Z', '2026-11-18T08:15:03Z'])
    expect(store.files.size).toBe(456)
    expect(store.layers).toHaveLength(456)
    expect(store.cleaned).not.toBeNull()
  })
})

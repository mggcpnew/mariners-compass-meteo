// Job de ingestão (B6; AC-MVP-19). Coleta as grades wide e bay, gera os
// 228 arquivos (57 quadros × 2 camadas × 2 regiões) e só então fecha a rodada.
// Qualquer falha: rodada "aborted", arquivos dela removidos, anterior mantida.
import {
  FRAME_COUNT,
  LAYER_IDS,
  SourceRateLimitError,
  SourceUnavailableError,
  buildWavesFile,
  buildWindFile,
  formatUtc,
  frameTimes,
  parseUtc,
  regionGrids,
  regionPoints,
  selectFrames,
  storagePath,
  type AppConfig,
  type ForecastVariable,
  type GridPoint,
  type LayerId,
  type MarineVariable,
  type RegionGrid,
  type SeriesResult,
  type Sources,
} from '@mariners-compass/core'
import type { IngestStore, LayerRow } from './store.ts'

export class IngestAbort extends Error {
  override name = 'IngestAbort'
  readonly reason: string
  constructor(reason: string, detail?: string) {
    super(detail ? `${reason}: ${detail}` : reason)
    this.reason = reason
  }
}

export interface IngestDeps {
  cfg: AppConfig
  sources: Sources
  store: IngestStore
  now: () => number
  sleep: (ms: number) => Promise<void>
  log?: (msg: string) => void
  /** Requisições simultâneas à fonte. */
  concurrency?: number
  /** Espera base entre retries (cresce 3×). Padrão 15 s. */
  retryBaseMs?: number
}

export interface IngestResult {
  status: 'closed' | 'aborted'
  runTime: string
  runId: string | null
  attempts: number
  files: number
  reason?: string
}

const GRID_SOURCE = 'openmeteo'
const RETRY_BASE_MS = 15_000
const RETRY_FACTOR = 3
const KEEP_CLOSED_RUNS = 2
const POINT_CACHE_MAX_AGE_MS = 24 * 3_600_000
const QUOTA_WINDOW_MAX_AGE_MS = 2 * 24 * 3_600_000
/** Rodada "open" mais velha que isto é considerada órfã (job morto) e limpa. */
const STALE_OPEN_RUN_MS = 2 * 3_600_000

type Task = { region: number; point: number; kind: 'forecast' | 'marine'; at: GridPoint }

export async function runIngest(deps: IngestDeps): Promise<IngestResult> {
  const { cfg, sources, store, now, sleep } = deps
  const log = deps.log ?? (() => {})
  const runTime = formatUtc(Math.floor(now() / 1000) * 1000)
  const frames = frameTimes(runTime)
  const grids = regionGrids(cfg)
  const points = grids.map(regionPoints)
  const expectedFiles = frames.length * LAYER_IDS.length * grids.length

  let attempts = 0
  let runId: string | null = null
  const uploaded: string[] = []

  // Reserva antes de cada tentativa HTTP (conta a tentativa e aplica os tetos).
  async function reserveAttempt(): Promise<void> {
    for (;;) {
      if (attempts + 1 > cfg.ingest.roundBudget) {
        throw new IngestAbort('round_budget', `more than ${cfg.ingest.roundBudget} calls`)
      }
      const r = await store.reserve(now(), 'openmeteo_ingest', 1, cfg.ingest.dailyBudget, null, cfg.ingest.maxPerMin)
      if (r.allowed) {
        attempts++
        return
      }
      if (r.reason === 'minute') {
        const wait = 60_000 - (now() % 60_000) + 250
        log(`teto por minuto atingido; aguardando ${Math.round(wait / 1000)} s`)
        await sleep(wait)
        continue
      }
      throw new IngestAbort('daily_budget', `reserve denied (${r.reason})`)
    }
  }

  async function fetchWithRetry(task: Task) {
    for (let attempt = 0; ; attempt++) {
      await reserveAttempt()
      try {
        if (task.kind === 'forecast') {
          return await sources.forecast.fetchPoint({ ...task.at, days: cfg.forecastDays, windUnit: 'ms' })
        }
        return await sources.marine.fetchPoint({ ...task.at, days: cfg.forecastDays })
      } catch (err) {
        // Erro de limite da fonte: sem nova tentativa imediata (B6).
        if (err instanceof SourceRateLimitError) throw new IngestAbort('rate_limited', err.message)
        // Falha de rede ou HTTP de erro: espera crescente (15 s, 45 s, 135 s...).
        // Os runners do GitHub têm timeouts de conexão esporádicos com o Open-Meteo.
        if (err instanceof SourceUnavailableError && attempt < cfg.ingest.retryMax) {
          await sleep((deps.retryBaseMs ?? RETRY_BASE_MS) * RETRY_FACTOR ** attempt)
          continue
        }
        throw new IngestAbort('source_error', (err as Error).message)
      }
    }
  }

  try {
    // Lê/grava o Supabase antes de chamar a fonte: se ele estiver fora, nada é chamado.
    runId = await store.createRun({ source: GRID_SOURCE, model: sources.modelLabel, runTime })
    log(`rodada ${runTime} aberta (${runId}); ${points.reduce((a, p) => a + p.length, 0)} pontos`)

    const forecast: SeriesResult<ForecastVariable>[][] = grids.map(() => [])
    const marine: SeriesResult<MarineVariable>[][] = grids.map(() => [])
    const tasks: Task[] = []
    points.forEach((pts, r) =>
      pts.forEach((at, p) => {
        tasks.push({ region: r, point: p, kind: 'forecast', at })
        tasks.push({ region: r, point: p, kind: 'marine', at })
      }),
    )

    let next = 0
    let failed: unknown = null
    const worker = async () => {
      while (failed === null && next < tasks.length) {
        const task = tasks[next++]
        try {
          const res = await fetchWithRetry(task)
          if (task.kind === 'forecast') forecast[task.region][task.point] = res as SeriesResult<ForecastVariable>
          else marine[task.region][task.point] = res as SeriesResult<MarineVariable>
        } catch (err) {
          failed ??= err
        }
      }
    }
    await Promise.all(Array.from({ length: Math.max(1, deps.concurrency ?? 4) }, worker))
    if (failed !== null) throw failed
    log(`coleta concluída: ${attempts} chamadas`)

    // Recorte nos quadros; série curta = rodada incompleta (AC-MVP-19).
    const layers = grids.map((g, r) => framesFor(g, frames, forecast[r], marine[r]))

    const rows: LayerRow[] = []
    const expiresAt = formatUtc(parseUtc(runTime) + cfg.grid.expiredHours * 3_600_000)
    for (const [r, g] of grids.entries()) {
      for (const layer of LAYER_IDS) {
        for (const [f, validTime] of frames.entries()) {
          const body = buildFile(g, layer, validTime, layers[r], f)
          const path = storagePath(runTime, g.id, layer, validTime)
          await store.uploadFile(path, JSON.stringify(body))
          uploaded.push(path)
          rows.push({
            run_id: runId,
            region: g.id,
            layer,
            valid_time: validTime,
            bbox: [...g.bbox],
            res: g.res,
            storage_path: path,
            expires_at: expiresAt,
          })
        }
      }
    }
    await store.insertLayers(rows)
    const count = await store.countLayers(runId)
    if (count !== expectedFiles) throw new IngestAbort('incomplete_files', `${count} of ${expectedFiles}`)
    await store.setRunStatus(runId, 'closed')
    log(`rodada ${runTime} fechada: ${count} arquivos`)
    await cleanup(deps, log)
    return { status: 'closed', runTime, runId, attempts, files: count }
  } catch (err) {
    const reason = err instanceof IngestAbort ? err.reason : 'error'
    log(`rodada ${runTime} abortada: ${(err as Error).message}`)
    if (runId) await bestEffort(() => store.setRunStatus(runId!, 'aborted'), log)
    if (uploaded.length) await bestEffort(() => store.removeFiles(uploaded), log)
    if (runId) await cleanup(deps, log)
    return { status: 'aborted', runTime, runId, attempts, files: 0, reason }
  }
}

interface RegionFrames {
  speed: (number | null)[][]
  dir: (number | null)[][]
  height: (number | null)[][]
  waveDir: (number | null)[][]
}

/** Valores por quadro e ponto: speed[f][p]. */
function framesFor(
  g: RegionGrid,
  frames: string[],
  forecast: SeriesResult<ForecastVariable>[],
  marine: SeriesResult<MarineVariable>[],
): RegionFrames {
  const out: RegionFrames = { speed: [], dir: [], height: [], waveDir: [] }
  for (const key of Object.keys(out) as (keyof RegionFrames)[]) {
    out[key] = frames.map(() => new Array(g.nx * g.ny).fill(null))
  }
  const pick = (times: string[], values: (number | null)[], what: string) => {
    const sel = selectFrames(times, values, frames)
    if (!sel.complete) throw new IngestAbort('incomplete_series', `${g.id} ${what}: missing ${sel.missing.length} frames`)
    return sel.values
  }
  for (let p = 0; p < g.nx * g.ny; p++) {
    const fc = forecast[p]
    const mr = marine[p]
    if (fc.meta.units.wind_speed_10m !== 'm/s') {
      throw new IngestAbort('unexpected_unit', `wind_speed_10m in ${fc.meta.units.wind_speed_10m}`)
    }
    const series: [keyof RegionFrames, (number | null)[]][] = [
      ['speed', pick(fc.hourly.time, fc.hourly.wind_speed_10m, 'wind_speed_10m')],
      ['dir', pick(fc.hourly.time, fc.hourly.wind_direction_10m, 'wind_direction_10m')],
      ['height', pick(mr.hourly.time, mr.hourly.wave_height, 'wave_height')],
      ['waveDir', pick(mr.hourly.time, mr.hourly.wave_direction, 'wave_direction')],
    ]
    for (const [key, values] of series) values.forEach((v, f) => (out[key][f][p] = v))
  }
  if (out.speed.length !== FRAME_COUNT) throw new IngestAbort('incomplete_series', 'frame count')
  return out
}

function buildFile(g: RegionGrid, layer: LayerId, validTime: string, d: RegionFrames, f: number) {
  return layer === 'wind'
    ? buildWindFile(g, validTime, d.speed[f], d.dir[f])
    : buildWavesFile(g, validTime, d.height[f], d.waveDir[f])
}

async function bestEffort(fn: () => Promise<unknown>, log: (m: string) => void): Promise<void> {
  try {
    await fn()
  } catch (err) {
    log(`aviso: ${(err as Error).message}`)
  }
}

/** Mantém as 2 rodadas fechadas mais recentes; remove o resto e os caches velhos. */
async function cleanup(deps: IngestDeps, log: (m: string) => void): Promise<void> {
  const { store, cfg, now } = deps
  await bestEffort(async () => {
    const runs = await store.listRuns()
    const keep = new Set(runs.filter((r) => r.status === 'closed').slice(0, KEEP_CLOSED_RUNS).map((r) => r.id))
    const t = now()
    const removable = runs.filter(
      (r) => !keep.has(r.id) && (r.status !== 'open' || t - parseUtc(r.runTime) > STALE_OPEN_RUN_MS),
    )
    for (const run of removable) {
      // Caminhos são determinísticos: remove todos os possíveis da rodada.
      const paths = regionGrids(cfg).flatMap((g) =>
        LAYER_IDS.flatMap((layer) => frameTimes(run.runTime).map((vt) => storagePath(run.runTime, g.id, layer, vt))),
      )
      await store.removeFiles(paths)
      await store.deleteRun(run.id)
      log(`rodada ${run.runTime} (${run.status}) removida`)
    }
    await store.cleanupCaches(formatUtc(t - POINT_CACHE_MAX_AGE_MS), formatUtc(t - QUOTA_WINDOW_MAX_AGE_MS))
  }, log)
}

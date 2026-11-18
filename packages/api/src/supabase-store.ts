// ApiStore sobre o Supabase com o papel de serviço. Só roda nas Functions.
import { createClient } from '@supabase/supabase-js'
import { formatUtc } from '@mariners-compass/core'
import { StoreUnavailableError, type ApiStore, type NoticeRow, type PointReserveReason, type RunInfo } from './store.ts'

/** Tempo máximo de uma ida ao Supabase; depois disso, fail-closed. */
const STORE_TIMEOUT_MS = 8000

type Result<T> = { data: T; error: { message: string } | null }

function check<T>(res: Result<T>, what: string): T {
  if (res.error) throw new StoreUnavailableError(`supabase ${what}: ${res.error.message}`)
  return res.data
}

async function guard<T>(what: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    if (err instanceof StoreUnavailableError) throw err
    throw new StoreUnavailableError(`supabase ${what}: ${(err as Error).message}`)
  }
}

interface RunRow {
  id: string
  source: string
  model: string
  run_time: string
  ingested_at: string
  status: RunInfo['status']
}

const toRun = (r: RunRow | null): RunInfo | null =>
  r && {
    id: r.id,
    source: r.source,
    model: r.model,
    runTime: formatUtc(Date.parse(r.run_time)),
    ingestedAt: formatUtc(Date.parse(r.ingested_at)),
    status: r.status,
  }

const iso = (v: string | null | undefined) => (v ? formatUtc(Date.parse(v)) : null)

export function createSupabaseApiStore(url: string, serviceRoleKey: string, bucket: string): ApiStore {
  const db = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(STORE_TIMEOUT_MS) }) },
  })
  const runCols = 'id, source, model, run_time, ingested_at, status'

  return {
    latestClosedRun: () =>
      guard('latest run', async () => {
        const rows = check(
          await db.from('model_runs').select(runCols).eq('status', 'closed').order('run_time', { ascending: false }).limit(1),
          'latest run',
        ) as RunRow[]
        return toRun(rows[0] ?? null)
      }),

    closedRunByTime: (runTime) =>
      guard('run by time', async () => {
        const rows = check(
          await db.from('model_runs').select(runCols).eq('status', 'closed').eq('run_time', runTime).limit(1),
          'run by time',
        ) as RunRow[]
        return toRun(rows[0] ?? null)
      }),

    layerPath: (runId, region, layer, validTime) =>
      guard('layer path', async () => {
        const rows = check(
          await db
            .from('grid_layers')
            .select('storage_path')
            .eq('run_id', runId)
            .eq('region', region)
            .eq('layer', layer)
            .eq('valid_time', validTime)
            .limit(1),
          'layer path',
        ) as { storage_path: string }[]
        return rows[0]?.storage_path ?? null
      }),

    downloadGrid: (path) =>
      guard('download', async () => {
        const res = await db.storage.from(bucket).download(path)
        if (res.error) {
          // Objeto inexistente = null; o resto é indisponibilidade.
          const status = (res.error as { status?: number; statusCode?: string }).status
          if (status === 400 || status === 404) return null
          throw new StoreUnavailableError(`supabase download: ${res.error.message}`)
        }
        return await res.data.text()
      }),

    getPointCache: (key) =>
      guard('point cache', async () => {
        const rows = check(
          await db.from('point_cache').select('key, status, fetched_at, payload').eq('key', key).limit(1),
          'point cache',
        ) as { key: string; status: unknown; fetched_at: string; payload: unknown }[]
        const r = rows[0]
        return r ? { ...r, fetched_at: iso(r.fetched_at) } : null
      }),

    putPointCache: (row) =>
      guard('put point cache', async () => {
        check(await db.from('point_cache').upsert(row, { onConflict: 'key' }), 'put point cache')
      }),

    reservePoint: (req) =>
      guard('reserve', async () => {
        const at = formatUtc(req.atMs)
        const res = req.clientHash
          ? await db.rpc('reserve_point_calls', {
              p_at: at,
              p_client_hash: req.clientHash,
              p_n: req.n,
              p_day_limit: req.dayLimit,
              p_hour_limit: req.hourLimit,
              p_minute_limit: req.minuteLimit,
              p_client_hour_limit: req.clientHourLimit,
              p_client_day_limit: req.clientDayLimit,
            })
          : await db.rpc('reserve_calls', {
              p_at: at,
              p_source: 'openmeteo_point',
              p_n: req.n,
              p_day_limit: req.dayLimit,
              p_hour_limit: req.hourLimit,
              p_minute_limit: req.minuteLimit,
            })
        const rows = check(res, 'reserve') as { allowed: boolean; reason: PointReserveReason | null }[]
        const row = rows?.[0]
        if (!row) throw new StoreUnavailableError('supabase reserve: empty result')
        return { allowed: row.allowed, reason: row.reason }
      }),

    validNotices: (nowIso) =>
      guard('notices', async () => {
        const rows = check(
          await db
            .from('official_notices')
            .select('id, title, body, issued_at, valid_until, source_url, registered_at')
            .or(`valid_until.is.null,valid_until.gt.${nowIso}`)
            .order('registered_at', { ascending: false }),
          'notices',
        ) as NoticeRow[]
        return rows.map((n) => ({
          ...n,
          issued_at: iso(n.issued_at),
          valid_until: iso(n.valid_until),
          registered_at: iso(n.registered_at)!,
        }))
      }),

    lastRegisteredAt: () =>
      guard('last registered', async () => {
        const rows = check(
          await db.from('official_notices').select('registered_at').order('registered_at', { ascending: false }).limit(1),
          'last registered',
        ) as { registered_at: string }[]
        return iso(rows[0]?.registered_at)
      }),

    lastCheckedAt: () =>
      guard('last checked', async () => {
        const rows = check(
          await db.from('notice_checks').select('checked_at').order('checked_at', { ascending: false }).limit(1),
          'last checked',
        ) as { checked_at: string }[]
        return iso(rows[0]?.checked_at)
      }),
  }
}

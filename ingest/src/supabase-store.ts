// IngestStore sobre o Supabase (papel de serviço). Usado só pelo job, nunca no front.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { formatUtc } from '@mariners-compass/core'
import type { IngestStore, LayerRow, ReserveResult, RunRow, RunStatus } from './store.ts'

const REMOVE_CHUNK = 100

function check<T>(res: { data: T; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`supabase ${what}: ${res.error.message}`)
  return res.data
}

export function createSupabaseStore(url: string, serviceRoleKey: string, bucket: string): IngestStore {
  const db: SupabaseClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  const storage = () => db.storage.from(bucket)

  return {
    async reserve(atMs, source, n, dayLimit, hourLimit, minuteLimit): Promise<ReserveResult> {
      const rows = check(
        await db.rpc('reserve_calls', {
          p_at: formatUtc(atMs),
          p_source: source,
          p_n: n,
          p_day_limit: dayLimit,
          p_hour_limit: hourLimit,
          p_minute_limit: minuteLimit,
        }),
        'reserve_calls',
      ) as { allowed: boolean; reason: ReserveResult['reason'] }[]
      const row = rows?.[0]
      if (!row) throw new Error('supabase reserve_calls: empty result')
      return { allowed: row.allowed, reason: row.reason }
    },

    async createRun({ source, model, runTime }) {
      const row = check(
        await db.from('model_runs').insert({ source, model, run_time: runTime, status: 'open' }).select('id').single(),
        'create run',
      ) as { id: string }
      return row.id
    },

    async setRunStatus(runId, status) {
      check(await db.from('model_runs').update({ status }).eq('id', runId), 'set run status')
    },

    async uploadFile(path, body) {
      check(await storage().upload(path, body, { contentType: 'application/json', upsert: false }), `upload ${path}`)
    },

    async removeFiles(paths) {
      for (let i = 0; i < paths.length; i += REMOVE_CHUNK) {
        check(await storage().remove(paths.slice(i, i + REMOVE_CHUNK)), 'remove files')
      }
    },

    async insertLayers(rows: LayerRow[]) {
      check(await db.from('grid_layers').insert(rows), 'insert grid_layers')
    },

    async countLayers(runId) {
      const res = await db.from('grid_layers').select('id', { count: 'exact', head: true }).eq('run_id', runId)
      if (res.error) throw new Error(`supabase count grid_layers: ${res.error.message}`)
      return res.count ?? 0
    },

    async listRuns(): Promise<RunRow[]> {
      const rows = check(
        await db.from('model_runs').select('id, run_time, status').order('run_time', { ascending: false }),
        'list runs',
      ) as { id: string; run_time: string; status: RunStatus }[]
      return rows.map((r) => ({ id: r.id, runTime: formatUtc(Date.parse(r.run_time)), status: r.status }))
    },

    async deleteRun(runId) {
      check(await db.from('model_runs').delete().eq('id', runId), 'delete run')
    },

    async cleanupCaches(pointBefore, windowBefore) {
      check(await db.from('point_cache').delete().lt('fetched_at', pointBefore), 'cleanup point_cache')
      check(await db.from('quota_window').delete().lt('bucket_start', windowBefore), 'cleanup quota_window')
      check(await db.from('client_quota').delete().lt('bucket_start', windowBefore), 'cleanup client_quota')
    },
  }
}

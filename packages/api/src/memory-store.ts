// ApiStore em memória para testes. A reserva segue a mesma regra das RPCs
// reserve_calls / reserve_point_calls (dia global primeiro; depois cliente;
// depois hora e minuto; negada não incrementa nada).
import type { ApiStore, NoticeRow, PointCacheRow, PointReserveReason, PointReserveRequest, RunInfo } from './store.ts'
import { StoreUnavailableError } from './store.ts'

const bucket = (ms: number, size: number) => Math.floor(ms / size) * size

export class MemoryApiStore implements ApiStore {
  runs: RunInfo[] = []
  layers: { runId: string; region: string; layer: string; validTime: string; path: string }[] = []
  files = new Map<string, string>()
  cache = new Map<string, PointCacheRow>()
  notices: NoticeRow[] = []
  checks: string[] = []
  counters = new Map<string, number>()
  down = false
  reserveCalls = 0

  private guard() {
    if (this.down) throw new StoreUnavailableError('supabase down')
  }
  calls(kind: 'day' | 'hour' | 'minute', atMs: number): number {
    const size = kind === 'day' ? 86_400_000 : kind === 'hour' ? 3_600_000 : 60_000
    return this.counters.get(`g:${kind}:${bucket(atMs, size)}`) ?? 0
  }

  async latestClosedRun() {
    this.guard()
    return this.runs.filter((r) => r.status === 'closed').sort((a, b) => (a.runTime < b.runTime ? 1 : -1))[0] ?? null
  }
  async closedRunByTime(t: string) {
    this.guard()
    return this.runs.find((r) => r.status === 'closed' && r.runTime === t) ?? null
  }
  async layerPath(runId: string, region: string, layer: string, validTime: string) {
    this.guard()
    return this.layers.find((l) => l.runId === runId && l.region === region && l.layer === layer && l.validTime === validTime)?.path ?? null
  }
  async downloadGrid(path: string) {
    this.guard()
    return this.files.get(path) ?? null
  }
  async getPointCache(key: string) {
    this.guard()
    return this.cache.get(key) ?? null
  }
  async putPointCache(row: { key: string; status: 'ok' | 'partial'; fetched_at: string; payload: unknown }) {
    this.guard()
    this.cache.set(row.key, structuredClone(row))
  }
  async reservePoint(req: PointReserveRequest): Promise<{ allowed: boolean; reason: PointReserveReason | null }> {
    this.guard()
    this.reserveCalls++
    const keys = {
      day: `g:day:${bucket(req.atMs, 86_400_000)}`,
      hour: `g:hour:${bucket(req.atMs, 3_600_000)}`,
      minute: `g:minute:${bucket(req.atMs, 60_000)}`,
      cday: `c:${req.clientHash}:day:${bucket(req.atMs, 86_400_000)}`,
      chour: `c:${req.clientHash}:hour:${bucket(req.atMs, 3_600_000)}`,
    }
    const get = (k: string) => this.counters.get(k) ?? 0
    const over = (k: string, limit: number | null) => limit !== null && get(k) + req.n > limit
    let reason: PointReserveReason | null = null
    if (req.clientHash) {
      if (over(keys.cday, req.clientDayLimit)) reason = 'client_day'
      else if (over(keys.chour, req.clientHourLimit)) reason = 'client_hour'
      if (reason && over(keys.day, req.dayLimit)) reason = 'day'
      if (reason) return { allowed: false, reason }
    }
    if (over(keys.day, req.dayLimit)) reason = 'day'
    else if (over(keys.hour, req.hourLimit)) reason = 'hour'
    else if (over(keys.minute, req.minuteLimit)) reason = 'minute'
    if (reason) return { allowed: false, reason }
    for (const k of [keys.day, keys.hour, keys.minute, ...(req.clientHash ? [keys.cday, keys.chour] : [])]) {
      this.counters.set(k, get(k) + req.n)
    }
    return { allowed: true, reason: null }
  }
  async validNotices(nowIso: string) {
    this.guard()
    return this.notices.filter((n) => n.valid_until === null || n.valid_until > nowIso)
  }
  async lastRegisteredAt() {
    this.guard()
    return this.notices.map((n) => n.registered_at).sort().at(-1) ?? null
  }
  async lastCheckedAt() {
    this.guard()
    return [...this.checks].sort().at(-1) ?? null
  }
}

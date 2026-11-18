// Persistência usada pelas Functions. Qualquer falha de acesso ao Supabase
// vira StoreUnavailableError, que a API responde como 503 service_unavailable
// (fail-closed: o /point não chama a fonte).

export class StoreUnavailableError extends Error {
  override name = 'StoreUnavailableError'
}

export interface RunInfo {
  id: string
  source: string
  model: string
  runTime: string
  ingestedAt: string
  status: 'open' | 'closed' | 'aborted'
}

export interface PointCacheRow {
  key: string
  status: unknown
  fetched_at: unknown
  payload: unknown
}

export type PointReserveReason = 'day' | 'hour' | 'minute' | 'client_day' | 'client_hour'

export interface PointReserveRequest {
  atMs: number
  /** HMAC do IP (hex); null = limite por cliente desligado. */
  clientHash: string | null
  n: number
  dayLimit: number
  hourLimit: number
  minuteLimit: number
  clientHourLimit: number | null
  clientDayLimit: number | null
}

export interface NoticeRow {
  id: string
  title: string
  body: string
  issued_at: string | null
  valid_until: string | null
  source_url: string
  registered_at: string
}

export interface ApiStore {
  latestClosedRun(): Promise<RunInfo | null>
  closedRunByTime(runTime: string): Promise<RunInfo | null>
  layerPath(runId: string, region: string, layer: string, validTime: string): Promise<string | null>
  /** Conteúdo do arquivo no Storage, ou null se não existir. */
  downloadGrid(path: string): Promise<string | null>
  getPointCache(key: string): Promise<PointCacheRow | null>
  putPointCache(row: { key: string; status: 'ok' | 'partial'; fetched_at: string; payload: unknown }): Promise<void>
  reservePoint(req: PointReserveRequest): Promise<{ allowed: boolean; reason: PointReserveReason | null }>
  validNotices(nowIso: string): Promise<NoticeRow[]>
  lastRegisteredAt(): Promise<string | null>
  lastCheckedAt(): Promise<string | null>
}

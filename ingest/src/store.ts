// Contrato de persistência do job. A implementação real usa o Supabase
// (supabase-store.ts); os testes usam uma versão em memória.

export type QuotaSource = 'openmeteo_ingest' | 'openmeteo_point'
export type RunStatus = 'open' | 'closed' | 'aborted'

export interface ReserveResult {
  allowed: boolean
  reason: 'day' | 'hour' | 'minute' | null
}

export interface LayerRow {
  run_id: string
  region: string
  layer: string
  valid_time: string
  bbox: number[]
  res: number
  storage_path: string
  expires_at: string
}

export interface RunRow {
  id: string
  runTime: string
  status: RunStatus
}

export interface IngestStore {
  /** RPC reserve_calls: registra a tentativa e aplica os tetos, ANTES de chamar a fonte. */
  reserve(
    atMs: number,
    source: QuotaSource,
    n: number,
    dayLimit: number | null,
    hourLimit: number | null,
    minuteLimit: number | null,
  ): Promise<ReserveResult>
  createRun(run: { source: string; model: string; runTime: string }): Promise<string>
  setRunStatus(runId: string, status: Exclude<RunStatus, 'open'>): Promise<void>
  uploadFile(path: string, body: string): Promise<void>
  removeFiles(paths: string[]): Promise<void>
  insertLayers(rows: LayerRow[]): Promise<void>
  countLayers(runId: string): Promise<number>
  /** Rodadas em ordem decrescente de run_time. */
  listRuns(): Promise<RunRow[]>
  /** Apaga a rodada (grid_layers sai em cascata). */
  deleteRun(runId: string): Promise<void>
  /**
   * Remove point_cache com fetched_at < pointBefore, e quota_window e
   * client_quota (hash do IP) com bucket_start < windowBefore.
   */
  cleanupCaches(pointBefore: string, windowBefore: string): Promise<void>
}

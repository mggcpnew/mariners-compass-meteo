// Vencimento das rodadas (/frames, AC-MVP-07) e estados do cache do /point (AC-MVP-26).
import { parseUtc } from './time.ts'

export type RunFreshness = 'ok' | 'stale' | 'expired'

export interface RunFreshnessConfig {
  staleHours: number // GRID_STALE_HOURS, padrão 18
  expiredHours: number // GRID_EXPIRED_HOURS, padrão 48
}

/** Idade do run_time: mais de staleHours = stale; mais de expiredHours = expired. */
export function classifyRun(runTime: string, nowMs: number, cfg: RunFreshnessConfig): RunFreshness {
  const ageMs = nowMs - parseUtc(runTime)
  if (ageMs > cfg.expiredHours * 3_600_000) return 'expired'
  if (ageMs > cfg.staleHours * 3_600_000) return 'stale'
  return 'ok'
}

export interface PointCacheConfig {
  okTtlS: number // POINT_CACHE_TTL_S, padrão 10800 (3 h)
  partialTtlS: number // POINT_PARTIAL_TTL_S, padrão 900 (15 min)
  staleMaxS: number // POINT_STALE_MAX_S, padrão 21600 (6 h)
}

export interface PointCacheEntry {
  status: unknown
  fetched_at: unknown
  payload: unknown
}

export type PointCacheDecision =
  | { kind: 'hit'; status: 'ok' | 'partial' }
  /** staleFallback: a entrada pode ser servida como "stale" se a fonte não puder ser consultada. */
  | { kind: 'miss'; staleFallback: boolean }

function isReadable(
  entry: PointCacheEntry,
): entry is { status: 'ok' | 'partial'; fetched_at: string; payload: object } {
  if (entry.status !== 'ok' && entry.status !== 'partial') return false
  if (typeof entry.fetched_at !== 'string' || !Number.isFinite(Date.parse(entry.fetched_at))) return false
  return typeof entry.payload === 'object' && entry.payload !== null
}

/**
 * Decide hit ou miss para uma entrada do point_cache (B7, "Estados do cache").
 * Entrada ausente ou ilegível = miss sem fallback (tratada como ausente).
 */
export function classifyPointCache(
  entry: PointCacheEntry | null,
  nowMs: number,
  cfg: PointCacheConfig,
): PointCacheDecision {
  if (!entry || !isReadable(entry)) return { kind: 'miss', staleFallback: false }
  const ageS = Math.max(0, (nowMs - Date.parse(entry.fetched_at)) / 1000)
  if (entry.status === 'ok' && ageS <= cfg.okTtlS) return { kind: 'hit', status: 'ok' }
  if (entry.status === 'partial' && ageS <= cfg.partialTtlS) return { kind: 'hit', status: 'partial' }
  return { kind: 'miss', staleFallback: ageS <= cfg.staleMaxS }
}

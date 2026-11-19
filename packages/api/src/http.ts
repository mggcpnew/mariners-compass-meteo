// Respostas da API v1 (B7). Erros: { error: { code, message } } com no-store.

export type ErrorCode =
  | 'invalid_coordinates'
  | 'invalid_parameter'
  | 'run_not_found'
  | 'not_found'
  | 'method_not_allowed'
  | 'rate_limited'
  | 'quota_exhausted'
  | 'data_expired'
  | 'service_unavailable'
  | 'not_implemented'

const STATUS: Record<ErrorCode, number> = {
  invalid_coordinates: 422,
  invalid_parameter: 422,
  run_not_found: 404,
  not_found: 404,
  method_not_allowed: 405,
  rate_limited: 429,
  quota_exhausted: 503,
  data_expired: 503,
  service_unavailable: 503,
  not_implemented: 501,
}

const JSON_TYPE = 'application/json; charset=utf-8'

export function json(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'Content-Type': JSON_TYPE, ...init.headers },
  })
}

export function errorResponse(code: ErrorCode, message: string, headers: Record<string, string> = {}): Response {
  return json({ error: { code, message } }, { status: STATUS[code], headers: { ...headers, 'Cache-Control': 'no-store' } })
}

export const cachePublic = (maxAgeS: number): Record<string, string> => ({
  'Cache-Control': `public, max-age=${maxAgeS}`,
})

/** Segundos até o início da próxima janela UTC (Retry-After). */
export function secondsUntilNext(nowMs: number, window: 'minute' | 'hour' | 'day'): number {
  const size = window === 'minute' ? 60_000 : window === 'hour' ? 3_600_000 : 86_400_000
  return Math.max(1, Math.ceil((Math.floor(nowMs / size) * size + size - nowMs) / 1000))
}

export const ATTRIBUTION_OPEN_METEO = 'Dados: Open-Meteo.com (CC BY 4.0)'
export const ATTRIBUTION_NAVY = 'Fonte: Marinha do Brasil, CHM/DHN'
export { NAVY_BULLETIN_URL } from '@mariners-compass/core'

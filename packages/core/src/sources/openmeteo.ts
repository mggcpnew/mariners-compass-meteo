// Adaptadores reais do Open-Meteo (B5). Uma coordenada por requisição (padrão
// mantido: a regra de cota para várias coordenadas não está documentada; T-07/T-14).
// Sem retry aqui: quem chama decide (job com retry limitado; /point sem retry).
import { normalizeGmt } from '../time.ts'
import {
  FORECAST_VARIABLES,
  MARINE_VARIABLES,
  MAX_DAYS_PER_REQUEST,
  MAX_VARIABLES_PER_REQUEST,
  SourceConfigError,
  SourceRateLimitError,
  SourceRequestError,
  SourceUnavailableError,
  type ForecastSource,
  type ForecastVariable,
  type MarineSource,
  type MarineVariable,
  type PointRequest,
  type SeriesResult,
  type SourceKind,
} from './types.ts'

export type FetchLike = (url: string) => Promise<Pick<Response, 'ok' | 'status' | 'json'>>

export interface OpenMeteoOptions {
  /** Endpoint completo (OPENMETEO_FORECAST_URL ou OPENMETEO_MARINE_URL). Sem ele: fail-closed. */
  url: string | null
  /** Parâmetro models (OPENMETEO_MODEL_*); vazio = a fonte escolhe ("auto"). */
  model: string | null
  fetch: FetchLike
}

/** Mensagem com a causa encadeada (o fetch do Node põe o motivo real em `cause`). */
function describeError(err: unknown): string {
  const parts: string[] = []
  let cur: unknown = err
  for (let depth = 0; cur && depth < 4; depth++) {
    const e = cur as { message?: unknown; code?: unknown; cause?: unknown }
    const code = typeof e.code === 'string' ? `${e.code}: ` : ''
    parts.push(`${code}${String(e.message ?? cur)}`)
    cur = e.cause
  }
  return parts.join(' <- ')
}

function validate(req: PointRequest, variableCount: number): void {
  if (!Number.isFinite(req.lat) || req.lat < -90 || req.lat > 90) throw new SourceRequestError('invalid latitude')
  if (!Number.isFinite(req.lon) || req.lon < -180 || req.lon > 180) throw new SourceRequestError('invalid longitude')
  if (!Number.isInteger(req.days) || req.days < 1 || req.days > MAX_DAYS_PER_REQUEST) {
    throw new SourceRequestError(`days must be 1..${MAX_DAYS_PER_REQUEST}`)
  }
  if (variableCount > MAX_VARIABLES_PER_REQUEST) {
    throw new SourceRequestError(`at most ${MAX_VARIABLES_PER_REQUEST} variables per request`)
  }
}

function normalizeUnit(unit: unknown): string {
  if (typeof unit !== 'string') return 'unknown'
  return unit === '°' ? 'deg' : unit
}

async function request<V extends string>(
  kind: SourceKind,
  opts: OpenMeteoOptions,
  req: PointRequest,
  variables: readonly V[],
  extra: Record<string, string>,
): Promise<SeriesResult<V>> {
  if (!opts.url) {
    throw new SourceConfigError(`Open-Meteo ${kind} URL not configured (OPENMETEO_${kind.toUpperCase()}_URL)`)
  }
  validate(req, variables.length)

  const u = new URL(opts.url)
  u.searchParams.set('latitude', String(req.lat))
  u.searchParams.set('longitude', String(req.lon))
  u.searchParams.set('hourly', variables.join(','))
  u.searchParams.set('forecast_days', String(req.days))
  u.searchParams.set('timezone', 'GMT')
  for (const [k, v] of Object.entries(extra)) u.searchParams.set(k, v)
  if (opts.model) u.searchParams.set('models', opts.model)
  const url = u.toString()

  req.onAttempt?.({ source: kind, url })
  let res: Awaited<ReturnType<FetchLike>>
  try {
    res = await opts.fetch(url)
  } catch (err) {
    throw new SourceUnavailableError(`Open-Meteo ${kind}: network error (${describeError(err)})`)
  }
  if (res.status === 429) throw new SourceRateLimitError(`Open-Meteo ${kind}: rate limited (429)`)
  if (!res.ok) throw new SourceUnavailableError(`Open-Meteo ${kind}: HTTP ${res.status}`, res.status)

  let body: unknown
  try {
    body = await res.json()
  } catch {
    throw new SourceUnavailableError(`Open-Meteo ${kind}: invalid JSON`, res.status)
  }
  return parse(kind, body, variables, opts.model ?? 'auto')
}

function parse<V extends string>(kind: SourceKind, body: unknown, variables: readonly V[], model: string): SeriesResult<V> {
  const malformed = (why: string) => new SourceUnavailableError(`Open-Meteo ${kind}: malformed response (${why})`)
  if (typeof body !== 'object' || body === null) throw malformed('not an object')
  const b = body as Record<string, unknown>
  const hourly = b.hourly as Record<string, unknown> | undefined
  const units = (b.hourly_units ?? {}) as Record<string, unknown>
  if (!hourly || !Array.isArray(hourly.time)) throw malformed('missing hourly.time')
  if (typeof b.latitude !== 'number' || typeof b.longitude !== 'number') throw malformed('missing coordinates')

  let time: string[]
  try {
    time = (hourly.time as unknown[]).map((t) => normalizeGmt(String(t)))
  } catch {
    throw malformed('unexpected time format')
  }

  const series = {} as Record<V, (number | null)[]>
  const outUnits = { time: 'iso8601' } as Record<'time' | V, string>
  for (const v of variables) {
    const arr = hourly[v]
    if (!Array.isArray(arr) || arr.length !== time.length) throw malformed(`bad series ${v}`)
    // Ausente é null, nunca zero.
    series[v] = arr.map((x) => (typeof x === 'number' && Number.isFinite(x) ? x : null))
    outUnits[v] = normalizeUnit(units[v])
  }

  return {
    meta: { source: `openmeteo-${kind}`, model, units: outUnits, latitude: b.latitude, longitude: b.longitude },
    hourly: { time, ...series },
  }
}

export function createOpenMeteoForecast(opts: OpenMeteoOptions): ForecastSource {
  return {
    fetchPoint: (req) =>
      request<ForecastVariable>('forecast', opts, req, FORECAST_VARIABLES, { wind_speed_unit: req.windUnit ?? 'ms' }),
  }
}

export function createOpenMeteoMarine(opts: OpenMeteoOptions): MarineSource {
  return {
    fetchPoint: (req) => request<MarineVariable>('marine', opts, req, MARINE_VARIABLES, {}),
  }
}

// GET /api/v1/point?lat=&lon=&vars=&hours= (B7). Única Function que chama o
// Open-Meteo (AC-MVP-16), sempre depois de reservar a cota (reserve_*).
// Ordem: Supabase fora = 503 sem chamar a fonte; hit; miss -> reserva ->
// forecast e marine em paralelo, sem retry; falha parcial = "partial";
// sem dado utilizável = "stale" (até 6 h) ou 503.
import {
  FORECAST_VARIABLES,
  MARINE_VARIABLES,
  classifyPointCache,
  floorToHourUtc,
  formatUtc,
  pointOperatingDailyLimit,
  type ForecastVariable,
  type MarineVariable,
  type SeriesResult,
} from '@mariners-compass/core'
import type { PointContext } from './context.ts'
import { ATTRIBUTION_OPEN_METEO, errorResponse, json, secondsUntilNext } from './http.ts'
import type { PointReserveReason } from './store.ts'

export const POINT_VARIABLES = [...FORECAST_VARIABLES, ...MARINE_VARIABLES] as const
export type PointVariable = (typeof POINT_VARIABLES)[number]

/** Unidades da resposta do /point (B7): vento e rajada em nós. */
export const POINT_UNITS: Record<'time' | PointVariable, string> = {
  time: 'iso8601',
  wind_speed_10m: 'kn',
  wind_gusts_10m: 'kn',
  wind_direction_10m: 'deg',
  wave_height: 'm',
  wave_direction: 'deg',
  wave_period: 's',
  wind_wave_height: 'm',
  wind_wave_direction: 'deg',
  wind_wave_period: 's',
  swell_wave_height: 'm',
  swell_wave_direction: 'deg',
  swell_wave_period: 's',
}

// bbox amplo (B7): lat -35..5, lon -54..-30.
const LAT = [-35, 5] as const
const LON = [-54, -30] as const
const MAX_HOURS = 168
const POINT_SOURCE = 'openmeteo'

export interface PointPayload {
  version: 1
  model: string
  hourly: { time: string[] } & Record<PointVariable, (number | null)[]>
}

type Parsed =
  | { ok: true; lat: number; lon: number; vars: PointVariable[]; hours: number }
  | { ok: false; response: Response }

const tidy = (x: number) => Math.round(x * 1e6) / 1e6

export function roundCoord(x: number, step: number): number {
  return tidy(Math.round(x / step) * step)
}

export function cacheKey(lat: number, lon: number): string {
  return `${lat}:${lon}`
}

function parse(q: URLSearchParams): Parsed {
  const fail = (code: 'invalid_coordinates' | 'invalid_parameter', msg: string): Parsed => ({
    ok: false,
    response: errorResponse(code, msg),
  })
  const latRaw = q.get('lat')
  const lonRaw = q.get('lon')
  const lat = latRaw === null || latRaw.trim() === '' ? NaN : Number(latRaw)
  const lon = lonRaw === null || lonRaw.trim() === '' ? NaN : Number(lonRaw)
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < LAT[0] || lat > LAT[1] || lon < LON[0] || lon > LON[1]) {
    return fail('invalid_coordinates', `lat must be ${LAT[0]}..${LAT[1]} and lon ${LON[0]}..${LON[1]}`)
  }
  const hoursRaw = q.get('hours')
  const hours = hoursRaw === null ? MAX_HOURS : /^\d+$/.test(hoursRaw) ? Number(hoursRaw) : NaN
  if (!Number.isInteger(hours) || hours < 1 || hours > MAX_HOURS) {
    return fail('invalid_parameter', `hours must be an integer from 1 to ${MAX_HOURS}`)
  }
  const varsRaw = q.get('vars')
  const vars = varsRaw === null || varsRaw === '' ? [...POINT_VARIABLES] : varsRaw.split(',').map((v) => v.trim())
  const unknown = vars.filter((v) => !(POINT_VARIABLES as readonly string[]).includes(v))
  if (unknown.length) return fail('invalid_parameter', `unknown vars: ${unknown.join(', ')}`)
  return { ok: true, lat, lon, vars: [...new Set(vars)] as PointVariable[], hours }
}

/** Payload do cache legível? (estrutura mínima; senão é "cache com erro" = miss). */
function readPayload(p: unknown): PointPayload | null {
  if (typeof p !== 'object' || p === null) return null
  const payload = p as Partial<PointPayload>
  const h = payload.hourly as Record<string, unknown> | undefined
  if (payload.version !== 1 || !h || !Array.isArray(h.time)) return null
  const n = (h.time as unknown[]).length
  for (const v of POINT_VARIABLES) if (!Array.isArray(h[v]) || (h[v] as unknown[]).length !== n) return null
  return payload as PointPayload
}

function merge(
  model: string,
  fc: SeriesResult<ForecastVariable> | null,
  mr: SeriesResult<MarineVariable> | null,
): PointPayload {
  const time = (fc ?? mr)!.hourly.time
  const hourly = { time } as PointPayload['hourly']
  const fill = <V extends string>(src: SeriesResult<V> | null, vars: readonly V[]) => {
    const index = src ? new Map(src.hourly.time.map((t, i) => [t, i])) : null
    for (const v of vars) {
      const series = src?.hourly[v]
      ;(hourly as Record<string, (number | null)[]>)[v] = time.map((t) => {
        const i = index?.get(t)
        return i === undefined || !series ? null : (series[i] ?? null)
      })
    }
  }
  fill(fc, FORECAST_VARIABLES)
  fill(mr, MARINE_VARIABLES)
  return { version: 1, model, hourly }
}

function respond(
  payload: PointPayload,
  status: 'ok' | 'partial' | 'stale',
  fetchedAt: string,
  p: { lat: number; lon: number; vars: PointVariable[]; hours: number; requested: { lat: number; lon: number } },
  ctx: PointContext,
): Response {
  const start = formatUtc(floorToHourUtc(ctx.now()))
  const from = payload.hourly.time.findIndex((t) => t >= start)
  const idx = from < 0 ? payload.hourly.time.length : from
  const slice = <T>(a: T[]) => a.slice(idx, idx + p.hours)
  const hourly: Record<string, unknown> = { time: slice(payload.hourly.time) }
  const units: Record<string, string> = { time: POINT_UNITS.time }
  for (const v of p.vars) {
    hourly[v] = slice(payload.hourly[v])
    units[v] = POINT_UNITS[v]
  }
  return json(
    {
      meta: {
        source: POINT_SOURCE,
        model: payload.model,
        run_time: null,
        updated_at: fetchedAt,
        units,
        status,
        layers: ['wind', 'waves'],
        attribution: [ATTRIBUTION_OPEN_METEO],
        point: { lat: p.lat, lon: p.lon },
        requested: p.requested,
      },
      hourly,
    },
    { headers: { 'Cache-Control': `public, max-age=${ctx.cfg.point.cacheControlS}` } },
  )
}

function denied(reason: PointReserveReason | null, nowMs: number): Response {
  switch (reason) {
    case 'day':
      return errorResponse('quota_exhausted', 'daily point budget exhausted; cached points still work', {
        'Retry-After': String(secondsUntilNext(nowMs, 'day')),
      })
    case 'minute':
      return errorResponse('rate_limited', 'too many new points this minute', {
        'Retry-After': String(secondsUntilNext(nowMs, 'minute')),
      })
    case 'client_day':
      return errorResponse('rate_limited', 'too many new points from this client today', {
        'Retry-After': String(secondsUntilNext(nowMs, 'day')),
      })
    default:
      return errorResponse('rate_limited', 'too many new points this hour', {
        'Retry-After': String(secondsUntilNext(nowMs, 'hour')),
      })
  }
}

export async function handlePoint(url: URL, ctx: PointContext): Promise<Response> {
  const parsed = parse(url.searchParams)
  if (!parsed.ok) return parsed.response
  const { cfg, store } = ctx
  const lat = roundCoord(parsed.lat, cfg.point.roundDeg)
  const lon = roundCoord(parsed.lon, cfg.point.roundDeg)
  const p = { lat, lon, vars: parsed.vars, hours: parsed.hours, requested: { lat: parsed.lat, lon: parsed.lon } }
  const key = cacheKey(lat, lon)

  // (1)-(3) Cache. Supabase indisponível: o erro sobe e vira 503 sem chamar a fonte.
  const entry = await store.getPointCache(key)
  const readable = entry && readPayload(entry.payload) ? entry : null
  const decision = classifyPointCache(readable, ctx.now(), {
    okTtlS: cfg.point.cacheTtlS,
    partialTtlS: cfg.point.partialTtlS,
    staleMaxS: cfg.point.staleMaxS,
  })
  if (decision.kind === 'hit') {
    return respond(readPayload(readable!.payload)!, decision.status, readable!.fetched_at as string, p, ctx)
  }
  const stale = decision.staleFallback && readable ? readable : null
  const serveStale = () => respond(readPayload(stale!.payload)!, 'stale', stale!.fetched_at as string, p, ctx)

  // (4) Reserva de 2 chamadas ANTES de chamar a fonte.
  const reserve = await store.reservePoint({
    atMs: ctx.now(),
    clientHash: ctx.clientHash,
    n: 2,
    dayLimit: pointOperatingDailyLimit(cfg),
    hourLimit: cfg.point.maxPerHour,
    minuteLimit: cfg.point.maxPerMin,
    clientHourLimit: ctx.clientHash ? cfg.point.clientMaxPerHour : null,
    clientDayLimit: ctx.clientHash ? cfg.point.clientMaxPerDay : null,
  })
  if (!reserve.allowed) return stale ? serveStale() : denied(reserve.reason, ctx.now())

  // (5) Conjunto completo, em paralelo, sem retry imediato. As 2 contam.
  const req = { lat, lon, days: cfg.forecastDays }
  const [fcRes, mrRes] = await Promise.allSettled([
    ctx.sources.forecast.fetchPoint({ ...req, windUnit: 'kn' }),
    ctx.sources.marine.fetchPoint(req),
  ])
  const fc = fcRes.status === 'fulfilled' && fcRes.value.meta.units.wind_speed_10m === 'kn' ? fcRes.value : null
  const mr = mrRes.status === 'fulfilled' ? mrRes.value : null
  if (!fc && !mr) {
    return stale ? serveStale() : errorResponse('service_unavailable', 'forecast source unavailable and no usable cache')
  }

  const payload = merge(ctx.sources.modelLabel, fc, mr)
  const status = fc && mr ? 'ok' : 'partial'
  const fetchedAt = formatUtc(ctx.now())
  try {
    await store.putPointCache({ key, status, fetched_at: fetchedAt, payload })
  } catch {
    // Falha ao gravar o cache não invalida a resposta (as chamadas já contaram).
  }
  return respond(payload, status, fetchedAt, p, ctx)
}

// Fonte simulada (SOURCE_MODE=simulated): dados determinísticos, sem rede.
// Formato igual ao do adaptador real, observado nas sondagens T-07 e T-15
// (série desde 00:00 UTC do dia, 24 valores por dia; ondas null em terra).
import { formatUtc } from '../time.ts'
import { msToKnots } from '../units.ts'
import { normalizeDeg } from '../wind.ts'
import {
  MARINE_VARIABLES,
  MAX_DAYS_PER_REQUEST,
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

/**
 * ok: resposta completa. rate_limited: HTTP 429. error: fonte fora do ar.
 * land: ondas null (ponto de terra). short: um dia a menos (rodada incompleta).
 */
export type SimulatedMode = 'ok' | 'rate_limited' | 'error' | 'land' | 'short'

export interface SimulatedOptions {
  mode?: SimulatedMode
  /** Relógio (ms). Padrão: Date.now. */
  now?: () => number
  /** Atraso artificial em ms (resposta lenta). */
  delayMs?: number
}

const DAY_MS = 86_400_000
const round = (x: number, d = 2) => Math.round(x * 10 ** d) / 10 ** d

function hours(req: PointRequest, mode: SimulatedMode, now: number): number[] {
  const start = Math.floor(now / DAY_MS) * DAY_MS
  const count = (mode === 'short' ? req.days - 1 : req.days) * 24
  return Array.from({ length: Math.max(0, count) }, (_, i) => start + i * 3_600_000)
}

async function begin(kind: SourceKind, req: PointRequest, opts: SimulatedOptions): Promise<SimulatedMode> {
  if (!Number.isInteger(req.days) || req.days < 1 || req.days > MAX_DAYS_PER_REQUEST) {
    throw new SourceRequestError(`days must be 1..${MAX_DAYS_PER_REQUEST}`)
  }
  const mode = opts.mode ?? 'ok'
  req.onAttempt?.({ source: kind, url: `simulated://${kind}?lat=${req.lat}&lon=${req.lon}` })
  if (opts.delayMs) await new Promise((r) => setTimeout(r, opts.delayMs))
  if (mode === 'rate_limited') throw new SourceRateLimitError(`simulated ${kind}: rate limited (429)`)
  if (mode === 'error') throw new SourceUnavailableError(`simulated ${kind}: HTTP 503`, 503)
  return mode
}

export function createSimulatedForecast(opts: SimulatedOptions = {}): ForecastSource {
  return {
    async fetchPoint(req): Promise<SeriesResult<ForecastVariable>> {
      const mode = await begin('forecast', req, opts)
      const times = hours(req, mode, (opts.now ?? Date.now)())
      const unit = req.windUnit ?? 'ms'
      const conv = (ms: number) => round(unit === 'kn' ? msToKnots(ms) : ms)
      const phase = req.lat * 0.7 + req.lon * 0.3
      const speedMs = times.map((_, i) => 6 + 4 * Math.sin(i / 6 + phase))
      return {
        meta: {
          source: 'simulated-forecast',
          model: 'simulated',
          units: { time: 'iso8601', wind_speed_10m: unit === 'kn' ? 'kn' : 'm/s', wind_gusts_10m: unit === 'kn' ? 'kn' : 'm/s', wind_direction_10m: 'deg' },
          latitude: req.lat,
          longitude: req.lon,
        },
        hourly: {
          time: times.map(formatUtc),
          wind_speed_10m: speedMs.map(conv),
          wind_gusts_10m: speedMs.map((s) => conv(s * 1.4)),
          wind_direction_10m: times.map((_, i) => Math.round(normalizeDeg(90 + i * 5 + phase * 10)) % 360),
        },
      }
    },
  }
}

export function createSimulatedMarine(opts: SimulatedOptions = {}): MarineSource {
  return {
    async fetchPoint(req): Promise<SeriesResult<MarineVariable>> {
      const mode = await begin('marine', req, opts)
      const times = hours(req, mode, (opts.now ?? Date.now)())
      const land = mode === 'land'
      const phase = req.lat * 0.5 - req.lon * 0.2
      const series = (fn: (i: number) => number) => times.map((_, i) => (land ? null : round(fn(i))))
      const hourly = { time: times.map(formatUtc) } as { time: string[] } & Record<MarineVariable, (number | null)[]>
      hourly.wave_height = series((i) => 1.2 + 0.5 * Math.sin(i / 8 + phase))
      hourly.wave_direction = series((i) => (150 + i) % 360)
      hourly.wave_period = series((i) => 8 + Math.sin(i / 10))
      hourly.wind_wave_height = series((i) => 0.3 + 0.2 * Math.sin(i / 5))
      hourly.wind_wave_direction = series((i) => (110 + 2 * i) % 360)
      hourly.wind_wave_period = series((i) => 3 + Math.sin(i / 5))
      hourly.swell_wave_height = series((i) => 1 + 0.4 * Math.sin(i / 12 + phase))
      hourly.swell_wave_direction = series(() => 160)
      hourly.swell_wave_period = series((i) => 10 + Math.sin(i / 12))
      const units = { time: 'iso8601' } as Record<'time' | MarineVariable, string>
      for (const v of MARINE_VARIABLES) units[v] = v.endsWith('height') ? 'm' : v.endsWith('direction') ? 'deg' : 's'
      return {
        meta: { source: 'simulated-marine', model: 'simulated', units, latitude: req.lat, longitude: req.lon },
        hourly,
      }
    },
  }
}

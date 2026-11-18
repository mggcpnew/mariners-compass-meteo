// Contrato dos adaptadores de fonte (B5). Toda saída declara as unidades em
// meta.units, usa tempo UTC com "Z" e valor ausente como null (nunca zero).

/** Variáveis de previsão (forecast). */
export const FORECAST_VARIABLES = ['wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m'] as const

/** Variáveis de ondas (Marine). */
export const MARINE_VARIABLES = [
  'wave_height',
  'wave_direction',
  'wave_period',
  'wind_wave_height',
  'wind_wave_direction',
  'wind_wave_period',
  'swell_wave_height',
  'swell_wave_direction',
  'swell_wave_period',
] as const

export type ForecastVariable = (typeof FORECAST_VARIABLES)[number]
export type MarineVariable = (typeof MARINE_VARIABLES)[number]

/** Limites de peso 1 por chamada no Open-Meteo (pricing, T-14). */
export const MAX_VARIABLES_PER_REQUEST = 10
export const MAX_DAYS_PER_REQUEST = 14

export type WindUnit = 'ms' | 'kn'
export type SourceKind = 'forecast' | 'marine'

export interface AttemptInfo {
  source: SourceKind
  url: string
}

export interface PointRequest {
  lat: number
  lon: number
  days: number
  /** Só forecast. Grade: ms. /point: kn. */
  windUnit?: WindUnit
  /** Chamado ANTES de cada tentativa HTTP efetiva (contagem de cota). */
  onAttempt?: (info: AttemptInfo) => void
}

export interface SeriesResult<V extends string> {
  meta: {
    source: string
    /** Modelo configurado ou "auto" (a resposta do Open-Meteo não informa o modelo; T-07). */
    model: string
    units: Record<'time' | V, string>
    /** Centro da célula usada pela fonte. */
    latitude: number
    longitude: number
  }
  hourly: { time: string[] } & Record<V, (number | null)[]>
}

export interface ForecastSource {
  fetchPoint(req: PointRequest): Promise<SeriesResult<ForecastVariable>>
}

export interface MarineSource {
  fetchPoint(req: PointRequest): Promise<SeriesResult<MarineVariable>>
}

export class SourceError extends Error {
  override name = 'SourceError'
}

/** Configuração ausente ou inválida: nada foi chamado (fail-closed). */
export class SourceConfigError extends SourceError {
  override name = 'SourceConfigError'
}

/** Pedido fora dos limites da fonte: recusado antes de chamar. */
export class SourceRequestError extends SourceError {
  override name = 'SourceRequestError'
}

/** HTTP 429 da fonte. Não se tenta de novo imediatamente (B6, AC-MVP-18). */
export class SourceRateLimitError extends SourceError {
  override name = 'SourceRateLimitError'
}

/** Falha de rede, HTTP de erro ou resposta malformada. */
export class SourceUnavailableError extends SourceError {
  override name = 'SourceUnavailableError'
  readonly status: number | null
  constructor(message: string, status: number | null = null) {
    super(message)
    this.status = status
  }
}

// Cliente da API v1 (B7). O navegador só fala com /api/v1 do próprio app (AC-MVP-01).

export type LayerId = 'wind' | 'waves'
export type BBox = readonly [west: number, south: number, east: number, north: number]

export interface RegionInfo {
  id: string
  bbox: BBox
  res: number
}

export interface FramesResponse {
  meta: {
    source: string
    model: string
    run_time: string
    updated_at: string
    units: Record<string, string>
    status: 'ok' | 'stale'
    layers: LayerId[]
    regions: RegionInfo[]
    attribution: string[]
  }
  times: string[]
}

export interface GridHeader {
  lo1: number
  la1: number
  lo2: number
  la2: number
  dx: number
  dy: number
  nx: number
  ny: number
  refTime: string
  parameter?: string
  parameterNumber?: number
}

export interface GridRecord {
  header: GridHeader
  data: (number | null)[]
}

/** Erro da API. status 0 = sem resposta (rede). */
export class ApiError extends Error {
  override name = 'ApiError'
  readonly status: number
  readonly code: string
  /** Segundos do Retry-After, se houver. */
  readonly retryAfterS: number | null

  constructor(status: number, code: string, message: string, retryAfterS: number | null = null) {
    super(message)
    this.status = status
    this.code = code
    this.retryAfterS = retryAfterS
  }
}

type FetchLike = (input: string) => Promise<Response>

async function getJson<T>(path: string, fetchFn: FetchLike): Promise<T> {
  let res: Response
  try {
    res = await fetchFn(path)
  } catch (err) {
    throw new ApiError(0, 'network', (err as Error).message)
  }
  if (res.ok) return (await res.json()) as T
  let code = 'http_error'
  let message = `HTTP ${res.status}`
  try {
    const body = (await res.json()) as { error?: { code?: string; message?: string } }
    code = body.error?.code ?? code
    message = body.error?.message ?? message
  } catch {
    // corpo não é JSON: fica o código genérico
  }
  const retry = Number(res.headers.get('Retry-After'))
  throw new ApiError(res.status, code, message, Number.isFinite(retry) && retry > 0 ? retry : null)
}

const defaultFetch: FetchLike = (input) => fetch(input)

export function getFrames(layer: LayerId, fetchFn: FetchLike = defaultFetch): Promise<FramesResponse> {
  return getJson(`/api/v1/frames?layer=${layer}`, fetchFn)
}

export function gridUrl(layer: LayerId, runTime: string, time: string, region: RegionInfo): string {
  const q = new URLSearchParams({ layer, run_time: runTime, time, bbox: region.bbox.join(','), res: String(region.res) })
  return `/api/v1/grid?${q}`
}

export type PointSeries =
  | 'wind_speed_10m'
  | 'wind_direction_10m'
  | 'wind_gusts_10m'
  | 'wave_height'
  | 'wave_direction'
  | 'wave_period'

export interface PointResponse {
  meta: {
    source: string
    model: string
    updated_at: string
    units: Record<string, string>
    status: 'ok' | 'partial' | 'stale'
    attribution: string[]
    /** Coordenada arredondada usada pela previsão. */
    point: { lat: number; lon: number }
    requested: { lat: number; lon: number }
  }
  hourly: { time: string[] } & Partial<Record<PointSeries, (number | null)[]>>
}

/** Variáveis que o painel mostra (vento em nós, ondas totais). */
export const POINT_VARS: readonly PointSeries[] = [
  'wind_speed_10m',
  'wind_direction_10m',
  'wind_gusts_10m',
  'wave_height',
  'wave_direction',
  'wave_period',
]

/** 2 casas (~1 km): o servidor arredonda de novo (POINT_ROUND_DEG); URLs repetidas aproveitam o cache. */
const coord = (x: number) => (Math.round(x * 100) / 100).toFixed(2)

export function pointUrl(lat: number, lon: number, hours = 168): string {
  const q = new URLSearchParams({ lat: coord(lat), lon: coord(lon), hours: String(hours), vars: POINT_VARS.join(',') })
  return `/api/v1/point?${q}`
}

export function getPoint(lat: number, lon: number, fetchFn: FetchLike = defaultFetch): Promise<PointResponse> {
  return getJson(pointUrl(lat, lon), fetchFn)
}

export function getGrid(
  layer: LayerId,
  runTime: string,
  time: string,
  region: RegionInfo,
  fetchFn: FetchLike = defaultFetch,
): Promise<GridRecord[]> {
  return getJson(gridUrl(layer, runTime, time, region), fetchFn)
}

export function getNotices(fetchFn: FetchLike = defaultFetch): Promise<import('./notices.ts').NoticesResponse> {
  return getJson('/api/v1/notices', fetchFn)
}

// Arquivos de grade gravados no Storage (B6, formatos de vento e de ondas).
import { toUV } from '../wind.ts'
import type { RegionGrid } from './regions.ts'
import { VELOCITY_U, VELOCITY_V } from './velocity-header.ts'

export type LayerId = 'wind' | 'waves'
export const LAYER_IDS: readonly LayerId[] = ['wind', 'waves']

type Values = readonly (number | null)[]

interface GeometryHeader {
  lo1: number
  la1: number
  lo2: number
  la2: number
  dx: number
  dy: number
  nx: number
  ny: number
}

function geometry(g: RegionGrid): GeometryHeader {
  // dx e dy positivos; o sentido norte -> sul vem de la1 > la2 (T-01).
  return { lo1: g.lo1, la1: g.la1, lo2: g.lo2, la2: g.la2, dx: g.res, dy: g.res, nx: g.nx, ny: g.ny }
}

function checkLength(g: RegionGrid, ...arrays: Values[]): void {
  for (const a of arrays) {
    if (a.length !== g.nx * g.ny) throw new RangeError(`grid ${g.id}: expected ${g.nx * g.ny} values, got ${a.length}`)
  }
}

const round = (x: number) => Math.round(x * 100) / 100

/**
 * Vento: [U, V] em m/s, no formato grib2json que o leaflet-velocity lê.
 * speed em m/s; dirFrom em graus (de onde sopra). Valor ausente continua null.
 */
export function buildWindFile(g: RegionGrid, validTime: string, speed: Values, dirFrom: Values) {
  checkLength(g, speed, dirFrom)
  const u: (number | null)[] = []
  const v: (number | null)[] = []
  speed.forEach((s, i) => {
    const d = dirFrom[i]
    if (s === null || d === null) {
      u.push(null)
      v.push(null)
      return
    }
    const c = toUV(s, d)
    u.push(round(c.u))
    v.push(round(c.v))
  })
  const base = { ...geometry(g), refTime: validTime, forecastTime: 0 }
  return [
    { header: { ...base, ...VELOCITY_U }, data: u },
    { header: { ...base, ...VELOCITY_V }, data: v },
  ]
}

/** Ondas: [altura (m), direção de origem (graus)]; null onde não há dado (terra). */
export function buildWavesFile(g: RegionGrid, validTime: string, height: Values, dirFrom: Values) {
  checkLength(g, height, dirFrom)
  const base = { ...geometry(g), refTime: validTime }
  return [
    { header: { ...base, parameter: 'height', unit: 'm' }, data: [...height] },
    { header: { ...base, parameter: 'direction', unit: 'deg_from' }, data: [...dirFrom] },
  ]
}

/** Caminho no bucket: runs/<run_time>/<region>/<layer>/<valid_time>.json (":" trocado por "-"). */
export function storagePath(runTime: string, region: string, layer: LayerId, validTime: string): string {
  const safe = (t: string) => t.replaceAll(':', '-')
  return `runs/${safe(runTime)}/${region}/${layer}/${safe(validTime)}.json`
}

/** Prefixo de uma rodada no bucket. */
export function runPrefix(runTime: string): string {
  return `runs/${runTime.replaceAll(':', '-')}`
}

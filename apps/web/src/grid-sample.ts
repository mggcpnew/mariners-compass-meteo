// Amostragem de uma grade regular (formato do /grid) num ponto qualquer, com a
// interpolação bilinear e a regra de nulos do B6 (packages/core).
import { interpolateDirection, interpolateScalar, type Corners } from '@mariners-compass/core'
import type { GridRecord } from './api.ts'

export interface CellSample {
  corners: Corners
  /** Posição dentro da célula, de 0 a 1 (x para leste, y para sul). */
  x: number
  y: number
}

/** Cantos da célula que contém (lat, lon); null fora da grade. Linhas norte -> sul, colunas oeste -> leste. */
export function cellAt(grid: GridRecord, lat: number, lon: number): CellSample | null {
  const { lo1, la1, dx, dy, nx, ny } = grid.header
  const fx = (lon - lo1) / dx
  const fy = (la1 - lat) / dy
  if (!(fx >= 0 && fy >= 0 && fx <= nx - 1 && fy <= ny - 1)) return null
  const i = Math.min(Math.floor(fx), nx - 2)
  const j = Math.min(Math.floor(fy), ny - 2)
  const d = grid.data
  const at = (ii: number, jj: number) => d[jj * nx + ii] ?? null
  return {
    corners: [at(i, j), at(i + 1, j), at(i, j + 1), at(i + 1, j + 1)],
    x: fx - i,
    y: fy - j,
  }
}

export function sampleScalar(grid: GridRecord, lat: number, lon: number): number | null {
  const c = cellAt(grid, lat, lon)
  return c ? interpolateScalar(c.corners, c.x, c.y) : null
}

export function sampleDirection(grid: GridRecord, lat: number, lon: number): number | null {
  const c = cellAt(grid, lat, lon)
  return c ? interpolateDirection(c.corners, c.x, c.y) : null
}

/** Separa o arquivo de ondas em altura e direção pelo header.parameter. */
export function splitWaves(file: GridRecord[]): { height: GridRecord; direction: GridRecord } | null {
  const height = file.find((r) => r.header.parameter === 'height')
  const direction = file.find((r) => r.header.parameter === 'direction')
  return height && direction ? { height, direction } : null
}

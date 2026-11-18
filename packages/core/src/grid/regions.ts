// Geometria das duas grades (B6, "Duas grades, mesma fonte").
// Pontos em ordem de linha: norte -> sul, oeste -> leste (formato do leaflet-velocity).
import type { AppConfig, RegionSpec } from '../config.ts'

export type RegionId = 'wide' | 'bay'
export const REGION_IDS: readonly RegionId[] = ['wide', 'bay']

export interface RegionGrid {
  id: RegionId
  bbox: RegionSpec['bbox']
  res: number
  /** Colunas (oeste -> leste) e linhas (norte -> sul). */
  nx: number
  ny: number
  lo1: number
  la1: number
  lo2: number
  la2: number
}

export interface GridPoint {
  lat: number
  lon: number
}

// Evita resíduos de ponto flutuante (ex.: -43.75000000000001).
const tidy = (x: number) => Math.round(x * 1e6) / 1e6

export function regionGrid(id: RegionId, spec: RegionSpec): RegionGrid {
  const [west, south, east, north] = spec.bbox
  return {
    id,
    bbox: spec.bbox,
    res: spec.res,
    nx: Math.round((east - west) / spec.res) + 1,
    ny: Math.round((north - south) / spec.res) + 1,
    lo1: west,
    la1: north,
    lo2: east,
    la2: south,
  }
}

export function regionGrids(cfg: AppConfig): RegionGrid[] {
  return REGION_IDS.map((id) => regionGrid(id, cfg.grid[id]))
}

export function regionPoints(g: RegionGrid): GridPoint[] {
  const points: GridPoint[] = []
  for (let j = 0; j < g.ny; j++) {
    for (let i = 0; i < g.nx; i++) {
      points.push({ lat: tidy(g.la1 - j * g.res), lon: tidy(g.lo1 + i * g.res) })
    }
  }
  return points
}

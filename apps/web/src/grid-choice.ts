// Qual grade o mapa pede (B6, "Qual grade o front usa"; AC-MVP-27).
import type { RegionInfo } from './api.ts'

/** Zoom mínimo da grade da baía (variável de build BAY_GRID_MIN_ZOOM, padrão 9). */
export const BAY_GRID_MIN_ZOOM: number = __BAY_GRID_MIN_ZOOM__

export function insideBBox(bbox: RegionInfo['bbox'], lat: number, lon: number): boolean {
  const [w, s, e, n] = bbox
  return lon >= w && lon <= e && lat >= s && lat <= n
}

/** Grade da baía com zoom >= minZoom e centro dentro do bbox dela; senão a ampla. */
export function chooseRegion(
  regions: readonly RegionInfo[],
  zoom: number,
  center: { lat: number; lng: number },
  minZoom: number = BAY_GRID_MIN_ZOOM,
): RegionInfo | null {
  const wide = regions.find((r) => r.id === 'wide') ?? null
  const bay = regions.find((r) => r.id === 'bay')
  if (bay && zoom >= minZoom && insideBBox(bay.bbox, center.lat, center.lng)) return bay
  return wide
}

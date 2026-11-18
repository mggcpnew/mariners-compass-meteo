// Mapa base sem tiles (AC-MVP-10): fundo da cor do mar e terra do Natural Earth
// 10m recortada (public/data/land.geojson, gerado por scripts/coast.ts).
import L from './leaflet-global.ts'
import { cssVar } from './theme.ts'

/**
 * Vista inicial, zoom 10. O B10 sugere -22,71982, -43,17215 (norte da Baía de
 * Guanabara); a T-05 ajustou o centro para a Enseada de São Francisco
 * (Iate Clube Brasileiro em -22,9148, -43,1048, consulta ao Nominatim/OSM em 18/11/2026).
 */
export const INITIAL_CENTER: L.LatLngTuple = [-22.915, -43.105]
export const INITIAL_ZOOM = 10

/** Limites de navegação: o bbox da grade ampla com folga (B6). */
const MAX_BOUNDS = L.latLngBounds([-37, -56], [7, -28])

/** Panes em ordem de desenho: ondas embaixo, terra cobre a borda das ondas, vento por cima. */
export const PANES = { waves: 'mc-waves', land: 'mc-land', wind: 'mc-wind' } as const

export function createMap(el: HTMLElement): L.Map {
  const map = L.map(el, {
    zoomControl: false,
    attributionControl: false,
    minZoom: 4,
    maxZoom: 13,
    maxBounds: MAX_BOUNDS,
    maxBoundsViscosity: 1,
    zoomSnap: 1,
  }).setView(INITIAL_CENTER, INITIAL_ZOOM)
  const z = { waves: 300, land: 350, wind: 420 }
  for (const [key, name] of Object.entries(PANES)) {
    const pane = map.createPane(name)
    pane.style.zIndex = String(z[key as keyof typeof z])
    pane.style.pointerEvents = 'none'
  }
  return map
}

function landStyle(): L.PathOptions {
  return {
    color: cssVar('--map-coast'),
    weight: 1,
    fillColor: cssVar('--map-land'),
    fillOpacity: 1,
    interactive: false,
  }
}

export async function addLand(map: L.Map): Promise<{ restyle(): void }> {
  const res = await fetch('/data/land.geojson')
  if (!res.ok) throw new Error(`land.geojson: HTTP ${res.status}`)
  const layer = L.geoJSON((await res.json()) as GeoJSON.GeoJsonObject, { pane: PANES.land, style: landStyle }).addTo(map)
  return { restyle: () => layer.setStyle(landStyle()) }
}

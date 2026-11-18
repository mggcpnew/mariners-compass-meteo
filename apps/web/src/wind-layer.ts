// Partículas de vento com o leaflet-velocity 2.1.4 sobre o Leaflet 1.9.4 (T-11).
// O arquivo do /grid já vem no formato que o plugin lê (T-01).
import L from './leaflet-global.ts'
import 'leaflet-velocity'
import type { GridRecord } from './api.ts'
import { WIND_SCALE_MAX_MS, windColorScale } from './scales.ts'
import type { Mode } from './theme.ts'

export interface WindLayer {
  layer: L.Layer
  setData(data: GridRecord[]): void
  setMode(mode: Mode): void
}

interface VelocityLayer extends L.Layer {
  setData(data: GridRecord[]): void
}

type VelocityFactory = (options: Record<string, unknown>) => VelocityLayer

export function createWindLayer(mode: Mode, pane: string): WindLayer {
  const factory = (L as unknown as { velocityLayer: VelocityFactory }).velocityLayer
  // O plugin guarda a referência deste array e não aceita trocar a escala por
  // setOptions; a troca de modo altera o conteúdo no lugar.
  const colorScale = windColorScale(mode)
  const layer = factory({
    // O controle de valores do plugin tem texto fixo em inglês: desligado.
    displayValues: false,
    data: null,
    paneName: pane,
    minVelocity: 0,
    maxVelocity: WIND_SCALE_MAX_MS,
    colorScale,
    velocityScale: 0.006,
    particleAge: 60,
    lineWidth: 1.6,
    particleMultiplier: 1 / 250,
    frameRate: 20,
  })
  return {
    layer,
    setData: (data) => layer.setData(data),
    setMode(next) {
      colorScale.splice(0, colorScale.length, ...windColorScale(next))
    },
  }
}

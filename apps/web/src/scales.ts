// Escalas de cor do mapa. Faixas fixas com rótulos numéricos na legenda (B10):
// a cor nunca é a única pista. No modo noturno, só vermelho variando a luminância.
import { knotsToKmh, knotsToMs } from '@mariners-compass/core'
import type { Mode } from './theme.ts'

export type SpeedUnit = 'kn' | 'kmh' | 'ms'

/** Limites inferiores das faixas de vento, em nós; a última é "35+". */
export const WIND_BANDS_KN = [0, 5, 10, 15, 20, 25, 30, 35] as const
/** Limites inferiores das faixas de altura de onda, em metros; a última é "4+". */
export const WAVE_BANDS_M = [0, 0.5, 1, 1.5, 2, 3, 4] as const

/** Cor de cada faixa de vento (partículas), por modo. Calmo frio, forte quente. */
export const WIND_COLORS: Record<Mode, readonly string[]> = {
  light: ['#4E7A90', '#1F6F82', '#2C7A4B', '#8A6A00', '#B54708', '#B42318', '#8E1B5E', '#5B1A7A'],
  dark: ['#9CC3D5', '#4FD1E8', '#6FD39A', '#F2C94C', '#FDA64F', '#FF6B6B', '#F28AD0', '#C9A2FF'],
  night: ['#C00000', '#D80000', '#F00000', '#FF2A2A', '#FF4D4D', '#FF6E6E', '#FF9090', '#FFB4B4'],
}
// Contraste de todas as cores acima contra o mar e a terra do mesmo modo: >= 3:1
// (elementos gráficos, WCAG 1.4.11), conferido em 18/11/2026.

/** Ondas: uma só cor com opacidade crescente sobre o mar (escala sequencial). */
const WAVE_BASE: Record<Mode, readonly [number, number, number]> = {
  light: [10, 108, 148],
  dark: [79, 209, 232],
  night: [255, 77, 77],
}
const WAVE_ALPHA = [0.12, 0.24, 0.36, 0.48, 0.6, 0.74, 0.88] as const

export function bandIndex(bands: readonly number[], value: number): number {
  let i = 0
  while (i + 1 < bands.length && value >= bands[i + 1]) i++
  return i
}

/** RGBA (0-255, alfa 0-255) da altura de onda h em metros. */
export function waveRgba(mode: Mode, h: number): [number, number, number, number] {
  const [r, g, b] = WAVE_BASE[mode]
  return [r, g, b, Math.round(WAVE_ALPHA[bandIndex(WAVE_BANDS_M, h)] * 255)]
}

export function waveCss(mode: Mode, bandI: number): string {
  const [r, g, b] = WAVE_BASE[mode]
  return `rgba(${r}, ${g}, ${b}, ${WAVE_ALPHA[bandI]})`
}

/** Vento máximo da escala de partículas (m/s): acima disso, cor da última faixa. */
export const WIND_SCALE_MAX_MS = knotsToMs(WIND_BANDS_KN.at(-1)!)

/**
 * Escala para o leaflet-velocity: uma cor por nó, de 0 a 35 nós.
 * O plugin escolhe o índice round(v / max * (n - 1)), então com 36 entradas
 * o índice é o nó arredondado e cai na faixa certa.
 */
export function windColorScale(mode: Mode): string[] {
  const top = WIND_BANDS_KN.at(-1)!
  return Array.from({ length: top + 1 }, (_, kn) => WIND_COLORS[mode][bandIndex(WIND_BANDS_KN, kn)])
}

/** Converte um valor em nós para a unidade escolhida (rótulos da legenda). */
export function fromKnots(kn: number, unit: SpeedUnit): number {
  if (unit === 'kmh') return knotsToKmh(kn)
  if (unit === 'ms') return knotsToMs(kn)
  return kn
}

/** Número formatado no idioma, sem casas desnecessárias. */
export function formatNumber(value: number, locale: string, maxDigits = 1): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: maxDigits }).format(value)
}

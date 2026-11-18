// Interpolação das ondas com nulos (B6, "Regra de interpolação"; AC-MVP-24).
// Cantos: c00 em (x=0, y=0), c10 em (1, 0), c01 em (0, 1), c11 em (1, 1).
// x e y vão de 0 a 1 dentro da célula. null = sem dado (terra) = transparente.
import { normalizeDeg } from './wind.ts'

export type Corners = readonly [c00: number | null, c10: number | null, c01: number | null, c11: number | null]

function weights(x: number, y: number): [number, number, number, number] {
  return [(1 - x) * (1 - y), x * (1 - y), (1 - x) * y, x * y]
}

/** Índice do canto mais próximo do ponto (empate em 0,5 vai para o canto de menor índice). */
function nearestCorner(x: number, y: number): number {
  return (x > 0.5 ? 1 : 0) + (y > 0.5 ? 2 : 0)
}

/** Pesos bilineares só dos cantos válidos, renormalizados; null se o ponto deve ficar transparente. */
function validWeights(corners: Corners, x: number, y: number): number[] | null {
  if (corners[nearestCorner(x, y)] === null) return null
  const w = weights(x, y).map((wi, i) => (corners[i] === null ? 0 : wi))
  const sum = w.reduce((a, b) => a + b, 0)
  if (sum <= 0) return null
  return w.map((wi) => wi / sum)
}

/** Altura (ou outro escalar) interpolada; null = transparente. */
export function interpolateScalar(corners: Corners, x: number, y: number): number | null {
  const w = validWeights(corners, x, y)
  if (!w) return null
  return w.reduce((acc, wi, i) => acc + wi * (corners[i] ?? 0), 0)
}

/** Direção interpolada por componentes (seno e cosseno); null = transparente ou indefinida. */
export function interpolateDirection(corners: Corners, x: number, y: number): number | null {
  const w = validWeights(corners, x, y)
  if (!w) return null
  let s = 0
  let c = 0
  w.forEach((wi, i) => {
    const d = corners[i]
    if (d === null || wi === 0) return
    const rad = (d * Math.PI) / 180
    s += wi * Math.sin(rad)
    c += wi * Math.cos(rad)
  })
  if (Math.hypot(s, c) < 1e-12) return null
  return normalizeDeg((Math.atan2(s, c) * 180) / Math.PI)
}

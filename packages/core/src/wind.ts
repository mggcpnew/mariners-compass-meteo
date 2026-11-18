// Direções meteorológicas: graus, DE ONDE sopra (vento) ou de onde vem (onda).

/** Normaliza um ângulo em graus para o intervalo [0, 360). */
export function normalizeDeg(deg: number): number {
  const r = deg % 360
  return r < 0 ? r + 360 : r
}

/**
 * Converte velocidade e direção de origem em componentes U (leste) e V (norte).
 * u = -s·sen(d), v = -s·cos(d) (B6, "Conversão no job openmeteo").
 */
export function toUV(speed: number, dirFromDeg: number): { u: number; v: number } {
  const rad = (normalizeDeg(dirFromDeg) * Math.PI) / 180
  return { u: -speed * Math.sin(rad), v: -speed * Math.cos(rad) }
}

/** Para onde aponta a seta da onda: (direção de origem + 180) mod 360, sempre positivo. */
export function waveArrowDeg(dirFromDeg: number): number {
  return normalizeDeg(dirFromDeg + 180)
}

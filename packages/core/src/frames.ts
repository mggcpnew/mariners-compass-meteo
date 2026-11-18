// Alinhamento dos quadros do mapa (B6, "Quais instantes cada quadro cobre"; AC-MVP-25).
import { formatUtc, parseUtc } from './time.ts'

export const FRAME_STEP_HOURS = 3
export const FRAME_SPAN_HOURS = 168
/** 57 quadros: o primeiro e mais 168 h de 3 em 3 h. */
export const FRAME_COUNT = FRAME_SPAN_HOURS / FRAME_STEP_HOURS + 1

const STEP_MS = FRAME_STEP_HOURS * 3_600_000

/**
 * Instantes dos quadros de uma rodada: o primeiro é o primeiro múltiplo de
 * 3 h UTC igual ou posterior ao run_time; seguem 57 quadros de 3 em 3 h.
 */
export function frameTimes(runTime: string): string[] {
  const first = Math.ceil(parseUtc(runTime) / STEP_MS) * STEP_MS
  return Array.from({ length: FRAME_COUNT }, (_, i) => formatUtc(first + i * STEP_MS))
}

export type FrameSelection =
  | { complete: true; values: (number | null)[] }
  | { complete: false; missing: string[] }

/**
 * Recorta uma série horária (tempos já normalizados em UTC) nos instantes dos
 * quadros. Se faltar algum instante, a rodada é incompleta (não se publica).
 * Valor nulo na fonte continua nulo; só a AUSÊNCIA do instante torna incompleto.
 */
export function selectFrames(
  times: readonly string[],
  values: readonly (number | null)[],
  frames: readonly string[],
): FrameSelection {
  if (times.length !== values.length) {
    throw new RangeError('selectFrames: times and values differ in length')
  }
  const index = new Map(times.map((t, i) => [t, i]))
  const missing = frames.filter((f) => !index.has(f))
  if (missing.length > 0) return { complete: false, missing }
  return { complete: true, values: frames.map((f) => values[index.get(f)!] ?? null) }
}

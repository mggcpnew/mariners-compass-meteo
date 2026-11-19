// Funções puras do painel do ponto: unidades, eixos, direção e mensagens.
import { fromKnots, type SpeedUnit } from './scales.ts'

export const SPEED_UNITS: readonly SpeedUnit[] = ['kn', 'kmh', 'ms']

/** O /point devolve vento e rajada em nós (B7). */
export function convertKnots(kn: number | null, unit: SpeedUnit): number | null {
  return kn === null ? null : fromKnots(kn, unit)
}

export function isSpeedUnit(value: unknown): value is SpeedUnit {
  return typeof value === 'string' && (SPEED_UNITS as readonly string[]).includes(value)
}

/** Máximo "redondo" do eixo e as marcas (3 a 5 intervalos de 1, 2, 2,5 ou 5 × 10^n). */
export function niceScale(max: number, targetTicks = 4): { max: number; ticks: number[] } {
  const m = Number.isFinite(max) && max > 0 ? max : 1
  const raw = m / targetTicks
  const pow = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((f) => f * pow).find((s) => s >= raw)!
  const top = Math.ceil(m / step - 1e-9) * step
  const ticks: number[] = []
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6)
  return { max: top, ticks }
}

/** Índice do ponto cardeal (16 rumos) de uma direção em graus. */
export function compassIndex(deg: number): number {
  return Math.round((((deg % 360) + 360) % 360) / 22.5) % 16
}

export type WaitUnit = 'minutes' | 'hours'

/** Retry-After em linguagem simples: minutos (até 90) ou horas, arredondados para cima. */
export function waitParts(seconds: number): { unit: WaitUnit; value: number } {
  const minutes = Math.max(1, Math.ceil(seconds / 60))
  if (minutes <= 90) return { unit: 'minutes', value: minutes }
  return { unit: 'hours', value: Math.ceil(minutes / 60) }
}

/** Índice da primeira hora igual ou posterior a agora (a série já começa na hora atual). */
export function currentIndex(times: readonly string[], nowMs: number): number {
  const hour = Math.floor(nowMs / 3_600_000) * 3_600_000
  const i = times.findIndex((t) => Date.parse(t) >= hour)
  return i < 0 ? 0 : i
}

/** Todos nulos (ou vazio) = sem dado; em terra as ondas vêm assim (T-15). */
export function allNull(values: readonly (number | null)[] | undefined): boolean {
  return !values || values.every((v) => v === null)
}

/** Máximo dos valores não nulos; null se não houver nenhum. */
export function maxOf(...series: readonly (readonly (number | null)[])[]): number | null {
  let m: number | null = null
  for (const s of series) for (const v of s) if (v !== null && (m === null || v > m)) m = v
  return m
}

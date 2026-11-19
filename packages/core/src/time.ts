// Tempo: tudo em ISO 8601 UTC com "Z". Formato canônico do app: YYYY-MM-DDTHH:mm:ssZ.

const GMT_LOCAL = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(:\d{2})?$/

/** ISO 8601 UTC com "Z", segundos opcionais (entrada da API e dos scripts). */
export const ISO_UTC_Z = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?Z$/

/** Normaliza para o formato canônico (segundos e Z) ou null se inválido. */
export function normalizeIsoZ(value: string | null | undefined): string | null {
  if (!value || !ISO_UTC_Z.test(value)) return null
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? formatUtc(ms) : null
}

/** Formata um instante (ms ou Date) no formato canônico UTC. */
export function formatUtc(value: number | Date): string {
  const ms = typeof value === 'number' ? value : value.getTime()
  if (!Number.isFinite(ms)) throw new RangeError('formatUtc: invalid time')
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z')
}

/**
 * Normaliza a hora devolvida pelo Open-Meteo com timezone=GMT
 * ("2026-11-17T00:00", sem "Z") para o formato canônico UTC.
 * Qualquer outro formato é erro: não se adivinha fuso.
 */
export function normalizeGmt(value: string): string {
  const m = GMT_LOCAL.exec(value)
  if (!m) throw new RangeError(`normalizeGmt: unexpected time format "${value}"`)
  return `${m[1]}${m[2] ?? ':00'}Z`
}

/** Lê um instante ISO que obrigatoriamente termina em "Z" e devolve ms. */
export function parseUtc(value: string): number {
  if (!/Z$/.test(value)) throw new RangeError(`parseUtc: time must end with Z ("${value}")`)
  const ms = Date.parse(value)
  if (!Number.isFinite(ms)) throw new RangeError(`parseUtc: invalid time "${value}"`)
  return ms
}

/** Hora atual em UTC arredondada para baixo (início da resposta do /point). */
export function floorToHourUtc(value: number | Date): number {
  const ms = typeof value === 'number' ? value : value.getTime()
  return Math.floor(ms / 3_600_000) * 3_600_000
}

/**
 * Formata um instante UTC no fuso do aparelho (ou no fuso informado).
 * A interface usa esta função; o resto do app só trabalha em UTC.
 */
export function formatLocal(
  isoUtc: string,
  locale: string,
  timeZone?: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'short', timeStyle: 'short' },
): string {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(parseUtc(isoUtc))
}

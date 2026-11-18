// Tempo (B12) e alinhamento dos quadros (AC-MVP-25).
import { describe, expect, it } from 'vitest'
import { FRAME_COUNT, frameTimes, selectFrames } from './frames.ts'
import { floorToHourUtc, formatLocal, formatUtc, normalizeGmt, parseUtc } from './time.ts'

describe('tempo', () => {
  it('normaliza o GMT do Open-Meteo para UTC com Z', () => {
    expect(normalizeGmt('2026-11-17T00:00')).toBe('2026-11-17T00:00:00Z')
    expect(normalizeGmt('2026-11-17T21:30:15')).toBe('2026-11-17T21:30:15Z')
  })
  it('rejeita formato com fuso ou inesperado', () => {
    expect(() => normalizeGmt('2026-11-17T00:00-03:00')).toThrow()
    expect(() => normalizeGmt('17/11/2026 00:00')).toThrow()
  })
  it('parseUtc exige Z', () => {
    expect(() => parseUtc('2026-11-17T00:00:00')).toThrow()
    expect(parseUtc('2026-11-17T00:00:00Z')).toBe(Date.UTC(2026, 10, 17))
  })
  it('formatUtc gera o formato canônico', () => {
    expect(formatUtc(Date.UTC(2026, 10, 17, 3))).toBe('2026-11-17T03:00:00Z')
  })
  it('hora atual em UTC arredondada para baixo', () => {
    expect(formatUtc(floorToHourUtc(Date.UTC(2026, 10, 17, 14, 59, 59)))).toBe('2026-11-17T14:00:00Z')
  })
  it('exibe no fuso do aparelho: UTC-3 e UTC+0', () => {
    const opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', day: '2-digit', hourCycle: 'h23' }
    expect(formatLocal('2026-11-18T00:00:00Z', 'pt-BR', 'America/Sao_Paulo', opts)).toBe('17, 21:00')
    expect(formatLocal('2026-11-18T00:00:00Z', 'pt-BR', 'UTC', opts)).toBe('18, 00:00')
  })
})

describe('frameTimes (AC-MVP-25)', () => {
  it('run_time 21:01Z: primeiro 18T00:00Z, último 25T00:00Z, 57 quadros', () => {
    const f = frameTimes('2026-11-17T21:01:00Z')
    expect(f).toHaveLength(57)
    expect(f[0]).toBe('2026-11-18T00:00:00Z')
    expect(f[56]).toBe('2026-11-25T00:00:00Z')
  })
  it('run_time 21:00Z: primeiro 21:00Z, último 24T21:00Z', () => {
    const f = frameTimes('2026-11-17T21:00:00Z')
    expect(f[0]).toBe('2026-11-17T21:00:00Z')
    expect(f[56]).toBe('2026-11-24T21:00:00Z')
  })
  it('run_time 00:00Z: primeiro 00:00Z', () => {
    expect(frameTimes('2026-11-17T00:00:00Z')[0]).toBe('2026-11-17T00:00:00Z')
  })
  it('todos os instantes são múltiplos de 3 h UTC, de 3 em 3 h', () => {
    const f = frameTimes('2026-11-17T13:47:12Z').map(parseUtc)
    expect(FRAME_COUNT).toBe(57)
    f.forEach((t, i) => {
      expect(t % (3 * 3_600_000)).toBe(0)
      if (i > 0) expect(t - f[i - 1]).toBe(3 * 3_600_000)
    })
  })
})

describe('selectFrames', () => {
  // Série horária de 9 dias desde 00:00 UTC do dia, como a do Open-Meteo.
  const day = Date.UTC(2026, 10, 17)
  const times = Array.from({ length: 216 }, (_, i) => formatUtc(day + i * 3_600_000))
  const values: (number | null)[] = times.map((_, i) => (i === 3 ? null : i))

  it('forecast_days=9 cobre os 57 quadros de um run_time às 21:01Z', () => {
    const sel = selectFrames(times, values, frameTimes('2026-11-17T21:01:00Z'))
    expect(sel.complete).toBe(true)
    if (sel.complete) {
      expect(sel.values).toHaveLength(57)
      expect(sel.values[0]).toBe(24)
    }
  })
  it('nulo da fonte continua nulo (não vira zero)', () => {
    const sel = selectFrames(times, values, frameTimes('2026-11-17T00:00:00Z'))
    expect(sel.complete && sel.values[1]).toBeNull()
  })
  it('com 8 dias a rodada das 21:01Z fica incompleta (falta o último quadro)', () => {
    const sel = selectFrames(times.slice(0, 192), values.slice(0, 192), frameTimes('2026-11-17T21:01:00Z'))
    expect(sel).toEqual({ complete: false, missing: ['2026-11-25T00:00:00Z'] })
  })
})

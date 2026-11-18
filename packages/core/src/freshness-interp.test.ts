// Vencimento (AC-MVP-07, base de AC-MVP-26) e interpolação de ondas (AC-MVP-24).
import { describe, expect, it } from 'vitest'
import { classifyPointCache, classifyRun } from './freshness.ts'
import { formatUtc } from './time.ts'
import { interpolateDirection, interpolateScalar } from './waves-interp.ts'

const H = 3_600_000
const now = Date.UTC(2026, 10, 17, 12)
const ago = (ms: number) => formatUtc(now - ms)

describe('classifyRun (/frames)', () => {
  const cfg = { staleHours: 18, expiredHours: 48 }
  it('até 18 h: ok', () => expect(classifyRun(ago(18 * H), now, cfg)).toBe('ok'))
  it('mais de 18 h: stale', () => expect(classifyRun(ago(18 * H + 1000), now, cfg)).toBe('stale'))
  it('48 h: ainda stale', () => expect(classifyRun(ago(48 * H), now, cfg)).toBe('stale'))
  it('mais de 48 h: expired (503 data_expired)', () => expect(classifyRun(ago(48 * H + 1000), now, cfg)).toBe('expired'))
})

describe('classifyPointCache (/point)', () => {
  const cfg = { okTtlS: 10800, partialTtlS: 900, staleMaxS: 21600 }
  const entry = (status: string, age: number) => ({ status, fetched_at: ago(age), payload: { hourly: {} } })

  it('ok com 2 h: hit ok', () => {
    expect(classifyPointCache(entry('ok', 2 * H), now, cfg)).toEqual({ kind: 'hit', status: 'ok' })
  })
  it('ok com 4 h: miss, servível como stale se a fonte falhar', () => {
    expect(classifyPointCache(entry('ok', 4 * H), now, cfg)).toEqual({ kind: 'miss', staleFallback: true })
  })
  it('ok com 7 h: miss, nunca servido', () => {
    expect(classifyPointCache(entry('ok', 7 * H), now, cfg)).toEqual({ kind: 'miss', staleFallback: false })
  })
  it('partial com 10 min: hit partial; com 16 min: miss', () => {
    expect(classifyPointCache(entry('partial', 10 * 60_000), now, cfg)).toEqual({ kind: 'hit', status: 'partial' })
    expect(classifyPointCache(entry('partial', 16 * 60_000), now, cfg)).toEqual({ kind: 'miss', staleFallback: true })
  })
  it('sem entrada ou ilegível: miss sem fallback', () => {
    const miss = { kind: 'miss', staleFallback: false }
    expect(classifyPointCache(null, now, cfg)).toEqual(miss)
    expect(classifyPointCache({ status: 'weird', fetched_at: ago(H), payload: {} }, now, cfg)).toEqual(miss)
    expect(classifyPointCache({ status: 'ok', fetched_at: 'not a date', payload: {} }, now, cfg)).toEqual(miss)
    expect(classifyPointCache({ status: 'ok', fetched_at: ago(H), payload: null }, now, cfg)).toEqual(miss)
  })
})

describe('interpolação de ondas com nulos (AC-MVP-24)', () => {
  const corners = [1.0, 2.0, 3.0, null] as const

  it('canto 11 nulo, ponto (0,25; 0,25): 1,6 m com pesos renormalizados', () => {
    expect(interpolateScalar(corners, 0.25, 0.25)).toBeCloseTo(1.6, 12)
  })
  it('canto mais próximo nulo, ponto (0,75; 0,75): transparente', () => {
    expect(interpolateScalar(corners, 0.75, 0.75)).toBeNull()
  })
  it('4 cantos nulos: transparente', () => {
    expect(interpolateScalar([null, null, null, null], 0.5, 0.5)).toBeNull()
  })
  it('4 cantos válidos: bilinear normal', () => {
    // (1-x)(1-y)·1 + x(1-y)·2 + (1-x)y·3 + xy·4 com x=0,25 e y=0,75
    const expected = 0.75 * 0.25 * 1 + 0.25 * 0.25 * 2 + 0.75 * 0.75 * 3 + 0.25 * 0.75 * 4
    expect(interpolateScalar([1, 2, 3, 4], 0.25, 0.75)).toBeCloseTo(expected, 12)
  })
  it('direção por componentes: 359° e 1° dão cerca de 0°', () => {
    const d = interpolateDirection([359, 1, 359, 1], 0.5, 0.5)
    expect(d).not.toBeNull()
    expect(Math.min(d!, 360 - d!)).toBeLessThan(1e-9)
  })
  it('direção segue a regra de nulos', () => {
    expect(interpolateDirection([90, 90, 90, null], 0.75, 0.75)).toBeNull()
    expect(interpolateDirection([90, 90, 90, null], 0.25, 0.25)).toBeCloseTo(90, 9)
  })
})

// AC-MVP-03: casos a–m do B12.
import { describe, expect, it } from 'vitest'
import { kmhToKnots, kmhToMs, knotsToKmh, knotsToMs, msToKmh, msToKnots } from './units.ts'
import { toUV, waveArrowDeg } from './wind.ts'

const s = 10

describe('toUV (vento, direção de onde sopra)', () => {
  it('a: vento de Norte (d=0) dá v = -s, u = 0', () => {
    const { u, v } = toUV(s, 0)
    expect(u).toBeCloseTo(0, 9)
    expect(v).toBeCloseTo(-s, 9)
  })
  it('b: vento de Leste (d=90) dá u = -s, v = 0', () => {
    const { u, v } = toUV(s, 90)
    expect(u).toBeCloseTo(-s, 9)
    expect(v).toBeCloseTo(0, 9)
  })
  it('c: vento de Oeste (d=270) dá u = +s', () => {
    expect(toUV(s, 270).u).toBeCloseTo(s, 9)
  })
  it('d: vento de Sul (d=180) dá v = +s', () => {
    expect(toUV(s, 180).v).toBeCloseTo(s, 9)
  })
  it('f: vento oblíquo (d=45) dá u = v = -s·sen(45°)', () => {
    const { u, v } = toUV(s, 45)
    expect(u).toBeCloseTo(-0.70710678 * s, 6)
    expect(v).toBeCloseTo(-0.70710678 * s, 6)
  })
  it('k: d=360 é igual a d=0 (tolerância 1e-9)', () => {
    const a = toUV(s, 360)
    const b = toUV(s, 0)
    expect(Math.abs(a.u - b.u)).toBeLessThan(1e-9)
    expect(Math.abs(a.v - b.v)).toBeLessThan(1e-9)
    expect(Math.abs(a.u)).toBeLessThan(1e-9)
    expect(a.v).toBeCloseTo(-s, 9)
  })
  it('l: d=-90 é igual a d=270 (u = +s, v ≈ 0)', () => {
    const { u, v } = toUV(s, -90)
    expect(u).toBeCloseTo(s, 9)
    expect(Math.abs(v)).toBeLessThan(1e-9)
  })
})

describe('waveArrowDeg (onda, direção de origem)', () => {
  it('e: origem 0 aponta 180', () => expect(waveArrowDeg(0)).toBe(180))
  it('g: origem 270 aponta 90', () => expect(waveArrowDeg(270)).toBe(90))
  it('l: origem -90 aponta 90 (módulo positivo)', () => expect(waveArrowDeg(-90)).toBe(90))
  it('m: origem 360 aponta 180', () => expect(waveArrowDeg(360)).toBe(180))
})

describe('unidades', () => {
  it('h: 10 nós = 5,1444 m/s (1e-4) e 1 m/s = 3,6 km/h', () => {
    expect(Math.abs(knotsToMs(10) - 5.1444)).toBeLessThan(1e-4)
    expect(msToKmh(1)).toBeCloseTo(3.6, 12)
    expect(kmhToMs(3.6)).toBeCloseTo(1, 12)
  })
  it('i: 10 m/s ≈ 19,4384 nós (1e-3)', () => {
    expect(Math.abs(msToKnots(10) - 19.4384)).toBeLessThan(1e-3)
  })
  it('j: 10 nós = 18,52 km/h e volta preserva o valor (1e-9)', () => {
    expect(knotsToKmh(10)).toBeCloseTo(18.52, 12)
    expect(kmhToKnots(18.52)).toBeCloseTo(10, 12)
    expect(Math.abs(kmhToKnots(knotsToKmh(7.3)) - 7.3)).toBeLessThan(1e-9)
    expect(Math.abs(msToKnots(knotsToMs(7.3)) - 7.3)).toBeLessThan(1e-9)
  })
})

// Recorte e simplificação da costa (scripts/coast.ts, T-05).
import { describe, expect, it } from 'vitest'
import { buildLand, clipRing, simplify, type Ring } from './coast.ts'

const square: Ring = [
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10],
  [0, 0],
]

describe('clipRing', () => {
  it('anel dentro do bbox fica igual e fechado', () => {
    expect(clipRing(square, [-1, -1, 11, 11])).toEqual(square)
  })
  it('corta pela borda do bbox', () => {
    const out = clipRing(square, [5, -1, 11, 5])!
    expect(out[0]).toEqual(out.at(-1))
    for (const [x, y] of out) {
      expect(x).toBeGreaterThanOrEqual(5)
      expect(y).toBeLessThanOrEqual(5)
    }
    expect(out).toContainEqual([5, 0])
    expect(out).toContainEqual([10, 5])
  })
  it('anel fora do bbox some', () => {
    expect(clipRing(square, [20, 20, 30, 30])).toBeNull()
  })
})

describe('simplify', () => {
  it('remove pontos quase colineares e mantém as pontas', () => {
    expect(
      simplify(
        [
          [0, 0],
          [1, 0.0001],
          [2, 0],
          [3, 5],
        ],
        0.01,
      ),
    ).toEqual([
      [0, 0],
      [2, 0],
      [3, 5],
    ])
  })
})

describe('buildLand', () => {
  it('recorta polígonos e multipolígonos, descarta o que fica fora', () => {
    const features = [
      { geometry: { type: 'Polygon' as const, coordinates: [square] } },
      { geometry: { type: 'MultiPolygon' as const, coordinates: [[square.map(([x, y]) => [x + 100, y] as [number, number])]] } },
      { geometry: null },
    ]
    const out = buildLand(features, [-1, -1, 11, 11], 0)
    expect(out).toHaveLength(1)
    expect(out[0][0]).toEqual(square)
  })
})

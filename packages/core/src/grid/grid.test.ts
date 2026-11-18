// Geometria das grades e formato dos arquivos (B6).
import { describe, expect, it } from 'vitest'
import { ConfigError, loadConfig } from '../config.ts'
import { buildWavesFile, buildWindFile, storagePath } from './files.ts'
import { regionGrids, regionPoints } from './regions.ts'

const cfg = loadConfig({ SOURCE_MODE: 'simulated' })
const [wide, bay] = regionGrids(cfg)

describe('regiões', () => {
  it('wide: 13 × 21 = 273 pontos, de (5, -54) a (-35, -30)', () => {
    const p = regionPoints(wide)
    expect([wide.nx, wide.ny, p.length]).toEqual([13, 21, 273])
    expect(p[0]).toEqual({ lat: 5, lon: -54 })
    expect(p[1]).toEqual({ lat: 5, lon: -52 })
    expect(p[13]).toEqual({ lat: 3, lon: -54 })
    expect(p.at(-1)).toEqual({ lat: -35, lon: -30 })
  })
  it('bay: 9 × 9 = 81 pontos, passo 0,25°, sem resíduo de ponto flutuante', () => {
    const p = regionPoints(bay)
    expect([bay.nx, bay.ny, p.length]).toEqual([9, 9, 81])
    expect(p[0]).toEqual({ lat: -22, lon: -44 })
    expect(p[1]).toEqual({ lat: -22, lon: -43.75 })
    expect(p.at(-1)).toEqual({ lat: -24, lon: -42 })
    expect(bay).toMatchObject({ lo1: -44, la1: -22, lo2: -42, la2: -24 })
  })
  it('bbox inválido ou fora do passo dá erro de configuração', () => {
    expect(() => loadConfig({ SOURCE_MODE: 'simulated', GRID_BBOX: '-54,5,-30,-35' })).toThrow(ConfigError)
    expect(() => loadConfig({ SOURCE_MODE: 'simulated', GRID_BAY_BBOX: '-44,-24,-42.1,-22' })).toThrow(ConfigError)
  })
})

describe('arquivo de vento', () => {
  const n = bay.nx * bay.ny
  const speed = Array.from({ length: n }, () => 10)
  const dir: (number | null)[] = Array.from({ length: n }, () => 0)
  dir[5] = null

  it('U antes de V, header do leaflet-velocity, dx e dy positivos, la1 > la2', () => {
    const [u, v] = buildWindFile(bay, '2026-11-18T00:00:00Z', speed, dir)
    expect(u.header).toMatchObject({ parameterCategory: 2, parameterNumber: 2, parameterUnit: 'm.s-1' })
    expect(v.header).toMatchObject({ parameterCategory: 2, parameterNumber: 3 })
    expect(u.header).toMatchObject({ dx: 0.25, dy: 0.25, nx: 9, ny: 9, la1: -22, la2: -24, refTime: '2026-11-18T00:00:00Z', forecastTime: 0 })
    expect(u.data).toHaveLength(81)
  })
  it('vento de norte vira v = -s; ausente continua null', () => {
    const [u, v] = buildWindFile(bay, '2026-11-18T00:00:00Z', speed, dir)
    expect(u.data[0]).toBeCloseTo(0, 9)
    expect(v.data[0]).toBe(-10)
    expect(u.data[5]).toBeNull()
    expect(v.data[5]).toBeNull()
  })
  it('recusa quantidade errada de valores', () => {
    expect(() => buildWindFile(bay, '2026-11-18T00:00:00Z', [1], [1])).toThrow(RangeError)
  })
})

describe('arquivo de ondas', () => {
  it('altura antes de direção, unidades m e deg_from, null preservado', () => {
    const h = Array.from({ length: 81 }, (_, i) => (i === 0 ? null : 1.5))
    const d = Array.from({ length: 81 }, () => 150)
    const [height, direction] = buildWavesFile(bay, '2026-11-18T00:00:00Z', h, d)
    expect(height.header).toMatchObject({ parameter: 'height', unit: 'm', nx: 9, ny: 9 })
    expect(direction.header).toMatchObject({ parameter: 'direction', unit: 'deg_from' })
    expect(height.data[0]).toBeNull()
    expect(height.data[1]).toBe(1.5)
  })
})

it('caminho no Storage sem ":"', () => {
  expect(storagePath('2026-11-17T20:15:03Z', 'bay', 'wind', '2026-11-17T21:00:00Z')).toBe(
    'runs/2026-11-17T20-15-03Z/bay/wind/2026-11-17T21-00-00Z.json',
  )
})

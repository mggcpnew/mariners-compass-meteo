// Gerador de ícones do PWA (scripts/icons.ts).
import { inflateSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { encodePng, iconSvg, rasterize } from './icons.ts'

describe('ícones', () => {
  it('PNG válido: assinatura, IHDR com o tamanho e dados que descomprimem', () => {
    const size = 16
    const png = encodePng(size, rasterize(size, 0.86, 1))
    expect([...png.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    expect(png.subarray(12, 16).toString('ascii')).toBe('IHDR')
    expect(png.readUInt32BE(16)).toBe(size)
    expect(png.readUInt32BE(20)).toBe(size)
    const idatLen = png.readUInt32BE(33)
    expect(png.subarray(37, 41).toString('ascii')).toBe('IDAT')
    expect(inflateSync(png.subarray(41, 41 + idatLen)).length).toBe(size * (size * 3 + 1))
  })
  it('fundo marinho no canto e rosa clara no centro', () => {
    const size = 64
    const rgb = rasterize(size, 0.86, 2)
    expect([...rgb.subarray(0, 3)]).toEqual([0x0b, 0x25, 0x45])
    const c = ((size / 2) * size + size / 2) * 3
    expect(rgb[c]).toBeGreaterThan(200)
  })
  it('SVG com a mesma rosa', () => {
    expect(iconSvg()).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/)
    expect(iconSvg()).toContain('#4fd1e8')
  })
})

// Gera os ícones do PWA (B10: ícones próprios, rosa dos ventos) em
// apps/web/public/icons/: icon.svg, icon-192.png, icon-512.png,
// icon-maskable-512.png e apple-touch-icon.png (180).
// Rasterizador e codificador PNG próprios (node:zlib), sem dependência nova.
// Uso: node scripts/icons.ts
import { writeFileSync, mkdirSync } from 'node:fs'
import { crc32, deflateSync } from 'node:zlib'
import { isMain } from './ci/is-main.ts'

type Rgb = readonly [number, number, number]
type Pt = readonly [number, number]

const NAVY: Rgb = [0x0b, 0x25, 0x45]
const SAND: Rgb = [0xf4, 0xeb, 0xd9]
const SHADE: Rgb = [0x3a, 0x55, 0x78]
const MUTED: Rgb = [0xa9, 0xa9, 0x9c]
const CYAN: Rgb = [0x4f, 0xd1, 0xe8]

const hex = (c: Rgb) => `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`

interface Shape {
  color: Rgb
  inside(x: number, y: number): boolean
  svg: string
}

function rotate([x, y]: Pt, deg: number): Pt {
  const r = (deg * Math.PI) / 180
  return [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)]
}

function polygon(points: Pt[], color: Rgb): Shape {
  return {
    color,
    inside(x, y) {
      let inside = false
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const [xi, yi] = points[i]
        const [xj, yj] = points[j]
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
      }
      return inside
    },
    svg: `<polygon points="${points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')}" fill="${hex(color)}"/>`,
  }
}

function ring(r0: number, r1: number, color: Rgb): Shape {
  return {
    color,
    inside: (x, y) => {
      const d = Math.hypot(x, y)
      return d >= r0 && d <= r1
    },
    svg: `<circle r="${(r0 + r1) / 2}" fill="none" stroke="${hex(color)}" stroke-width="${r1 - r0}"/>`,
  }
}

function disc(r: number, color: Rgb): Shape {
  return { color, inside: (x, y) => Math.hypot(x, y) <= r, svg: `<circle r="${r}" fill="${hex(color)}"/>` }
}

/** A rosa em coordenadas do viewBox -50..50 (y para baixo), a mesma de src/icons.ts. */
export function roseShapes(): Shape[] {
  const point = (len: number, half: number, angle: number, fill: Rgb, hollow: Rgb): Shape[] => {
    const side = (x: number): Pt[] => [rotate([0, -len], angle), rotate([x, -half], angle), [0, 0]]
    return [polygon(side(half), fill), polygon(side(-half), hollow)]
  }
  return [
    ring(45.75, 48.25, SAND),
    ...[45, 135, 225, 315].flatMap((a) => point(28, 6, a, MUTED, SHADE)),
    ...[90, 180, 270].flatMap((a) => point(44, 8, a, SAND, SHADE)),
    ...point(44, 8, 0, CYAN, SHADE),
    disc(3.5, SAND),
  ]
}

/** Ícone quadrado, fundo cheio (serve de maskable): a rosa ocupa `scale` da metade do lado. */
export function rasterize(size: number, scale: number, samples = 4): Uint8Array {
  const shapes = roseShapes()
  const out = new Uint8Array(size * size * 3)
  const unit = (size / 2) * scale / 50
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const acc = [0, 0, 0]
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const x = (px + (sx + 0.5) / samples - size / 2) / unit
          const y = (py + (sy + 0.5) / samples - size / 2) / unit
          let c = NAVY
          for (const s of shapes) if (s.inside(x, y)) c = s.color
          acc[0] += c[0]
          acc[1] += c[1]
          acc[2] += c[2]
        }
      }
      const k = (py * size + px) * 3
      const n = samples * samples
      out[k] = Math.round(acc[0] / n)
      out[k + 1] = Math.round(acc[1] / n)
      out[k + 2] = Math.round(acc[2] / n)
    }
  }
  return out
}

function chunk(type: string, data: Uint8Array): Buffer {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

/** PNG RGB 8 bits, sem entrelaçamento. */
export function encodePng(size: number, rgb: Uint8Array): Buffer {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // profundidade
  ihdr[9] = 2 // RGB
  const raw = Buffer.alloc(size * (size * 3 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0 // filtro "none"
    Buffer.from(rgb.buffer, rgb.byteOffset + y * size * 3, size * 3).copy(raw, y * (size * 3 + 1) + 1)
  }
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  return Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', new Uint8Array())])
}

export function iconSvg(): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-50 -50 100 100">` +
    `<rect x="-50" y="-50" width="100" height="100" rx="18" fill="${hex(NAVY)}"/>` +
    `<g transform="scale(0.86)">${roseShapes().map((s) => s.svg).join('')}</g></svg>\n`
  )
}

function main(): void {
  const dir = new URL('../apps/web/public/icons/', import.meta.url)
  mkdirSync(dir, { recursive: true })
  writeFileSync(new URL('icon.svg', dir), iconSvg())
  // Normal: a rosa ocupa 86% do lado; maskable: 72% (zona segura de 80%).
  const files: [string, number, number][] = [
    ['icon-192.png', 192, 0.86],
    ['icon-512.png', 512, 0.86],
    ['icon-maskable-512.png', 512, 0.72],
    ['apple-touch-icon.png', 180, 0.8],
  ]
  for (const [name, size, scale] of files) writeFileSync(new URL(name, dir), encodePng(size, rasterize(size, scale)))
  console.log(`icons: ${files.length + 1} files`)
}

if (isMain(import.meta.url)) main()

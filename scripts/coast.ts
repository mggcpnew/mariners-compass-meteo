// Gera apps/web/public/data/land.geojson a partir do Natural Earth 10m (T-05).
// Fonte: https://github.com/nvkelso/natural-earth-vector, tag v5.1.2,
// geojson/ne_10m_land.geojson e geojson/ne_10m_minor_islands.geojson.
// Natural Earth é domínio público (https://www.naturalearthdata.com/about/terms-of-use/).
//
// Uso: node scripts/coast.ts <ne_10m_land.geojson> [<ne_10m_minor_islands.geojson>]
// Os arquivos de entrada ficam fora do repositório; só a saída recortada é versionada.
import { readFileSync, writeFileSync } from 'node:fs'
import { isMain } from './ci/is-main.ts'

export type Position = [number, number]
export type Ring = Position[]
/** oeste, sul, leste, norte. */
export type BBox = readonly [number, number, number, number]

/** bbox da grade ampla (GRID_BBOX) com 1° de folga. */
export const COAST_BBOX: BBox = [-55, -36, -29, 6]
/** Tolerância da simplificação em graus (~110 m). */
export const SIMPLIFY_DEG = 0.001
const DECIMALS = 4

type Edge = { inside: (p: Position) => boolean; cross: (a: Position, b: Position) => Position }

function edges([w, s, e, n]: BBox): Edge[] {
  const atX = (x: number) => (a: Position, b: Position): Position => [x, a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0])]
  const atY = (y: number) => (a: Position, b: Position): Position => [a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]), y]
  return [
    { inside: (p) => p[0] >= w, cross: atX(w) },
    { inside: (p) => p[0] <= e, cross: atX(e) },
    { inside: (p) => p[1] >= s, cross: atY(s) },
    { inside: (p) => p[1] <= n, cross: atY(n) },
  ]
}

/** Recorte de um anel (fechado ou não) ao retângulo (Sutherland-Hodgman). Devolve anel fechado ou null. */
export function clipRing(ring: Ring, bbox: BBox): Ring | null {
  let pts = ring.length > 1 && ring[0][0] === ring.at(-1)![0] && ring[0][1] === ring.at(-1)![1] ? ring.slice(0, -1) : ring
  for (const edge of edges(bbox)) {
    if (pts.length === 0) break
    const out: Position[] = []
    pts.forEach((cur, i) => {
      const prev = pts[(i + pts.length - 1) % pts.length]
      const curIn = edge.inside(cur)
      const prevIn = edge.inside(prev)
      if (curIn) {
        if (!prevIn) out.push(edge.cross(prev, cur))
        out.push(cur)
      } else if (prevIn) {
        out.push(edge.cross(prev, cur))
      }
    })
    pts = out
  }
  if (pts.length < 3) return null
  return [...pts, pts[0]]
}

function perpDistance(p: Position, a: Position, b: Position): number {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len = Math.hypot(dx, dy)
  if (len === 0) return Math.hypot(p[0] - a[0], p[1] - a[1])
  return Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / len
}

/** Douglas-Peucker iterativo. Mantém o primeiro e o último ponto. */
export function simplify(line: Position[], tolerance: number): Position[] {
  if (line.length <= 2) return line
  const keep = new Uint8Array(line.length)
  keep[0] = keep[line.length - 1] = 1
  const stack: [number, number][] = [[0, line.length - 1]]
  while (stack.length) {
    const [i0, i1] = stack.pop()!
    let max = 0
    let idx = -1
    for (let i = i0 + 1; i < i1; i++) {
      const d = perpDistance(line[i], line[i0], line[i1])
      if (d > max) {
        max = d
        idx = i
      }
    }
    if (idx >= 0 && max > tolerance) {
      keep[idx] = 1
      stack.push([i0, idx], [idx, i1])
    }
  }
  return line.filter((_, i) => keep[i])
}

const roundPos = ([x, y]: Position): Position => [Number(x.toFixed(DECIMALS)), Number(y.toFixed(DECIMALS))]

function dedupe(ring: Ring): Ring {
  return ring.filter((p, i) => i === 0 || p[0] !== ring[i - 1][0] || p[1] !== ring[i - 1][1])
}

interface Feature {
  geometry: { type: 'Polygon'; coordinates: Ring[] } | { type: 'MultiPolygon'; coordinates: Ring[][] } | null
}

/** Polígonos de terra recortados, simplificados e arredondados. */
export function buildLand(features: Feature[], bbox: BBox = COAST_BBOX, tolerance = SIMPLIFY_DEG): Ring[][] {
  const polygons: Ring[][] = []
  for (const f of features) {
    const g = f.geometry
    if (!g) continue
    const list = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []
    for (const poly of list) {
      const rings: Ring[] = []
      for (const [k, ring] of poly.entries()) {
        const clipped = clipRing(ring, bbox)
        if (!clipped) {
          if (k === 0) break
          continue
        }
        const out = dedupe(simplify(clipped, tolerance).map(roundPos))
        if (out.length >= 4) rings.push(out)
        else if (k === 0) break
      }
      if (rings.length) polygons.push(rings)
    }
  }
  return polygons
}

function main(args: string[]): void {
  if (args.length === 0) throw new Error('usage: node scripts/coast.ts <ne_10m_land.geojson> [<ne_10m_minor_islands.geojson>]')
  const features = args.flatMap((p) => (JSON.parse(readFileSync(p, 'utf8')) as { features: Feature[] }).features)
  const polygons = buildLand(features)
  const out = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { source: 'Natural Earth 10m land + minor islands v5.1.2', credit: 'Made with Natural Earth.' },
        geometry: { type: 'MultiPolygon', coordinates: polygons },
      },
    ],
  }
  const target = new URL('../apps/web/public/data/land.geojson', import.meta.url)
  writeFileSync(target, JSON.stringify(out) + '\n')
  console.log(`land.geojson: ${polygons.length} polygons, ${polygons.flat(2).length} points`)
}

if (isMain(import.meta.url)) main(process.argv.slice(2))

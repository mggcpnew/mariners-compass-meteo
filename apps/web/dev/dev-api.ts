// API v1 de desenvolvimento: o mesmo handler da produção (packages/api) com um
// store em memória que fabrica uma rodada simulada. Ondas ficam null sobre a
// terra (polígonos do Natural Earth), como a fonte real faz (T-15).
// Só roda no `vite dev`; nunca entra no build.
import { readFileSync } from 'node:fs'
import { createHandler, type ApiStore, type NoticeRow, type PointCacheRow } from '@mariners-compass/api'
import {
  buildWavesFile,
  buildWindFile,
  createSources,
  formatUtc,
  frameTimes,
  loadConfig,
  normalizeDeg,
  regionGrids,
  regionPoints,
  storagePath,
  type LayerId,
  type RegionGrid,
} from '@mariners-compass/core'

type Ring = [number, number][]

function insideRing(lon: number, lat: number, ring: Ring): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function landTest(path: string): (lat: number, lon: number) => boolean {
  const geo = JSON.parse(readFileSync(path, 'utf8')) as { features: { geometry: { coordinates: Ring[][] } }[] }
  const polygons = geo.features.flatMap((f) => f.geometry.coordinates)
  return (lat, lon) => polygons.some(([outer, ...holes]) => insideRing(lon, lat, outer) && !holes.some((h) => insideRing(lon, lat, h)))
}

const RUN_STEP_MS = 6 * 3_600_000

export function createDevApi(landPath: string) {
  const env = { SOURCE_MODE: 'simulated', POINT_CLIENT_LIMIT: 'off' }
  const cfg = loadConfig(env)
  const isLand = landTest(landPath)
  // Rodada simulada: a última hora múltipla de 6 h UTC, publicada há pouco.
  const runTime = formatUtc(Math.floor(Date.now() / RUN_STEP_MS) * RUN_STEP_MS - RUN_STEP_MS)
  const run = { id: 'dev-run', source: 'openmeteo', model: 'simulated', runTime, ingestedAt: formatUtc(Date.now()), status: 'closed' as const }
  const frames = frameTimes(runTime)
  const grids = new Map(regionGrids(cfg).map((g) => [g.id, g]))
  const landCache = new Map<string, boolean[]>()

  function landMask(g: RegionGrid): boolean[] {
    let m = landCache.get(g.id)
    if (!m) landCache.set(g.id, (m = regionPoints(g).map((p) => isLand(p.lat, p.lon))))
    return m
  }

  function synthesize(region: string, layer: LayerId, validTime: string): string | null {
    const g = grids.get(region as RegionGrid['id'])
    const k = frames.indexOf(validTime)
    if (!g || k < 0) return null
    const pts = regionPoints(g)
    const t = k / 8
    if (layer === 'wind') {
      // Vento de E/SE com rajadas que passeiam pelo mapa ao longo do tempo.
      const speed = pts.map((p) => Math.max(0.5, 6 + 5 * Math.sin(p.lat * 0.9 + t) * Math.cos(p.lon * 0.7 - t * 0.6)))
      const dir = pts.map((p) => Math.round(normalizeDeg(110 + 50 * Math.sin(t * 0.8 + p.lon * 0.3) + 20 * Math.cos(p.lat * 0.5))))
      return JSON.stringify(buildWindFile(g, validTime, speed, dir))
    }
    const land = landMask(g)
    const height = pts.map((p, i) =>
      land[i] ? null : Math.round(Math.max(0.1, 1.4 + 0.9 * Math.sin(p.lat * 0.6 - t) + 0.5 * Math.cos(p.lon * 2 + t)) * 100) / 100,
    )
    const dir = pts.map((p, i) => (land[i] ? null : Math.round(normalizeDeg(160 + 30 * Math.sin(t + p.lat * 0.2)))))
    return JSON.stringify(buildWavesFile(g, validTime, height, dir))
  }

  const cache = new Map<string, PointCacheRow>()
  // Aviso de exemplo para ver a faixa no dev. MC_DEV_NOTICES=off mostra o estado vazio.
  const withNotice = process.env.MC_DEV_NOTICES?.trim() !== 'off'
  const registeredAt = formatUtc(Date.now() - 2 * 3_600_000)
  const notices: NoticeRow[] = withNotice
    ? [
        {
          id: 'dev-1',
          title: '[DEV] Aviso simulado de mau tempo',
          body: 'Texto de exemplo do ambiente de desenvolvimento. Ventos de 25 a 35 nós e ondas de 2,5 a 3,5 m.',
          issued_at: registeredAt,
          valid_until: formatUtc(Date.now() + 24 * 3_600_000),
          source_url: 'https://www.marinha.mil.br/chm',
          registered_at: registeredAt,
        },
      ]
    : []
  const lastChecked = withNotice ? formatUtc(Date.now() - 3_600_000) : null
  const store: ApiStore = {
    latestClosedRun: async () => run,
    closedRunByTime: async (t) => (t === runTime ? run : null),
    layerPath: async (_id, region, layer, validTime) => storagePath(runTime, region, layer as LayerId, validTime),
    downloadGrid: async (path) => {
      const m = /^runs\/[^/]+\/([a-z]+)\/([a-z]+)\/(.+)\.json$/.exec(path)
      if (!m) return null
      const time = m[3].replace(/T(\d{2})-(\d{2})-(\d{2})Z$/, 'T$1:$2:$3Z')
      return synthesize(m[1], m[2] as LayerId, time)
    },
    getPointCache: async (key) => cache.get(key) ?? null,
    putPointCache: async (row) => void cache.set(row.key, row),
    reservePoint: async () => ({ allowed: true, reason: null }),
    validNotices: async () => notices,
    lastRegisteredAt: async () => (withNotice ? registeredAt : null),
    lastCheckedAt: async () => lastChecked,
  }

  return createHandler(() => ({
    cfg,
    store,
    now: Date.now,
    sources: () => createSources(cfg),
    clientSecret: null,
  }))
}

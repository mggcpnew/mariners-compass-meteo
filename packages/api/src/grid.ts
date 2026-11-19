// GET /api/v1/grid?layer=&run_time=&time=&bbox=&res= (B7). Só repassa o
// arquivo do Storage; resposta imutável, sem X-Status nem X-Updated-At.
import { frameTimes, normalizeIsoZ, parseUtc, regionGrids, type RegionGrid } from '@mariners-compass/core'
import type { BaseContext } from './context.ts'
import { parseLayer } from './frames.ts'
import { ATTRIBUTION_OPEN_METEO, errorResponse } from './http.ts'

/** Par bbox/res pré-gerado; ausentes = grade ampla; misto ou outro = null. */
export function pickRegion(grids: RegionGrid[], bbox: string | null, res: string | null): RegionGrid | null {
  if (bbox === null && res === null) return grids.find((g) => g.id === 'wide') ?? null
  if (bbox === null || res === null) return null
  const nums = bbox.split(',').map((x) => Number(x.trim()))
  const r = Number(res)
  if (nums.length !== 4 || nums.some((x) => !Number.isFinite(x)) || !Number.isFinite(r)) return null
  return grids.find((g) => g.res === r && g.bbox.every((v, i) => v === nums[i])) ?? null
}

export async function handleGrid(url: URL, ctx: BaseContext): Promise<Response> {
  const q = url.searchParams
  const layer = parseLayer(q.get('layer'))
  if (!layer) return errorResponse('invalid_parameter', 'layer must be "wind" or "waves"')
  const runTime = normalizeIsoZ(q.get('run_time'))
  if (!runTime) return errorResponse('invalid_parameter', 'run_time is required (ISO 8601 UTC with Z)')
  const time = normalizeIsoZ(q.get('time'))
  if (!time) return errorResponse('invalid_parameter', 'time is required (ISO 8601 UTC with Z)')
  const region = pickRegion(regionGrids(ctx.cfg), q.get('bbox'), q.get('res'))
  if (!region) return errorResponse('invalid_parameter', 'bbox and res must be one of the pre-generated pairs')
  if (!frameTimes(runTime).includes(time)) return errorResponse('invalid_parameter', 'time is not a frame of this run')

  // Defesa: rodada vencida não é servida, mesmo que ainda exista.
  if (ctx.now() - parseUtc(runTime) > ctx.cfg.grid.expiredHours * 3_600_000) {
    return errorResponse('data_expired', `run_time older than ${ctx.cfg.grid.expiredHours} h`)
  }

  const run = await ctx.store.closedRunByTime(runTime)
  if (!run) return errorResponse('run_not_found', 'run_time not found; reload /frames')
  const path = await ctx.store.layerPath(run.id, region.id, layer, time)
  const body = path ? await ctx.store.downloadGrid(path) : null
  if (!body) return errorResponse('run_not_found', 'grid file not found for this run; reload /frames')

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Source': run.source,
      'X-Run-Time': run.runTime,
      // Cabeçalho HTTP só aceita ASCII: crédito codificado (decodeURIComponent no front).
      'X-Attribution': encodeURIComponent(ATTRIBUTION_OPEN_METEO),
      'Access-Control-Expose-Headers': 'X-Source, X-Run-Time, X-Attribution',
    },
  })
}

// GET /api/v1/frames?layer=wind|waves (B7). Aqui o vencimento é calculado.
import { classifyRun, frameTimes, LAYER_IDS, regionGrids, type LayerId } from '@mariners-compass/core'
import type { BaseContext } from './context.ts'
import { ATTRIBUTION_OPEN_METEO, cachePublic, errorResponse, json } from './http.ts'

export const GRID_UNITS: Record<LayerId, Record<string, string>> = {
  wind: { u: 'm/s', v: 'm/s' },
  waves: { height: 'm', direction: 'deg_from' },
}

export function parseLayer(value: string | null): LayerId | null {
  return LAYER_IDS.includes(value as LayerId) ? (value as LayerId) : null
}

export async function handleFrames(url: URL, ctx: BaseContext): Promise<Response> {
  const layer = parseLayer(url.searchParams.get('layer'))
  if (!layer) return errorResponse('invalid_parameter', 'layer must be "wind" or "waves"')

  const run = await ctx.store.latestClosedRun()
  if (!run) return errorResponse('data_expired', 'no published run')
  const status = classifyRun(run.runTime, ctx.now(), ctx.cfg.grid)
  if (status === 'expired') return errorResponse('data_expired', `latest run ${run.runTime} is older than ${ctx.cfg.grid.expiredHours} h`)

  return json(
    {
      meta: {
        source: run.source,
        model: run.model,
        run_time: run.runTime,
        updated_at: run.ingestedAt,
        units: GRID_UNITS[layer],
        status,
        layers: [...LAYER_IDS],
        regions: regionGrids(ctx.cfg).map((g) => ({ id: g.id, bbox: g.bbox, res: g.res })),
        attribution: [ATTRIBUTION_OPEN_METEO],
      },
      times: frameTimes(run.runTime),
    },
    { headers: cachePublic(ctx.cfg.framesCacheS) },
  )
}

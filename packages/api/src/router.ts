// Roteamento da API v1 numa única Function (recomendação da Vercel: rotas
// relacionadas na mesma Function). Erros inesperados nunca vazam detalhes.
import type { AppConfig, Sources } from '@mariners-compass/core'
import { clientHash, clientIp } from './client.ts'
import type { BaseContext } from './context.ts'
import { handleFrames } from './frames.ts'
import { handleGrid } from './grid.ts'
import { errorResponse } from './http.ts'
import { handleNotices } from './notices.ts'
import { handlePoint } from './point.ts'
import { StoreUnavailableError, type ApiStore } from './store.ts'

export interface AppDeps {
  cfg: AppConfig
  store: ApiStore
  now: () => number
  /** Criadas só quando o /point precisa (AC-MVP-16). */
  sources: () => Sources
  /** Segredo do HMAC do IP; obrigatório se o limite por cliente estiver ligado. */
  clientSecret: string | null
}

const ROUTES = ['frames', 'grid', 'point', 'notices', 'route'] as const
type Route = (typeof ROUTES)[number]

/** Nome da rota a partir do caminho /api/v1/<rota>. */
export function routeOf(url: URL): Route | null {
  const m = /^\/api\/v1\/([a-z]+)\/?$/.exec(url.pathname)
  return m && (ROUTES as readonly string[]).includes(m[1]) ? (m[1] as Route) : null
}

export function createHandler(getDeps: () => AppDeps, log: (msg: string) => void = console.error) {
  return async function handle(request: Request): Promise<Response> {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return errorResponse('method_not_allowed', 'only GET is supported', { Allow: 'GET, HEAD' })
    }
    const url = new URL(request.url)
    const route = routeOf(url)
    if (!route) return errorResponse('not_found', 'unknown endpoint')
    if (route === 'route') return errorResponse('not_implemented', 'route planning is planned for phase 2')

    let deps: AppDeps
    try {
      deps = getDeps()
    } catch (err) {
      log(`api config error: ${(err as Error).message}`)
      return errorResponse('service_unavailable', 'service is not configured')
    }
    const base: BaseContext = { cfg: deps.cfg, store: deps.store, now: deps.now }

    try {
      switch (route) {
        case 'frames':
          return await handleFrames(url, base)
        case 'grid':
          return await handleGrid(url, base)
        case 'notices':
          return await handleNotices(base)
        case 'point': {
          let hash: string | null = null
          if (deps.cfg.point.clientLimit) {
            if (!deps.clientSecret) {
              log('api config error: CLIENT_HASH_SECRET is required when POINT_CLIENT_LIMIT=on')
              return errorResponse('service_unavailable', 'service is not configured')
            }
            hash = clientHash(clientIp(request.headers), deps.clientSecret)
          }
          return await handlePoint(url, { ...base, sources: deps.sources(), clientHash: hash })
        }
      }
    } catch (err) {
      if (!(err instanceof StoreUnavailableError)) log(`api error on ${route}: ${(err as Error).stack ?? err}`)
      else log(`api store unavailable on ${route}: ${err.message}`)
      return errorResponse('service_unavailable', 'service temporarily unavailable')
    }
  }
}

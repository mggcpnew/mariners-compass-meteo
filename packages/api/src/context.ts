// Dependências de cada pedido. As fontes externas só existem no /point
// (AC-MVP-16): os outros handlers não recebem `sources`.
import type { AppConfig, Sources } from '@mariners-compass/core'
import type { ApiStore } from './store.ts'

export interface BaseContext {
  cfg: AppConfig
  store: ApiStore
  now: () => number
}

export interface PointContext extends BaseContext {
  sources: Sources
  /** HMAC do IP do cliente (hex) ou null se o limite por cliente estiver desligado. */
  clientHash: string | null
}

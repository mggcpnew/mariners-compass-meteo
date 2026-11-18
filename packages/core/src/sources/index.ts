// Escolhe os adaptadores pelo SOURCE_MODE. Em "live", URLs ausentes = erro
// imediato, antes de qualquer chamada (fail-closed, B5).
import type { AppConfig } from '../config.ts'
import { createOpenMeteoForecast, createOpenMeteoMarine, type FetchLike } from './openmeteo.ts'
import { createSimulatedForecast, createSimulatedMarine, type SimulatedOptions } from './simulated.ts'
import { SourceConfigError, type ForecastSource, type MarineSource } from './types.ts'

/** Tempo máximo de uma chamada à fonte; depois disso conta como falha. */
export const SOURCE_TIMEOUT_MS = 15_000

export interface Sources {
  forecast: ForecastSource
  marine: MarineSource
  /** Valor para model_runs.model: "forecast:<m>|marine:<m>" ou "auto". */
  modelLabel: string
}

export interface CreateSourcesOptions {
  fetch?: FetchLike
  simulated?: { forecast?: SimulatedOptions; marine?: SimulatedOptions }
}

/** Formato de model_runs.model (B5): "auto" se nenhum modelo foi fixado. */
export function modelLabel(forecast: string | null, marine: string | null): string {
  if (!forecast && !marine) return 'auto'
  return `forecast:${forecast ?? 'auto'}|marine:${marine ?? 'auto'}`
}

export function createSources(cfg: AppConfig, opts: CreateSourcesOptions = {}): Sources {
  if (cfg.sourceMode === 'simulated') {
    return {
      forecast: createSimulatedForecast(opts.simulated?.forecast),
      marine: createSimulatedMarine(opts.simulated?.marine),
      modelLabel: 'simulated',
    }
  }
  const { forecastUrl, marineUrl, modelForecast, modelMarine } = cfg.openMeteo
  if (!forecastUrl || !marineUrl) {
    throw new SourceConfigError('OPENMETEO_FORECAST_URL and OPENMETEO_MARINE_URL are required when SOURCE_MODE=live')
  }
  const fetchFn: FetchLike = opts.fetch ?? ((url) => fetch(url, { signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS) }))
  return {
    forecast: createOpenMeteoForecast({ url: forecastUrl, model: modelForecast, fetch: fetchFn }),
    marine: createOpenMeteoMarine({ url: marineUrl, model: modelMarine, fetch: fetchFn }),
    modelLabel: modelLabel(modelForecast, modelMarine),
  }
}

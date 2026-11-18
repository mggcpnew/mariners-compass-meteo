// Leitura das variáveis de ambiente com os padrões do B9.
// SOURCE_MODE é obrigatório: sem ele não se sabe se a fonte é real ou simulada,
// e servir dado simulado em produção seria pior que falhar.

export class ConfigError extends Error {
  override name = 'ConfigError'
}

export type SourceMode = 'live' | 'simulated'
export type Env = Readonly<Record<string, string | undefined>>

export interface AppConfig {
  sourceMode: SourceMode
  forecastDays: number
  openMeteo: {
    forecastUrl: string | null
    marineUrl: string | null
    modelForecast: string | null
    modelMarine: string | null
  }
  point: {
    dailyBudget: number
    operatingPct: number
    cacheTtlS: number
    staleMaxS: number
    partialTtlS: number
    maxPerMin: number
    maxPerHour: number
    roundDeg: number
  }
  grid: { staleHours: number; expiredHours: number }
  ingest: { roundBudget: number; dailyBudget: number; retryMax: number; maxPerMin: number }
}

function text(env: Env, name: string): string | null {
  const v = env[name]?.trim()
  return v ? v : null
}

function num(env: Env, name: string, fallback: number, opts: { int?: boolean; min?: number; max?: number } = {}): number {
  const raw = text(env, name)
  if (raw === null) return fallback
  const n = Number(raw)
  const { int = true, min = 0, max = Number.MAX_SAFE_INTEGER } = opts
  if (!Number.isFinite(n) || (int && !Number.isInteger(n)) || n < min || n > max) {
    throw new ConfigError(`${name}: invalid value "${raw}"`)
  }
  return n
}

function url(env: Env, name: string): string | null {
  const raw = text(env, name)
  if (raw === null) return null
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    throw new ConfigError(`${name}: invalid URL "${raw}"`)
  }
  if (parsed.protocol !== 'https:') throw new ConfigError(`${name}: must use https`)
  return raw
}

export function loadConfig(env: Env): AppConfig {
  const mode = text(env, 'SOURCE_MODE')
  if (mode !== 'live' && mode !== 'simulated') {
    throw new ConfigError(`SOURCE_MODE must be "live" or "simulated" (got ${mode === null ? 'nothing' : `"${mode}"`})`)
  }
  return {
    sourceMode: mode,
    // 14 dias é o limite de peso 1 por chamada (pricing do Open-Meteo, T-14).
    forecastDays: num(env, 'FORECAST_DAYS', 9, { min: 1, max: 14 }),
    openMeteo: {
      forecastUrl: url(env, 'OPENMETEO_FORECAST_URL'),
      marineUrl: url(env, 'OPENMETEO_MARINE_URL'),
      modelForecast: text(env, 'OPENMETEO_MODEL_FORECAST'),
      modelMarine: text(env, 'OPENMETEO_MODEL_MARINE'),
    },
    point: {
      dailyBudget: num(env, 'POINT_DAILY_BUDGET', 4000, { min: 2 }),
      operatingPct: num(env, 'POINT_OPERATING_PCT', 80, { min: 1, max: 100 }),
      cacheTtlS: num(env, 'POINT_CACHE_TTL_S', 10800, { min: 1 }),
      staleMaxS: num(env, 'POINT_STALE_MAX_S', 21600, { min: 1 }),
      partialTtlS: num(env, 'POINT_PARTIAL_TTL_S', 900, { min: 1 }),
      maxPerMin: num(env, 'POINT_MAX_PER_MIN', 100, { min: 2 }),
      maxPerHour: num(env, 'POINT_MAX_PER_HOUR', 1000, { min: 2 }),
      roundDeg: num(env, 'POINT_ROUND_DEG', 0.25, { int: false, min: 0.01, max: 5 }),
    },
    grid: {
      staleHours: num(env, 'GRID_STALE_HOURS', 18, { min: 1 }),
      expiredHours: num(env, 'GRID_EXPIRED_HOURS', 48, { min: 1 }),
    },
    ingest: {
      roundBudget: num(env, 'INGEST_ROUND_BUDGET', 885, { min: 1 }),
      dailyBudget: num(env, 'INGEST_DAILY_BUDGET', 3540, { min: 1 }),
      retryMax: num(env, 'INGEST_RETRY_MAX', 2, { min: 0, max: 10 }),
      maxPerMin: num(env, 'INGEST_MAX_PER_MIN', 300, { min: 1 }),
    },
  }
}

/** Limite diário operacional do /point em chamadas (80% de 4.000 = 3.200). */
export function pointOperatingDailyLimit(cfg: AppConfig): number {
  return Math.floor((cfg.point.dailyBudget * cfg.point.operatingPct) / 100)
}

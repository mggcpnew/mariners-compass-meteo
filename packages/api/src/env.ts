// Monta as dependências a partir das variáveis de ambiente (B9), uma vez por
// instância da Function. Falta de configuração = erro (vira 503).
import { createSources, loadConfig, type Env, type Sources } from '@mariners-compass/core'
import type { AppDeps } from './router.ts'
import { createSupabaseApiStore } from './supabase-store.ts'

function required(env: Env, name: string): string {
  const v = env[name]?.trim()
  if (!v) throw new Error(`${name} is required`)
  return v
}

export function depsFromEnv(env: Env): () => AppDeps {
  let cached: AppDeps | null = null
  return () => {
    if (cached) return cached
    const cfg = loadConfig(env)
    const store = createSupabaseApiStore(
      required(env, 'SUPABASE_URL'),
      required(env, 'SUPABASE_SERVICE_ROLE_KEY'),
      cfg.grid.bucket,
    )
    let sources: Sources | null = null
    cached = {
      cfg,
      store,
      now: Date.now,
      sources: () => (sources ??= createSources(cfg)),
      clientSecret: env.CLIENT_HASH_SECRET?.trim() || null,
    }
    return cached
  }
}

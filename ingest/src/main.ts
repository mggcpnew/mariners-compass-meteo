// Ponto de entrada do job (GitHub Actions ou local). Variáveis: B9.
// Sai com código 1 se a rodada for abortada ou a configuração estiver errada.
import { createSources, loadConfig } from '@mariners-compass/core'
import { runIngest } from './ingest.ts'
import { createSupabaseStore } from './supabase-store.ts'

function required(name: string): string {
  const v = process.env[name]?.trim()
  if (!v) throw new Error(`${name} is required`)
  return v
}

async function main(): Promise<number> {
  const cfg = loadConfig(process.env)
  const store = createSupabaseStore(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), cfg.grid.bucket)
  const sources = createSources(cfg)
  console.log(`ingestão: SOURCE_MODE=${cfg.sourceMode}, FORECAST_DAYS=${cfg.forecastDays}, modelo=${sources.modelLabel}`)
  const result = await runIngest({
    cfg,
    sources,
    store,
    now: Date.now,
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    log: (m) => console.log(m),
  })
  console.log(JSON.stringify(result))
  return result.status === 'closed' ? 0 : 1
}

main().then(
  (code) => process.exit(code),
  (err: unknown) => {
    console.error(`ingestão falhou: ${(err as Error).message}`)
    process.exit(1)
  },
)

// Vite do app. Em `npm run dev` (e no `vite preview` só com MC_E2E=1, para o
// E2E sobre o build de produção), a API v1 roda dentro do próprio Vite com
// fonte simulada e dados em memória (dev/dev-api.ts): sem Supabase, sem Docker
// e sem chamar fonte externa. O build (dist/) não inclui nada de dev/.
import { fileURLToPath } from 'node:url'
import { defineConfig, type Connect, type Plugin } from 'vite'

/** Zoom mínimo para usar a grade da baía (B6, BAY_GRID_MIN_ZOOM, padrão 9). Variável de build. */
function bayGridMinZoom(): number {
  const raw = process.env.BAY_GRID_MIN_ZOOM?.trim()
  if (!raw) return 9
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 0 || n > 18) throw new Error(`BAY_GRID_MIN_ZOOM: invalid value "${raw}"`)
  return n
}

async function mountDevApi(middlewares: Connect.Server): Promise<void> {
  const { createDevApi } = await import('./dev/dev-api.ts')
  const handle = createDevApi(fileURLToPath(new URL('./public/data/land.geojson', import.meta.url)))
  middlewares.use('/api/v1', (req, res, next) => {
    const url = new URL(req.originalUrl ?? req.url ?? '/', 'http://localhost')
    handle(new Request(url, { method: req.method }))
      .then(async (response) => {
        res.statusCode = response.status
        response.headers.forEach((v, k) => res.setHeader(k, v))
        res.end(Buffer.from(await response.arrayBuffer()))
      })
      .catch(next)
  })
}

/**
 * API simulada no `vite dev` e, só com MC_E2E=1, no `vite preview` (E2E sobre o
 * build de produção). A Vercel serve o dist/ estático e nunca roda o preview.
 */
function devApi(): Plugin {
  const plugin: Plugin = {
    name: 'mariners-compass-dev-api',
    apply: 'serve',
    async configureServer(server) {
      await mountDevApi(server.middlewares)
    },
  }
  // O hook só existe com MC_E2E=1: a presença dele desliga a checagem do Vite
  // "dist não existe" em qualquer `vite preview`.
  if (process.env.MC_E2E === '1') {
    plugin.configurePreviewServer = async (server) => {
      await mountDevApi(server.middlewares)
    }
  }
  return plugin
}

export default defineConfig({
  resolve: {
    alias: {
      '@mariners-compass/core': fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url)),
    },
  },
  define: {
    __BAY_GRID_MIN_ZOOM__: JSON.stringify(bayGridMinZoom()),
  },
  plugins: [devApi()],
})

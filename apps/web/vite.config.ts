// Vite do app. Em `npm run dev`, a API v1 roda dentro do próprio Vite com
// fonte simulada e dados em memória (dev/dev-api.ts): sem Supabase, sem Docker
// e sem chamar fonte externa. O build de produção não inclui nada de dev/.
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'

/** Zoom mínimo para usar a grade da baía (B6, BAY_GRID_MIN_ZOOM, padrão 9). Variável de build. */
function bayGridMinZoom(): number {
  const raw = process.env.BAY_GRID_MIN_ZOOM?.trim()
  if (!raw) return 9
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 0 || n > 18) throw new Error(`BAY_GRID_MIN_ZOOM: invalid value "${raw}"`)
  return n
}

function devApi(): Plugin {
  return {
    name: 'mariners-compass-dev-api',
    apply: 'serve',
    async configureServer(server) {
      const { createDevApi } = await import('./dev/dev-api.ts')
      const handle = createDevApi(fileURLToPath(new URL('./public/data/land.geojson', import.meta.url)))
      server.middlewares.use('/api/v1', async (req, res) => {
        const url = new URL(req.originalUrl ?? req.url ?? '/', 'http://localhost')
        const response = await handle(new Request(url, { method: req.method }))
        res.statusCode = response.status
        response.headers.forEach((v, k) => res.setHeader(k, v))
        res.end(Buffer.from(await response.arrayBuffer()))
      })
    },
  }
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

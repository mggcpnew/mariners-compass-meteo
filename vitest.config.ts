import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Os testes usam o TypeScript dos pacotes (condição "source"), não o dist/.
const src = (pkg: string) => fileURLToPath(new URL(`./packages/${pkg}/src/index.ts`, import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@mariners-compass/core': src('core'),
      '@mariners-compass/api': src('api'),
    },
  },
  // Variável de build do front (apps/web/vite.config.ts) com o valor padrão.
  define: {
    __BAY_GRID_MIN_ZOOM__: '9',
  },
  test: {
    include: ['**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
})

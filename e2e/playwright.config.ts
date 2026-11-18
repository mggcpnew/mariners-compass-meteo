// E2E sobre o build de produção do front, servido pelo `vite preview` com a
// API v1 simulada (MC_E2E=1, apps/web/vite.config.ts). Nada chama fonte externa.
import { defineConfig, devices } from '@playwright/test'

export const PORT = 4173
export const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never', outputFolder: '../playwright-report' }]] : 'list',
  outputDir: '../test-results',
  use: {
    baseURL: BASE_URL,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: 'npx vite build && npx vite preview --port 4173 --strictPort',
    cwd: '../apps/web',
    url: BASE_URL,
    env: { MC_E2E: '1' },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})

// Ajudantes dos testes: abrir o app já com o modal de segurança confirmado
// (exceto no teste do modal) e esperar o primeiro quadro do mapa.
import { expect, type Page } from '@playwright/test'

export async function openApp(page: Page, opts: { safetyAck?: boolean; prefs?: Record<string, string> } = {}): Promise<void> {
  const prefs = { ...(opts.safetyAck === false ? {} : { 'mc.safety': '1' }), ...opts.prefs }
  await page.addInitScript((p) => {
    for (const [k, v] of Object.entries(p)) localStorage.setItem(k, v)
  }, prefs)
  const firstGrid = page.waitForResponse((r) => r.url().includes('/api/v1/grid') && r.ok())
  await page.goto('/')
  await firstGrid
}

/** Afasta o mapa com a roda do mouse sobre ele (um nível de zoom por passo). */
export async function zoomOut(page: Page, steps: number): Promise<void> {
  const box = (await page.locator('#map').boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, 120)
    await page.waitForTimeout(400)
  }
}

/** Toca no mapa e espera o painel do ponto carregar. */
export async function openPoint(page: Page): Promise<void> {
  const point = page.waitForResponse((r) => r.url().includes('/api/v1/point'))
  const box = (await page.locator('#map').boundingBox())!
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.75)
  await point
  await expect(page.locator('#point-panel .pp-now')).toBeVisible()
}

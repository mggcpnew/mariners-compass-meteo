// AC-MVP-11: axe-core sem violações críticas (WCAG 2.1 AA) nos modos claro,
// escuro e noturno, com o painel do ponto e o modal abertos.
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { openApp, openPoint } from './fixtures.ts'

async function audit(page: Page, label: string): Promise<void> {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  for (const v of result.violations) console.log(`[${label}] ${v.impact} ${v.id}: ${v.help} (${v.nodes.length})`)
  expect(result.violations.filter((v) => v.impact === 'critical').map((v) => v.id), label).toEqual([])
}

for (const colorScheme of ['light', 'dark'] as const) {
  test(`axe: mapa e painel do ponto, modo ${colorScheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme })
    await openApp(page)
    await audit(page, `${colorScheme} mapa`)
    await openPoint(page)
    await audit(page, `${colorScheme} ponto`)
  })
}

test('axe: modo noturno', async ({ page }) => {
  await openApp(page, { prefs: { 'mc.mode': 'night' } })
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'night')
  await audit(page, 'noturno mapa')
  await openPoint(page)
  await audit(page, 'noturno ponto')
})

test('axe: modal de segurança', async ({ page }) => {
  await openApp(page, { safetyAck: false })
  await expect(page.locator('dialog.safety')).toBeVisible()
  await audit(page, 'modal')
})

// Critérios E2E do MVP (B11): AC-MVP-01, 08, 10, 12, 17, 27, modal, idioma e fuso.
import { expect, test } from '@playwright/test'
import { openApp, openPoint, zoomOut } from './fixtures.ts'

const PT = {
  bay: 'Mapa montado a partir de pontos espaçados em 0,25° (cerca de 28 km). Não representa o vento local da enseada: junto ao morro, à ponte ou à entrada da baía o vento pode ser bem diferente.',
  wide: 'Mapa regional montado a partir de pontos espaçados em 2° (cerca de 220 km). Não representa o vento local da enseada.',
  point: 'Previsão para a coordenada arredondada a 0,25° (cerca de 28 km). Os valores podem diferir do mapa. É previsão de modelo, não medição no seu local.',
  fixed: 'Os avisos oficiais entram no app por registro manual e podem atrasar ou faltar. Consulte sempre o boletim oficial da Marinha.',
  footer: 'Dados de modelos numéricos. Não substitui previsão oficial da Marinha do Brasil para navegação.',
}

test('AC-MVP-01 e 10: só requisições ao próprio app, sem tiles do OSM', async ({ page, baseURL }) => {
  const hosts = new Set<string>()
  page.on('request', (r) => {
    const u = new URL(r.url())
    if (u.protocol.startsWith('http')) hosts.add(u.host)
  })
  await openApp(page)
  await openPoint(page)
  await page.locator('.pp-close').click()
  await zoomOut(page, 2)
  await page.waitForTimeout(500)
  expect([...hosts]).toEqual([new URL(baseURL!).host])
})

test('AC-MVP-27: grade da baía no zoom 10 da enseada; ampla ao afastar', async ({ page }) => {
  const grids: URL[] = []
  page.on('request', (r) => {
    if (r.url().includes('/api/v1/grid')) grids.push(new URL(r.url()))
  })
  await openApp(page)
  expect(grids[0].searchParams.get('bbox')).toBe('-44,-24,-42,-22')
  expect(grids[0].searchParams.get('res')).toBe('0.25')
  const wide = page.waitForRequest((r) => r.url().includes('/api/v1/grid') && new URL(r.url()).searchParams.get('res') === '2')
  await zoomOut(page, 2)
  expect(new URL((await wide).url()).searchParams.get('bbox')).toBe('-54,-35,-30,5')
})

test('AC-MVP-08: aviso de resolução de cada tela, aviso fixo, rodapé e fonte (pt-BR)', async ({ page }) => {
  await openApp(page)
  await expect(page.locator('#resolution')).toHaveText(PT.bay)
  await expect(page.locator('#notices')).toContainText(PT.fixed)
  await expect(page.locator('.disclaimer')).toHaveText(PT.footer)
  await expect(page.locator('#source-label')).toContainText('Fonte: Open-Meteo')
  await expect(page.locator('#attribution')).toHaveText('Dados: Open-Meteo.com (CC BY 4.0)')
  await openPoint(page)
  await expect(page.locator('.pp-resolution')).toHaveText(PT.point)
  await expect(page.locator('.pp-source')).toContainText('Fonte: Open-Meteo')
  await page.locator('.pp-close').click()
  await zoomOut(page, 2)
  await expect(page.locator('#resolution')).toHaveText(PT.wide)
})

test('AC-MVP-08 e 15: os mesmos avisos em inglês', async ({ page }) => {
  await openApp(page, { prefs: { 'mc.lang': 'en' } })
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.locator('#resolution')).toContainText('Map built from points 0.25° apart')
  await expect(page.locator('#notices')).toContainText('Official warnings enter the app by manual registration')
  await expect(page.locator('.disclaimer')).toContainText('Numerical model data.')
  await openPoint(page)
  await expect(page.locator('.pp-resolution')).toContainText('Forecast for the coordinate rounded to 0.25°')
})

test('AC-MVP-17: aviso registrado em destaque com crédito, link e datas', async ({ page }) => {
  await openApp(page)
  const strip = page.locator('#notices')
  await expect(strip.locator('.nt-badge')).toHaveText('Aviso oficial')
  await expect(strip.locator('.nt-title')).toContainText('[DEV]')
  await expect(strip).toContainText('Fonte: Marinha do Brasil, CHM/DHN')
  await expect(strip.locator('.nt-link').first()).toHaveAttribute('href', /^https:\/\/www\.marinha\.mil\.br\//)
  await expect(strip).toContainText('Último registro:')
  await expect(strip).toContainText('Última conferência do boletim:')
  await expect(strip).toContainText(PT.fixed)
})

test('AC-MVP-17: sem aviso, diz que nada foi registrado e aponta o boletim', async ({ page }) => {
  await page.route('**/api/v1/notices', (route) =>
    route.fulfill({
      json: {
        meta: {
          source: 'Marinha do Brasil, CHM/DHN',
          attribution: ['Fonte: Marinha do Brasil, CHM/DHN'],
          bulletin_url: 'https://www.marinha.mil.br/chm',
          last_registered_at: null,
          last_checked_at: null,
          updated_at: '2026-11-18T12:00:00Z',
        },
        notices: [],
      },
    }),
  )
  await openApp(page)
  const strip = page.locator('#notices')
  await expect(strip).toContainText('Nenhum aviso registrado no app.')
  await expect(strip.locator('.nt-link')).toHaveAttribute('href', 'https://www.marinha.mil.br/chm')
  await expect(strip).toContainText(PT.fixed)
})

test('modal de segurança: primeira abertura, "Entendi" lembra, rodapé reabre', async ({ page }) => {
  await openApp(page, { safetyAck: false })
  const dialog = page.locator('dialog.safety')
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('Iate Clube Brasileiro (ICB)')
  await dialog.getByRole('button', { name: 'Entendi' }).click()
  await expect(dialog).toBeHidden()
  await page.reload()
  await expect(dialog).toBeHidden()
  await page.locator('#safety-open').click()
  await expect(dialog).toBeVisible()
})

test.describe('fuso do aparelho', () => {
  for (const [timezoneId, hour] of [
    ['America/Sao_Paulo', '21:00'],
    ['UTC', '00:00'],
  ] as const) {
    test.describe(timezoneId, () => {
      test.use({ timezoneId })
      test(`quadro de 00:00 UTC mostra ${hour}`, async ({ page }) => {
        await openApp(page)
        const frames = await (await page.request.get('/api/v1/frames?layer=wind')).json()
        const idx = (frames.times as string[]).findIndex((t, i) => i > 0 && t.endsWith('T00:00:00Z'))
        await page.locator('.tb-slider').fill(String(idx))
        await expect(page.locator('.tb-label')).toContainText(hour)
      })
    })
  }
})

test('AC-MVP-12: sem rede, abre o shell e mostra o último dado com a hora da rodada', async ({ page, context }) => {
  await openApp(page)
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  // Recarrega já controlado pelo Service Worker, para ele guardar /frames e /grid.
  const grid = page.waitForResponse((r) => r.url().includes('/api/v1/grid') && r.ok())
  await page.reload()
  await grid
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)
  await page.waitForTimeout(500)
  await context.setOffline(true)
  await page.reload()
  await expect(page.locator('#status-text')).toContainText('Sem conexão: mostrando a última previsão salva no aparelho')
  await expect(page.locator('#legend')).toBeVisible()
  await context.setOffline(false)
})

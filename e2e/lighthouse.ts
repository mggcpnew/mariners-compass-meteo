// AC-MVP-11: nota de acessibilidade do Lighthouse >= LIGHTHOUSE_A11Y_MIN
// (padrão 90 [PROPOSTA]). Usa o Chromium do Playwright com porta de depuração.
// Sem argumento, sobe o build de produção no `vite preview` com a API simulada
// (rode antes `npm run build`); com uma URL, audita essa URL (ex.: produção).
// Uso: node e2e/lighthouse.ts [url]
import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import lighthouse from 'lighthouse'

const PORT = 4174
const DEBUG_PORT = 9223
const MIN = Number(process.env.LIGHTHOUSE_A11Y_MIN ?? 90)

async function waitFor(url: string, child: ChildProcess, timeoutMs = 60_000): Promise<void> {
  const end = Date.now() + timeoutMs
  while (Date.now() < end) {
    if (child.exitCode !== null) throw new Error(`vite preview exited with code ${child.exitCode} (port ${PORT} in use?)`)
    try {
      if ((await fetch(url)).ok) return
    } catch {
      // ainda subindo
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`timeout waiting for ${url}`)
}

async function main(): Promise<void> {
  let server: ChildProcess | null = null
  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null
  let url = process.argv[2]
  try {
    if (!url) {
      if (!existsSync(fileURLToPath(new URL('../apps/web/dist/index.html', import.meta.url)))) {
        throw new Error('apps/web/dist not found: run "npm run build" first')
      }
      url = `http://localhost:${PORT}/`
      // Node direto no binário do Vite: sem shell, sem argumentos concatenados.
      const vite = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
      server = spawn(process.execPath, [vite, 'preview', '--port', String(PORT), '--strictPort'], {
        cwd: fileURLToPath(new URL('../apps/web/', import.meta.url)),
        env: { ...process.env, MC_E2E: '1' },
        stdio: 'inherit',
      })
      await waitFor(url, server)
    }
    browser = await chromium.launch({ args: [`--remote-debugging-port=${DEBUG_PORT}`] })
    const result = await lighthouse(url, { port: DEBUG_PORT, onlyCategories: ['accessibility'], output: 'html', logLevel: 'error' })
    const lhr = result?.lhr
    if (!lhr) throw new Error('lighthouse returned no result')
    const score = Math.round((lhr.categories.accessibility.score ?? 0) * 100)
    const failed = Object.values(lhr.audits).filter((a) => a.score === 0 && a.scoreDisplayMode === 'binary')
    for (const a of failed) console.log(`- ${a.id}: ${a.title}`)
    console.log(`Lighthouse accessibility: ${score} (mínimo ${MIN}) em ${url}`)
    // Relatório completo (inclui auditorias com peso parcial) para a CI guardar em falha.
    if (typeof result.report === 'string') writeFileSync(fileURLToPath(new URL('../lighthouse-report.html', import.meta.url)), result.report)
    if (score < MIN) process.exitCode = 1
  } finally {
    await browser?.close()
    server?.kill()
  }
}

await main()

// AC-MVP-09: nenhum dado de maré no repositório. Falha se `git ls-files` listar:
// (a) .pdf ou .csv; (b) caminho em tides/ ou data-private/; (c) .json, .sql ou
// seed (supabase/seed*, seed*) cujo caminho case com tide, mare ou tabua (sem
// distinguir maiúsculas e acentos), fora de supabase/migrations/; (d) migração
// ou seed com INSERT INTO tide_predictions.
// Exceção: scripts/ci/tide-allowlist.txt (uma entrada por linha, com comentário)
// libera fixtures sintéticas das regras (a) a (c).
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { isMain } from './is-main.ts'

export const ALLOWLIST_PATH = 'scripts/ci/tide-allowlist.txt'

export interface Violation {
  path: string
  rule: 'a' | 'b' | 'c' | 'd' | 'allowlist'
  detail: string
}

const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
const basename = (p: string) => p.slice(p.lastIndexOf('/') + 1)
const isSeed = (p: string) => /^seed/i.test(basename(p)) || /^supabase\/seed/i.test(p)
const isMigration = (p: string) => p.startsWith('supabase/migrations/')
const INSERT_TIDE = /insert\s+into\s+(?:"?public"?\s*\.\s*)?"?tide_predictions"?/i

/** Lê a allowlist: "caminho  # comentário". Linha sem comentário é erro. */
export function parseAllowlist(text: string): { paths: Set<string>; errors: Violation[] } {
  const paths = new Set<string>()
  const errors: Violation[] = []
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim()
    if (!line || line.startsWith('#')) return
    const hash = line.indexOf('#')
    const path = (hash >= 0 ? line.slice(0, hash) : line).trim()
    const comment = hash >= 0 ? line.slice(hash + 1).trim() : ''
    if (!comment) {
      errors.push({ path: ALLOWLIST_PATH, rule: 'allowlist', detail: `line ${i + 1}: entry "${path}" needs a comment` })
      return
    }
    paths.add(path)
  })
  return { paths, errors }
}

export function checkTideFiles(
  files: readonly string[],
  readFile: (path: string) => string,
  allowlistText: string,
): Violation[] {
  const { paths: allowed, errors } = parseAllowlist(allowlistText)
  const out: Violation[] = [...errors]
  for (const raw of files) {
    const path = raw.replaceAll('\\', '/')
    const lower = fold(path)
    if (!allowed.has(path)) {
      if (/\.(pdf|csv)$/.test(lower)) out.push({ path, rule: 'a', detail: 'PDF or CSV file' })
      if (/(^|\/)(tides|data-private)\//.test(lower)) out.push({ path, rule: 'b', detail: 'path under tides/ or data-private/' })
      if (
        (/\.(json|sql)$/.test(lower) || isSeed(path)) &&
        !isMigration(path) &&
        /tide|mare|tabua/.test(lower)
      ) {
        out.push({ path, rule: 'c', detail: 'tide-like name (tide, mare, tabua)' })
      }
    }
    if ((isMigration(path) || isSeed(path)) && INSERT_TIDE.test(readFile(path))) {
      out.push({ path, rule: 'd', detail: 'INSERT INTO tide_predictions' })
    }
  }
  return out
}

/** Roda a verificação num repositório git (padrão: diretório atual). */
export function runCheck(cwd: string = process.cwd()): Violation[] {
  const files = execFileSync('git', ['ls-files', '-z'], { cwd, encoding: 'utf8' }).split('\0').filter(Boolean)
  const allowPath = join(cwd, ALLOWLIST_PATH)
  const allowlist = existsSync(allowPath) ? readFileSync(allowPath, 'utf8') : ''
  return checkTideFiles(files, (p) => readFileSync(join(cwd, p), 'utf8'), allowlist)
}

if (isMain(import.meta.url)) {
  const violations = runCheck()
  if (violations.length) {
    for (const v of violations) console.error(`[${v.rule}] ${v.path}: ${v.detail}`)
    console.error(`check-tide-files: ${violations.length} violation(s). Dados de maré não entram no Git (AC-MVP-09).`)
    process.exit(1)
  }
  console.log('check-tide-files: ok')
}

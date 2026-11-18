// AC-MVP-13: nenhuma chave de serviço no repositório nem no front.
// Varre os arquivos versionados e o build do front (apps/web/dist).
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { isMain } from './is-main.ts'

export interface Finding {
  path: string
  line: number
  kind: string
}

const MAX_BYTES = 2 * 1024 * 1024
const JWT = /eyJ[A-Za-z0-9_-]{10,}\.([A-Za-z0-9_-]{10,})\.[A-Za-z0-9_-]{10,}/g
const SB_SECRET = /sb_secret_[A-Za-z0-9_-]{10,}/
const SERVICE_ENV = /SUPABASE_SERVICE_ROLE_KEY\s*[=:]\s*["']?[A-Za-z0-9._-]{20,}/

function jwtRole(payload: string): string | null {
  try {
    const json = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { role?: unknown }
    return typeof json.role === 'string' ? json.role : null
  } catch {
    return null
  }
}

export function scanText(path: string, text: string): Finding[] {
  const out: Finding[] = []
  text.split(/\r?\n/).forEach((line, i) => {
    for (const m of line.matchAll(JWT)) {
      const role = jwtRole(m[1])
      if (role === 'service_role' || role === 'supabase_admin') out.push({ path, line: i + 1, kind: `JWT role=${role}` })
    }
    if (SB_SECRET.test(line)) out.push({ path, line: i + 1, kind: 'sb_secret_ key' })
    if (SERVICE_ENV.test(line)) out.push({ path, line: i + 1, kind: 'SUPABASE_SERVICE_ROLE_KEY with value' })
  })
  return out
}

function readText(path: string): string | null {
  const st = statSync(path)
  if (!st.isFile() || st.size > MAX_BYTES) return null
  const buf = readFileSync(path)
  if (buf.includes(0)) return null // binário
  return buf.toString('utf8')
}

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  )
}

export function runScan(cwd: string = process.cwd()): Finding[] {
  const tracked = execFileSync('git', ['ls-files', '-z'], { cwd, encoding: 'utf8' }).split('\0').filter(Boolean)
  const dist = join(cwd, 'apps/web/dist')
  const built = existsSync(dist) ? walk(dist).map((p) => relative(cwd, p).replaceAll('\\', '/')) : []
  const findings: Finding[] = []
  for (const p of new Set([...tracked, ...built])) {
    const full = join(cwd, p)
    if (!existsSync(full)) continue
    const text = readText(full)
    if (text !== null) findings.push(...scanText(p, text))
  }
  return findings
}

if (isMain(import.meta.url)) {
  const findings = runScan()
  if (findings.length) {
    for (const f of findings) console.error(`${f.path}:${f.line}: ${f.kind}`)
    console.error(`check-secrets: ${findings.length} finding(s). Chave de serviço não pode estar no repositório nem no front (AC-MVP-13).`)
    process.exit(1)
  }
  console.log('check-secrets: ok')
}

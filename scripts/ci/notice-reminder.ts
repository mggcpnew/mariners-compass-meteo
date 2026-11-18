// Lembrete diário de conferência dos avisos da Marinha (B3.3; parte do AC-MVP-17).
// Se a última conferência (notice_checks) tiver mais de NOTICE_CHECK_MAX_AGE_H
// horas, ou não existir, abre ou atualiza a issue "Conferir avisos da Marinha".
// Supabase ilegível também abre a issue (na dúvida, lembra).
import { execFileSync } from 'node:child_process'
import { isMain } from './is-main.ts'
import { createClient } from '@supabase/supabase-js'

export const ISSUE_TITLE = 'Conferir avisos da Marinha'
export const BULLETIN_URL = 'https://www.marinha.mil.br/chm'

export interface ReminderDecision {
  needed: boolean
  reason: 'never_checked' | 'too_old' | 'unreadable' | 'recent'
  ageHours: number | null
}

export function decideReminder(lastCheckedAt: string | null | undefined, nowMs: number, maxAgeHours: number): ReminderDecision {
  if (lastCheckedAt === undefined) return { needed: true, reason: 'unreadable', ageHours: null }
  if (lastCheckedAt === null) return { needed: true, reason: 'never_checked', ageHours: null }
  const t = Date.parse(lastCheckedAt)
  if (!Number.isFinite(t)) return { needed: true, reason: 'unreadable', ageHours: null }
  const ageHours = (nowMs - t) / 3_600_000
  return ageHours > maxAgeHours
    ? { needed: true, reason: 'too_old', ageHours }
    : { needed: false, reason: 'recent', ageHours }
}

export function issueBody(d: ReminderDecision, lastCheckedAt: string | null | undefined, nowIso: string): string {
  const status =
    d.reason === 'never_checked'
      ? 'Nenhuma conferência registrada.'
      : d.reason === 'unreadable'
        ? 'Não foi possível ler a última conferência no banco.'
        : `Última conferência: ${lastCheckedAt} (há ${Math.floor(d.ageHours ?? 0)} h).`
  return [
    `${status}`,
    '',
    `1. Leia o boletim oficial: ${BULLETIN_URL}`,
    '2. Se houver aviso: `npm run notice:add -- --title "..." --body "..." --url "..." --valid-until "AAAA-MM-DDThh:mmZ"`',
    '3. Em qualquer caso: `npm run notice:checked`',
    '',
    `Verificado em ${nowIso} pelo workflow notice-reminder.`,
  ].join('\n')
}

async function lastCheck(): Promise<string | null | undefined> {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return undefined
  try {
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    const res = await db.from('notice_checks').select('checked_at').order('checked_at', { ascending: false }).limit(1)
    if (res.error) return undefined
    return (res.data?.[0]?.checked_at as string | undefined) ?? null
  } catch {
    return undefined
  }
}

function gh(args: string[]): string {
  return execFileSync('gh', args, { encoding: 'utf8' })
}

async function main(): Promise<void> {
  const maxAge = Number(process.env.NOTICE_CHECK_MAX_AGE_H ?? '24')
  if (!Number.isFinite(maxAge) || maxAge <= 0) throw new Error('NOTICE_CHECK_MAX_AGE_H invalid')
  const now = Date.now()
  const last = await lastCheck()
  const d = decideReminder(last, now, maxAge)
  console.log(`notice-reminder: ${d.reason}`)
  if (!d.needed) return
  const body = issueBody(d, last, new Date(now).toISOString())
  const open = JSON.parse(gh(['issue', 'list', '--state', 'open', '--search', `"${ISSUE_TITLE}" in:title`, '--json', 'number,title'])) as {
    number: number
    title: string
  }[]
  const existing = open.find((i) => i.title === ISSUE_TITLE)
  if (existing) gh(['issue', 'comment', String(existing.number), '--body', body])
  else gh(['issue', 'create', '--title', ISSUE_TITLE, '--body', body])
  if (d.reason === 'unreadable') process.exitCode = 1
}

if (isMain(import.meta.url)) {
  main().catch((err: unknown) => {
    console.error(`notice-reminder falhou: ${(err as Error).message}`)
    process.exit(1)
  })
}

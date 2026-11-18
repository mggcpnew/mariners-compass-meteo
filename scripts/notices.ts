// Registro manual dos avisos da Marinha (B3.3). Sem scraping: o dono lê o
// boletim oficial e registra aqui. Usa a chave de serviço do .env.local.
//   npm run notice:add -- --title "..." --body "..." --url "https://..." --valid-until "AAAA-MM-DDThh:mmZ" [--issued-at "..."]
//   npm run notice:checked
import { parseArgs } from 'node:util'
import { createClient } from '@supabase/supabase-js'
import { isMain } from './ci/is-main.ts'

export interface NoticeInput {
  title: string
  body: string
  source_url: string
  valid_until: string
  issued_at: string | null
}

const ISO_Z = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?Z$/

function isoZ(name: string, value: string | undefined, required: boolean): string | null {
  if (value === undefined || value.trim() === '') {
    if (required) throw new Error(`--${name} is required (AAAA-MM-DDThh:mmZ, UTC)`)
    return null
  }
  if (!ISO_Z.test(value) || !Number.isFinite(Date.parse(value))) {
    throw new Error(`--${name} must be ISO 8601 UTC ending in Z (got "${value}")`)
  }
  return new Date(Date.parse(value)).toISOString().replace(/\.\d{3}Z$/, 'Z')
}

/** Valida os argumentos do notice:add. Lança Error com mensagem clara. */
export function parseNoticeArgs(argv: string[], nowMs: number): NoticeInput {
  const { values } = parseArgs({
    args: argv,
    options: {
      title: { type: 'string' },
      body: { type: 'string' },
      url: { type: 'string' },
      'valid-until': { type: 'string' },
      'issued-at': { type: 'string' },
    },
    strict: true,
    allowPositionals: false,
  })
  const title = values.title?.trim()
  const body = values.body?.trim()
  if (!title) throw new Error('--title is required')
  if (!body) throw new Error('--body is required')
  let url: URL
  try {
    url = new URL(values.url ?? '')
  } catch {
    throw new Error('--url is required and must be a valid URL')
  }
  if (url.protocol !== 'https:') throw new Error('--url must use https')
  const validUntil = isoZ('valid-until', values['valid-until'], true)!
  if (Date.parse(validUntil) <= nowMs) throw new Error('--valid-until must be in the future')
  const issuedAt = isoZ('issued-at', values['issued-at'], false)
  return { title, body, source_url: url.toString(), valid_until: validUntil, issued_at: issuedAt }
}

function client() {
  const url = process.env.SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required (.env.local)')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function main(argv: string[]): Promise<void> {
  const [command, ...rest] = argv
  if (command === 'add') {
    const notice = parseNoticeArgs(rest, Date.now())
    const res = await client().from('official_notices').insert(notice).select('id, registered_at').single()
    if (res.error) throw new Error(res.error.message)
    console.log(`aviso registrado: ${res.data.id} (${res.data.registered_at}). Rode também: npm run notice:checked`)
    return
  }
  if (command === 'checked') {
    const res = await client().from('notice_checks').insert({}).select('checked_at').single()
    if (res.error) throw new Error(res.error.message)
    console.log(`conferência registrada: ${res.data.checked_at}`)
    return
  }
  throw new Error('usage: notices.ts add --title ... --body ... --url ... --valid-until ... | notices.ts checked')
}

if (isMain(import.meta.url)) {
  main(process.argv.slice(2)).catch((err: unknown) => {
    console.error(`erro: ${(err as Error).message}`)
    process.exit(1)
  })
}

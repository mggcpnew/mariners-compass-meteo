// AC-MVP-09 (repositório temporário), AC-MVP-13 e lembrete de avisos (AC-MVP-17).
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { ALLOWLIST_PATH, checkTideFiles, runCheck } from './check-tide-files.ts'
import { scanText } from './check-secrets.ts'
import { decideReminder, issueBody } from './notice-reminder.ts'

describe('check-tide-files (regras)', () => {
  const none = () => ''
  const rules = (files: string[], read = none, allow = '') => checkTideFiles(files, read, allow).map((v) => v.rule)

  it('(a) PDF e CSV falham', () => {
    expect(rules(['docs/tabela.PDF', 'x/data.csv'])).toEqual(['a', 'a'])
  })
  it('(b) tides/ e data-private/ falham', () => {
    expect(rules(['tides/readme.md', 'a/data-private/x.txt'])).toEqual(['b', 'b'])
  })
  it('(c) nome com tide/maré/tábua em .json, .sql ou seed falha, sem caixa e acento', () => {
    expect(rules(['fixtures/Tide-2026.json', 'db/Maré.sql', 'supabase/seed_tabua.txt', 'src/tabua.ts'])).toEqual([
      'c',
      'c',
      'c',
    ])
  })
  it('(c) não vale dentro de supabase/migrations/', () => {
    expect(rules(['supabase/migrations/20260101_tide_tables.sql'])).toEqual([])
  })
  it('(d) migração ou seed com INSERT INTO tide_predictions falha', () => {
    const read = () => 'insert into public.tide_predictions (station_id) values (1);'
    expect(rules(['supabase/migrations/20260101_x.sql', 'supabase/seed.sql'], read)).toEqual(['d', 'd'])
  })
  it('allowlist libera (a)-(c) e exige comentário', () => {
    expect(rules(['fixtures/tide-sample.json'], none, 'fixtures/tide-sample.json  # sintético')).toEqual([])
    expect(rules(['fixtures/tide-sample.json'], none, 'fixtures/tide-sample.json')).toEqual(['allowlist', 'c'])
  })
  it('arquivos comuns passam', () => {
    expect(rules(['packages/core/src/frames.ts', 'README.md', 'apps/web/src/i18n/pt-BR.json'])).toEqual([])
  })
})

describe('check-tide-files (repositório temporário)', () => {
  let dir = ''
  afterEach(() => dir && rmSync(dir, { recursive: true, force: true }))

  function repo(files: Record<string, string>): string {
    dir = mkdtempSync(join(tmpdir(), 'tide-check-'))
    const git = (...args: string[]) => execFileSync('git', args, { cwd: dir, stdio: 'ignore' })
    git('init', '-q')
    for (const [p, body] of Object.entries(files)) {
      mkdirSync(dirname(join(dir, p)), { recursive: true })
      writeFileSync(join(dir, p), body)
    }
    git('add', '-A')
    return dir
  }

  it('tides/x.csv falha', () => {
    expect(runCheck(repo({ 'tides/x.csv': 'a,b' })).map((v) => v.rule)).toEqual(['a', 'b'])
  })
  it('tide-x.json fora da lista falha', () => {
    expect(runCheck(repo({ 'fixtures/tide-x.json': '{}' })).map((v) => v.rule)).toEqual(['c'])
  })
  it('o mesmo arquivo na lista passa', () => {
    const cwd = repo({ 'fixtures/tide-x.json': '{}', [ALLOWLIST_PATH]: 'fixtures/tide-x.json # sintético\n' })
    expect(runCheck(cwd)).toEqual([])
  })
})

describe('check-secrets', () => {
  // Tokens montados em tempo de execução para o próprio teste não disparar a varredura.
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const jwt = (role: string) => ['eyJhbGciOiJIUzI1NiJ9', b64({ iss: 'supabase-demo', role }), 'c2lnbmF0dXJlLXNpZ25hdHVyZQ'].join('.')

  it('acha JWT com role service_role, mas não com anon', () => {
    expect(scanText('a.ts', `const k = "${jwt('service_role')}"`).map((f) => f.kind)).toEqual(['JWT role=service_role'])
    expect(scanText('a.ts', `const k = "${jwt('anon')}"`)).toEqual([])
  })
  it('acha sb_secret_ e SUPABASE_SERVICE_ROLE_KEY com valor', () => {
    expect(scanText('a', ['sb', 'secret', 'N7UND0UgjKTVKUodkm0Hg'].join('_'))).toHaveLength(1)
    expect(scanText('.env', `SUPABASE_SERVICE_ROLE_KEY=${'x'.repeat(30)}`)).toHaveLength(1)
  })
  it('variável vazia ou citada em texto não é achado', () => {
    expect(scanText('.env.example', 'SUPABASE_SERVICE_ROLE_KEY=')).toEqual([])
    expect(scanText('README.md', 'Segredos (`SUPABASE_SERVICE_ROLE_KEY`) ficam só em secrets')).toEqual([])
  })
})

describe('notice-reminder', () => {
  const now = Date.UTC(2026, 10, 18, 11)
  it('sem conferência: abre', () => expect(decideReminder(null, now, 24)).toMatchObject({ needed: true, reason: 'never_checked' }))
  it('conferência com 23 h: não abre', () =>
    expect(decideReminder('2026-11-17T12:00:00Z', now, 24)).toMatchObject({ needed: false, reason: 'recent' }))
  it('conferência com mais de 24 h: abre', () =>
    expect(decideReminder('2026-11-17T10:59:00Z', now, 24)).toMatchObject({ needed: true, reason: 'too_old' }))
  it('banco ilegível: abre', () => expect(decideReminder(undefined, now, 24)).toMatchObject({ needed: true, reason: 'unreadable' }))
  it('corpo da issue cita o boletim e os comandos', () => {
    const body = issueBody(decideReminder(null, now, 24), null, '2026-11-18T11:00:00Z')
    expect(body).toContain('https://www.marinha.mil.br/chm')
    expect(body).toContain('npm run notice:checked')
  })
})

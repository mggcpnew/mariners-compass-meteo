// Validação dos argumentos do notice:add.
import { describe, expect, it } from 'vitest'
import { parseNoticeArgs } from './notices.ts'

const now = Date.UTC(2026, 10, 18, 12)
const ok = ['--title', 'Mar grosso', '--body', 'Ondas de 3 m', '--url', 'https://www.marinha.mil.br/chm', '--valid-until', '2026-11-20T00:00Z']

describe('parseNoticeArgs', () => {
  it('aceita argumentos válidos e normaliza a data', () => {
    expect(parseNoticeArgs(ok, now)).toEqual({
      title: 'Mar grosso',
      body: 'Ondas de 3 m',
      source_url: 'https://www.marinha.mil.br/chm',
      valid_until: '2026-11-20T00:00:00Z',
      issued_at: null,
    })
  })
  it('exige título, corpo, URL https e validade futura em UTC com Z', () => {
    const without = (flag: string) => ok.filter((_, i) => ok[i] !== flag && ok[i - 1] !== flag)
    expect(() => parseNoticeArgs(without('--title'), now)).toThrow(/--title/)
    expect(() => parseNoticeArgs(without('--body'), now)).toThrow(/--body/)
    expect(() => parseNoticeArgs(without('--url'), now)).toThrow(/--url/)
    expect(() => parseNoticeArgs(ok.map((a) => (a.startsWith('https') ? 'http://x.test' : a)), now)).toThrow(/https/)
    expect(() => parseNoticeArgs(ok.map((a) => (a.endsWith('Z') ? '2026-11-20T00:00-03:00' : a)), now)).toThrow(/Z/)
    expect(() => parseNoticeArgs(ok.map((a) => (a.endsWith('Z') ? '2026-11-17T00:00Z' : a)), now)).toThrow(/future/)
  })
  it('recusa opção desconhecida', () => {
    expect(() => parseNoticeArgs([...ok, '--foo', 'x'], now)).toThrow()
  })
})

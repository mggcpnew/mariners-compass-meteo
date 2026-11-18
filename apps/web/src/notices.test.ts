// Avisos, modal de segurança e textos fixos (6c).
import { describe, expect, it } from 'vitest'
import { MESSAGES, setLocale } from './i18n.ts'
import { formatWhen, safeHttpsUrl } from './notices.ts'
import { needsSafetyNotice, SAFETY_VERSION } from './safety.ts'

describe('avisos oficiais', () => {
  it('só aceita link https; o resto cai no boletim oficial', () => {
    expect(safeHttpsUrl('https://www.marinha.mil.br/chm/x')).toBe('https://www.marinha.mil.br/chm/x')
    expect(safeHttpsUrl('http://www.marinha.mil.br/chm')).toBe('https://www.marinha.mil.br/chm')
    expect(safeHttpsUrl('javascript:alert(1)')).toBe('https://www.marinha.mil.br/chm')
    expect(safeHttpsUrl(null)).toBe('https://www.marinha.mil.br/chm')
  })
  it('datas no fuso do aparelho; sem data = "nenhum"', () => {
    setLocale('pt-BR')
    expect(formatWhen(null, 'pt-BR')).toBe('nenhum')
    expect(formatWhen('nao-e-data', 'pt-BR')).toBe('nenhum')
    expect(formatWhen('2026-11-18T12:00:00Z', 'pt-BR')).toMatch(/18\/11\/2026/)
  })
  it('aviso fixo do B10 exato em pt-BR', () => {
    expect(MESSAGES['pt-BR']['notices.fixed']).toBe(
      'Os avisos oficiais entram no app por registro manual e podem atrasar ou faltar. Consulte sempre o boletim oficial da Marinha.',
    )
  })
})

describe('modal de segurança', () => {
  it('aparece na primeira abertura e quando a versão do texto muda', () => {
    expect(needsSafetyNotice(null)).toBe(true)
    expect(needsSafetyNotice('0')).toBe(true)
    expect(needsSafetyNotice(SAFETY_VERSION)).toBe(false)
  })
  it('traz o aviso de ausência de vínculo com o ICB nos dois idiomas', () => {
    expect(MESSAGES['pt-BR']['safety.icb']).toContain('Iate Clube Brasileiro')
    expect(MESSAGES.en['safety.icb']).toContain('Iate Clube Brasileiro')
  })
})

// Textos da interface. Todo texto visível vem daqui (pt-BR e en, AC-MVP-15).
// O tipo obriga o en.json a ter as mesmas chaves do pt-BR.json; o teste confere o inverso.
import ptBR from './i18n/pt-BR.json'
import en from './i18n/en.json'

export type Locale = 'pt-BR' | 'en'
export type MessageKey = keyof typeof ptBR

export const MESSAGES: Record<Locale, Record<MessageKey, string>> = { 'pt-BR': ptBR, en }
export const LOCALES: readonly Locale[] = ['pt-BR', 'en']

/** pt-* vira pt-BR; o resto, en. */
export function detectLocale(languages: readonly string[]): Locale {
  return languages.some((l) => l.toLowerCase().startsWith('pt')) ? 'pt-BR' : 'en'
}

let current: Locale = 'pt-BR'

export function setLocale(locale: Locale): void {
  current = locale
}

export function getLocale(): Locale {
  return current
}

/** Texto da chave no idioma atual, com {nome} trocado pelos parâmetros. */
export function t(key: MessageKey, params: Record<string, string | number> = {}): string {
  return MESSAGES[current][key].replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m))
}

/** Preenche os elementos marcados com data-i18n, data-i18n-aria-label e data-i18n-title. */
export function applyI18n(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n as MessageKey)
  })
  root.querySelectorAll<HTMLElement>('[data-i18n-aria-label]').forEach((el) => {
    el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel as MessageKey))
  })
  root.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((el) => {
    el.title = t(el.dataset.i18nTitle as MessageKey)
  })
}

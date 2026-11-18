// Modo de cor: claro e escuro seguem o sistema; noturno é escolha manual
// (data-mode="night" no <html>, ligado na entrega 6c).

export type Mode = 'light' | 'dark' | 'night'

const darkQuery = (): MediaQueryList | null =>
  typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null

export function currentMode(): Mode {
  if (document.documentElement.dataset.mode === 'night') return 'night'
  return darkQuery()?.matches ? 'dark' : 'light'
}

export const MODE_CHANGE_EVENT = 'mc:modechange'

/** Chama cb quando o sistema troca claro/escuro ou o app troca de modo. */
export function onModeChange(cb: (mode: Mode) => void): void {
  darkQuery()?.addEventListener('change', () => cb(currentMode()))
  document.addEventListener(MODE_CHANGE_EVENT, () => cb(currentMode()))
}

/** Valor de um token de cor (variável CSS) no modo atual. */
export function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

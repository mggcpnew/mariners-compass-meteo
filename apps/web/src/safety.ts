// Modal de segurança na primeira abertura (B10). A confirmação fica guardada no
// aparelho com a versão do texto: se o texto mudar, o modal volta a aparecer.
import { t } from './i18n.ts'
import { readPref, writePref } from './prefs.ts'

/** Suba quando o texto do modal mudar de sentido. */
export const SAFETY_VERSION = '1'

export function needsSafetyNotice(stored: string | null): boolean {
  return stored !== SAFETY_VERSION
}

export function createSafetyDialog(): { open(): void; refreshText(): void } {
  const dialog = document.createElement('dialog')
  dialog.className = 'safety'
  dialog.setAttribute('aria-labelledby', 'safety-title')
  dialog.innerHTML =
    `<h2 id="safety-title" data-i18n="safety.title"></h2>` +
    `<p data-i18n="safety.model"></p>` +
    `<p data-i18n="safety.official"></p>` +
    `<p data-i18n="safety.manual"></p>` +
    `<p data-i18n="safety.icb"></p>` +
    `<form method="dialog"><button type="submit" value="ok" class="primary-btn" data-i18n="safety.ok"></button></form>`
  document.body.append(dialog)
  const fill = () => {
    dialog.querySelectorAll<HTMLElement>('[data-i18n]').forEach((e) => {
      e.textContent = t(e.dataset.i18n as Parameters<typeof t>[0])
    })
  }
  fill()
  // Só o botão "Entendi" (returnValue "ok") confirma a leitura; Esc fecha sem gravar.
  dialog.addEventListener('close', () => {
    if (dialog.returnValue === 'ok') writePref('safety', SAFETY_VERSION)
    dialog.returnValue = ''
  })
  return {
    open() {
      fill()
      if (!dialog.open) dialog.showModal()
    },
    refreshText: fill,
  }
}

export function safetyAcknowledged(): boolean {
  return !needsSafetyNotice(readPref('safety'))
}

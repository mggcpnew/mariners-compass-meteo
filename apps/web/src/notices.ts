// Faixa de avisos oficiais (B3.3, AC-MVP-17). Os avisos entram por registro
// manual (npm run notice:add); a faixa mostra o crédito, o link oficial, a data
// do último registro e a da última conferência, e sempre o aviso fixo do B10.
// Texto vindo do banco entra só por textContent (nunca como HTML).
import { formatLocal, NAVY_BULLETIN_URL } from '@mariners-compass/core'
import { getLocale, t } from './i18n.ts'

export interface Notice {
  id: string
  title: string
  body: string
  issued_at: string | null
  valid_until: string | null
  source_url: string
  registered_at: string
}

export interface NoticesResponse {
  meta: {
    source: string
    attribution: string[]
    bulletin_url: string
    last_registered_at: string | null
    last_checked_at: string | null
    updated_at: string
  }
  notices: Notice[]
}


/** Só links https viram âncora; qualquer outra coisa cai no boletim oficial. */
export function safeHttpsUrl(value: string | null | undefined, fallback = NAVY_BULLETIN_URL): string {
  try {
    const u = new URL(value ?? '')
    return u.protocol === 'https:' ? u.href : fallback
  } catch {
    return fallback
  }
}

export function formatWhen(iso: string | null, locale: string): string {
  if (!iso) return t('notices.never')
  try {
    return formatLocal(iso, locale, undefined, { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return t('notices.never')
  }
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag)
  e.className = cls
  if (text !== undefined) e.textContent = text
  return e
}

function externalLink(href: string, text: string): HTMLAnchorElement {
  const a = el('a', 'nt-link', text)
  a.href = href
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  return a
}

export function renderNotices(root: HTMLElement, data: NoticesResponse | null, failed: boolean): void {
  const locale = getLocale()
  root.replaceChildren()
  root.dataset.state = data?.notices.length ? 'notice' : 'empty'
  const bulletin = safeHttpsUrl(data?.meta.bulletin_url)

  if (data && data.notices.length) {
    for (const n of data.notices) {
      const item = el('article', 'nt-item')
      const head = el('p', 'nt-head')
      head.append(el('span', 'nt-badge', t('notices.badge')), el('strong', 'nt-title', n.title))
      item.append(head, el('p', 'nt-body', n.body))
      const meta = el('p', 'nt-meta')
      meta.append(
        `${data.meta.attribution.join(' ')} · `,
        n.valid_until ? `${t('notices.validUntil', { time: formatWhen(n.valid_until, locale) })} · ` : '',
        externalLink(safeHttpsUrl(n.source_url), t('notices.openOfficial')),
      )
      item.append(meta)
      root.append(item)
    }
  } else {
    const empty = el('p', 'nt-empty')
    empty.append(`${t(failed ? 'notices.failed' : 'notices.none')} `, externalLink(bulletin, t('notices.bulletin')))
    root.append(empty)
  }

  const foot = el('p', 'nt-foot')
  foot.append(t('notices.fixed'))
  if (data) {
    foot.append(
      ` ${t('notices.dates', {
        registered: formatWhen(data.meta.last_registered_at, locale),
        checked: formatWhen(data.meta.last_checked_at, locale),
      })}`,
    )
  }
  root.append(foot)
}

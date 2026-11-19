// Painel do ponto: folha inferior no celular, painel lateral em tela larga.
// Mostra o resumo da hora atual, o meteograma e os estados da API
// (partial, stale, 429, 503, ondas nulas em terra).
import { formatLocal } from '@mariners-compass/core'
import { ApiError, getPoint, type PointResponse } from './api.ts'
import { getLocale, t, type MessageKey } from './i18n.ts'
import { compassRoseSvg } from './icons.ts'
import { directionLabel, Meteogram, type MeteogramData } from './meteogram.ts'
import { allNull, convertKnots, currentIndex, waitParts } from './point-format.ts'
import { formatNumber, type SpeedUnit } from './scales.ts'

export function pointErrorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return t('error.generic')
  if (err.status === 0) return t('error.network')
  if (err.code === 'invalid_coordinates') return t('point.outside')
  if (err.code === 'rate_limited' || err.code === 'quota_exhausted') {
    const key: MessageKey = err.code === 'rate_limited' ? 'point.rateLimited' : 'point.quota'
    const w = waitParts(err.retryAfterS ?? 60)
    return t(key, { wait: t(w.unit === 'minutes' ? 'wait.minutes' : 'wait.hours', { n: w.value }) })
  }
  if (err.status === 503) return t('error.unavailable')
  return t('error.generic')
}

function toData(res: PointResponse): MeteogramData {
  const h = res.hourly
  const n = h.time.length
  const series = (v: (number | null)[] | undefined) => v ?? Array<number | null>(n).fill(null)
  return {
    times: h.time,
    wind: series(h.wind_speed_10m),
    gust: series(h.wind_gusts_10m),
    windDir: series(h.wind_direction_10m),
    waveHeight: series(h.wave_height),
    wavePeriod: series(h.wave_period),
    waveDir: series(h.wave_direction),
  }
}

export class PointPanel {
  private readonly root: HTMLElement
  private readonly title: HTMLElement
  private readonly closeBtn: HTMLButtonElement
  private readonly coord: HTMLElement
  private readonly resolution: HTMLElement
  private readonly status: HTMLElement
  private readonly now: HTMLElement
  private readonly source: HTMLElement
  private readonly meteogram: Meteogram
  private res: PointResponse | null = null
  private unit: SpeedUnit = 'kn'
  private seq = 0

  constructor(root: HTMLElement, onClose: () => void) {
    this.root = root
    root.innerHTML =
      `<header class="pp-head"><h2 class="pp-title" id="pp-title" tabindex="-1"></h2>` +
      `<button type="button" class="icon-btn pp-close"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg></button></header>` +
      `<p class="pp-coord"></p>` +
      `<p class="pp-resolution"></p>` +
      `<div class="pp-status" role="status" aria-live="polite"></div>` +
      `<div class="pp-now"></div>` +
      `<div class="pp-meteogram"></div>` +
      `<p class="pp-source"></p>`
    root.setAttribute('aria-labelledby', 'pp-title')
    this.title = root.querySelector('.pp-title')!
    this.closeBtn = root.querySelector('.pp-close')!
    this.coord = root.querySelector('.pp-coord')!
    this.resolution = root.querySelector('.pp-resolution')!
    this.status = root.querySelector('.pp-status')!
    this.now = root.querySelector('.pp-now')!
    this.source = root.querySelector('.pp-source')!
    this.meteogram = new Meteogram(root.querySelector('.pp-meteogram')!)
    this.closeBtn.addEventListener('click', () => onClose())
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') onClose()
    })
  }

  get isOpen(): boolean {
    return !this.root.hidden
  }

  /** Abre o painel e pede o /point; devolve a coordenada arredondada usada pela previsão. */
  async open(lat: number, lon: number, unit: SpeedUnit): Promise<{ lat: number; lon: number } | null> {
    const seq = ++this.seq
    this.unit = unit
    this.res = null
    this.root.hidden = false
    this.root.classList.add('is-loading')
    this.title.textContent = t('point.title')
    this.closeBtn.setAttribute('aria-label', t('point.close'))
    this.resolution.textContent = t('resolution.point')
    this.coord.textContent = ''
    this.now.replaceChildren()
    this.source.textContent = ''
    this.setStatus(t('point.loading'), 'info')
    this.title.focus({ preventScroll: true })
    try {
      const res = await getPoint(lat, lon)
      if (seq !== this.seq) return null
      this.res = res
      this.render()
      return res.meta.point
    } catch (err) {
      if (seq !== this.seq) return null
      this.root.classList.remove('is-loading')
      this.setStatus(pointErrorMessage(err), 'warn')
      return null
    }
  }

  close(): void {
    this.seq++
    this.root.hidden = true
  }

  /** Reaplica os textos depois da troca de idioma. */
  refreshText(): void {
    if (this.root.hidden) return
    this.title.textContent = t('point.title')
    this.closeBtn.setAttribute('aria-label', t('point.close'))
    this.resolution.textContent = t('resolution.point')
    if (this.res) this.render()
  }

  setUnit(unit: SpeedUnit): void {
    this.unit = unit
    if (this.res) this.render()
  }

  private setStatus(text: string, kind: 'info' | 'warn' | 'none'): void {
    this.status.textContent = text
    this.status.dataset.kind = kind
    this.status.hidden = kind === 'none'
  }

  private render(): void {
    const res = this.res!
    const locale = getLocale()
    this.root.classList.remove('is-loading')
    const { lat, lon } = res.meta.point
    const fixed = (v: number) => new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)
    this.coord.textContent = t('point.coord', { lat: fixed(lat), lon: fixed(lon) })
    const when = formatLocal(res.meta.updated_at, locale, undefined, { dateStyle: 'short', timeStyle: 'short' })
    if (!navigator.onLine) this.setStatus(t('point.offline', { time: when }), 'warn')
    else if (res.meta.status === 'stale') this.setStatus(t('point.stale', { time: when }), 'warn')
    else if (res.meta.status === 'partial') this.setStatus(t('point.partial'), 'warn')
    else this.setStatus('', 'none')
    const model = res.meta.model === 'auto' ? t('source.modelAuto') : res.meta.model
    this.source.textContent = `${t('point.source', { model, time: when })} ${res.meta.attribution.join(' ')}`

    const data = toData(res)
    const i = currentIndex(data.times, Date.now())
    this.renderNow(data, i, locale)
    this.meteogram.set(data, this.unit, i)
  }

  private renderNow(d: MeteogramData, i: number, locale: string): void {
    const unit = t(`unit.${this.unit}`)
    const num = (v: number | null, digits: number) => (v === null ? t('point.noValue') : formatNumber(v, locale, digits))
    const dir = d.windDir[i]
    const arrow =
      dir === null
        ? ''
        : `<svg class="pp-arrow" viewBox="-50 -50 100 100" aria-hidden="true" focusable="false"><path d="M0,-30L9,8L0,2L-9,8Z" transform="rotate(${Math.round((dir + 180) % 360)})"/></svg>`
    const waves = allNull(d.waveHeight)
      ? `<p class="pp-waves">${t('point.noWaves')}</p>`
      : `<p class="pp-waves">${t('point.nowWaves', { value: num(d.waveHeight[i], 1), period: num(d.wavePeriod[i], 0), dir: directionLabel(d.waveDir[i]) })}</p>`
    this.now.innerHTML =
      `<div class="pp-rose" aria-hidden="true">${compassRoseSvg()}${arrow}</div>` +
      `<div class="pp-values">` +
      `<p class="pp-label">${t('point.nowWind')}</p>` +
      `<p class="pp-big"><span class="pp-big-value">${num(convertKnots(d.wind[i], this.unit), 0)}</span> <span class="pp-big-unit">${unit}</span></p>` +
      `<p class="pp-detail">${t('point.nowGust', { value: num(convertKnots(d.gust[i], this.unit), 0), unit })} · ${directionLabel(dir)}</p>` +
      waves +
      `</div>`
  }
}

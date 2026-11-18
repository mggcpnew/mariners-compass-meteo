// Barra de tempo: quadros de 3 h, play, anterior/próximo e controle deslizante.
// O horário aparece no fuso do aparelho (formatLocal); tudo o mais é UTC.
import { formatLocal, parseUtc } from '@mariners-compass/core'
import { ICONS } from './icons.ts'
import { getLocale, t } from './i18n.ts'

const LABEL_FORMAT: Intl.DateTimeFormatOptions = { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }

/** Índice do quadro mais próximo de agora (ou o primeiro, se a rodada for futura). */
export function nearestFrame(times: readonly string[], nowMs: number): number {
  let best = 0
  let bestDiff = Infinity
  times.forEach((time, i) => {
    const diff = Math.abs(parseUtc(time) - nowMs)
    if (diff < bestDiff) {
      best = i
      bestDiff = diff
    }
  })
  return best
}

export function frameLabel(time: string, locale: string, timeZone?: string): string {
  return formatLocal(time, locale, timeZone, LABEL_FORMAT)
}

export interface TimeBarHandlers {
  onSelect(index: number): void
  onTogglePlay(): void
}

export class TimeBar {
  private times: string[] = []
  private index = 0
  private readonly play: HTMLButtonElement
  private readonly prev: HTMLButtonElement
  private readonly next: HTMLButtonElement
  private readonly slider: HTMLInputElement
  private readonly label: HTMLOutputElement

  constructor(root: HTMLElement, handlers: TimeBarHandlers) {
    root.innerHTML =
      `<button type="button" class="icon-btn tb-play"></button>` +
      `<button type="button" class="icon-btn tb-prev">${ICONS.prev}</button>` +
      `<input type="range" class="tb-slider" min="0" max="0" step="1" value="0">` +
      `<button type="button" class="icon-btn tb-next">${ICONS.next}</button>` +
      `<output class="tb-label" aria-live="off"></output>`
    this.play = root.querySelector('.tb-play')!
    this.prev = root.querySelector('.tb-prev')!
    this.next = root.querySelector('.tb-next')!
    this.slider = root.querySelector('.tb-slider')!
    this.label = root.querySelector('.tb-label')!
    this.play.addEventListener('click', () => handlers.onTogglePlay())
    this.prev.addEventListener('click', () => this.index > 0 && handlers.onSelect(this.index - 1))
    this.next.addEventListener('click', () => this.index < this.times.length - 1 && handlers.onSelect(this.index + 1))
    this.slider.addEventListener('input', () => handlers.onSelect(Number(this.slider.value)))
    this.setPlaying(false)
    this.refreshText()
  }

  setTimes(times: string[], index: number): void {
    this.times = times
    this.slider.max = String(Math.max(0, times.length - 1))
    this.setIndex(index)
  }

  setIndex(index: number): void {
    this.index = index
    this.slider.value = String(index)
    const label = this.times[index] ? frameLabel(this.times[index], getLocale()) : ''
    this.label.value = label
    this.slider.setAttribute('aria-valuetext', label)
    this.prev.disabled = index <= 0
    this.next.disabled = index >= this.times.length - 1
  }

  setPlaying(playing: boolean): void {
    this.play.innerHTML = playing ? ICONS.pause : ICONS.play
    this.play.setAttribute('aria-label', t(playing ? 'time.pause' : 'time.play'))
    this.play.setAttribute('aria-pressed', String(playing))
  }

  /** Reaplica os textos (troca de idioma). */
  refreshText(): void {
    this.prev.setAttribute('aria-label', t('time.prev'))
    this.next.setAttribute('aria-label', t('time.next'))
    this.slider.setAttribute('aria-label', t('time.slider'))
    this.setPlaying(this.play.getAttribute('aria-pressed') === 'true')
    if (this.times.length) this.setIndex(this.index)
  }
}

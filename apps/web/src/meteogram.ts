// Meteograma em SVG próprio (skill dataviz): vento e rajada no mesmo eixo
// (mesma grandeza), ondas em gráfico separado (nunca dois eixos y). Cruz de
// leitura sincronizada nos dois gráficos, com leitura em texto, legenda e
// tabela como alternativa acessível.
import { formatLocal, waveArrowDeg } from '@mariners-compass/core'
import { getLocale, t, type MessageKey } from './i18n.ts'
import { compassIndex, convertKnots, maxOf, niceScale } from './point-format.ts'
import { formatNumber, type SpeedUnit } from './scales.ts'

export interface MeteogramData {
  times: string[]
  /** Nós (unidade do /point). */
  wind: (number | null)[]
  gust: (number | null)[]
  windDir: (number | null)[]
  waveHeight: (number | null)[]
  wavePeriod: (number | null)[]
  waveDir: (number | null)[]
}

const M = { left: 36, right: 52, top: 12, bottom: 24 }
const WIND_H = 168
const WAVE_H = 128
/** Passos possíveis entre setas (h); usa o menor que deixa pelo menos MIN_ARROW_PX entre elas. */
const ARROW_STEPS_H = [3, 6, 12, 24]
const MIN_ARROW_PX = 22
/** Distância mínima entre rótulos de dia (px). */
const MIN_DAY_LABEL_PX = 56
const SVG_NS = 'http://www.w3.org/2000/svg'

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

function pathOf(values: (number | null)[], x: (i: number) => number, y: (v: number) => number): string {
  let d = ''
  let pen = false
  values.forEach((v, i) => {
    if (v === null) {
      pen = false
      return
    }
    d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`
    pen = true
  })
  return d
}

export function directionLabel(deg: number | null): string {
  if (deg === null) return t('point.noValue')
  return `${t('point.from')} ${t('compass.points').split(',')[compassIndex(deg)]} (${Math.round(deg)}°)`
}

export class Meteogram {
  private data: MeteogramData | null = null
  private unit: SpeedUnit = 'kn'
  private cursor = 0
  private width = 320
  private readonly readout: HTMLElement
  private readonly charts: HTMLElement
  private readonly legend: HTMLElement
  private readonly table: HTMLElement
  private readonly observer: ResizeObserver

  constructor(root: HTMLElement) {
    root.innerHTML =
      `<p class="mg-readout" aria-live="off"></p>` +
      `<div class="mg-legend"></div>` +
      `<div class="mg-charts" tabindex="0" role="group"></div>` +
      `<details class="mg-table"><summary></summary><div class="mg-table-body"></div></details>`
    this.readout = root.querySelector('.mg-readout')!
    this.legend = root.querySelector('.mg-legend')!
    this.charts = root.querySelector('.mg-charts')!
    this.table = root.querySelector('.mg-table')!
    this.charts.addEventListener('pointermove', (e) => this.onPointer(e))
    this.charts.addEventListener('pointerdown', (e) => this.onPointer(e))
    this.charts.addEventListener('keydown', (e) => this.onKey(e))
    this.observer = new ResizeObserver(() => {
      const w = Math.floor(this.charts.clientWidth)
      if (w > 0 && w !== this.width) {
        this.width = w
        this.render()
      }
    })
    this.observer.observe(this.charts)
  }

  set(data: MeteogramData, unit: SpeedUnit, cursor: number): void {
    this.data = data
    this.unit = unit
    this.cursor = Math.min(Math.max(0, cursor), data.times.length - 1)
    this.width = Math.max(240, Math.floor(this.charts.clientWidth) || this.width)
    this.render()
  }

  setUnit(unit: SpeedUnit): void {
    this.unit = unit
    this.render()
  }

  private x(i: number): number {
    const n = this.data!.times.length
    const plot = this.width - M.left - M.right
    return M.left + (n <= 1 ? 0 : (i / (n - 1)) * plot)
  }

  private render(): void {
    const d = this.data
    if (!d || d.times.length === 0) return
    const locale = getLocale()
    const wind = d.wind.map((v) => convertKnots(v, this.unit))
    const gust = d.gust.map((v) => convertKnots(v, this.unit))
    const hasWaves = d.waveHeight.some((v) => v !== null)
    const unitLabel = t(`unit.${this.unit}`)

    this.charts.setAttribute('aria-label', t('point.chartLabel'))
    this.legend.innerHTML =
      `<span class="mg-key"><span class="mg-key-line mg-wind"></span>${esc(t('point.wind'))}</span>` +
      `<span class="mg-key"><span class="mg-key-line mg-gust"></span>${esc(t('point.gust'))}</span>`

    const windSvg = this.chart({
      height: WIND_H,
      title: t('point.windChart', { unit: unitLabel }),
      series: [
        { values: wind, cls: 'mg-wind', label: t('point.wind') },
        { values: gust, cls: 'mg-gust', label: t('point.gust') },
      ],
      max: maxOf(wind, gust) ?? 0,
      arrows: d.windDir.map((v) => (v === null ? null : (v + 180) % 360)),
      digits: 0,
      locale,
    })
    const wavesSvg = hasWaves
      ? this.chart({
          height: WAVE_H,
          title: t('point.waveChart', { unit: t('unit.m') }),
          series: [{ values: d.waveHeight, cls: 'mg-wave', label: t('point.waveHeight') }],
          max: maxOf(d.waveHeight) ?? 0,
          arrows: d.waveDir.map((v) => (v === null ? null : waveArrowDeg(v))),
          digits: 1,
          locale,
        })
      : `<p class="mg-empty">${esc(t('point.noWaves'))}</p>`
    this.charts.innerHTML = windSvg + wavesSvg
    this.renderTable(wind, gust, locale)
    this.moveCursor(this.cursor)
  }

  private chart(o: {
    height: number
    title: string
    series: { values: (number | null)[]; cls: string; label: string }[]
    max: number
    arrows: (number | null)[]
    digits: number
    locale: string
  }): string {
    const d = this.data!
    const { max, ticks } = niceScale(o.max)
    const plotH = o.height - M.top - M.bottom
    const y = (v: number) => M.top + plotH - (v / max) * plotH
    const x = (i: number) => this.x(i)
    const right = this.width - M.right
    let s = `<figure class="mg-figure"><figcaption class="mg-title">${esc(o.title)}</figcaption>`
    s += `<svg xmlns="${SVG_NS}" class="mg-svg" width="${this.width}" height="${o.height}" viewBox="0 0 ${this.width} ${o.height}" aria-hidden="true">`
    // Grade horizontal discreta e rótulos do eixo y.
    for (const tick of ticks) {
      const ty = y(tick).toFixed(1)
      s += `<line class="mg-grid" x1="${M.left}" x2="${right}" y1="${ty}" y2="${ty}"/>`
      s += `<text class="mg-axis" x="${M.left - 6}" y="${ty}" text-anchor="end" dominant-baseline="middle">${esc(formatNumber(tick, o.locale, 1))}</text>`
    }
    // Meia-noite local: linha do dia; rótulo só se couber sem encostar no anterior.
    let lastLabel = -Infinity
    d.times.forEach((time, i) => {
      if (new Date(time).getHours() !== 0) return
      const px = x(i)
      const tx = px.toFixed(1)
      s += `<line class="mg-day" x1="${tx}" x2="${tx}" y1="${M.top}" y2="${M.top + plotH}"/>`
      if (px - lastLabel < MIN_DAY_LABEL_PX || px > this.width - M.right - 24) return
      lastLabel = px
      const label = formatLocal(time, o.locale, undefined, { weekday: 'short', day: '2-digit' })
      s += `<text class="mg-axis" x="${tx}" y="${o.height - 6}" text-anchor="start" dx="3">${esc(label)}</text>`
    })
    // Setas de direção logo abaixo do topo, espaçadas pela largura disponível.
    const pxPerHour = d.times.length > 1 ? (x(d.times.length - 1) - x(0)) / (d.times.length - 1) : Infinity
    const every = ARROW_STEPS_H.find((h) => h * pxPerHour >= MIN_ARROW_PX) ?? 24
    o.arrows.forEach((deg, i) => {
      if (deg === null || new Date(d.times[i]).getHours() % every !== 0) return
      const ax = x(i).toFixed(1)
      const ay = (M.top + 9).toFixed(1)
      s += `<path class="mg-arrow" d="M0,6L0,-6M-3.5,-2L0,-6L3.5,-2" transform="translate(${ax} ${ay}) rotate(${Math.round(deg)})"/>`
    })
    // Linhas das séries e rótulo direto na ponta direita, sem sobrepor.
    const ends: { y: number; label: string; cls: string }[] = []
    for (const ser of o.series) {
      s += `<path class="mg-line ${ser.cls}" d="${pathOf(ser.values, x, y)}"/>`
      const last = ser.values.findLastIndex((v) => v !== null)
      if (last >= 0) ends.push({ y: y(ser.values[last]!), label: ser.label, cls: ser.cls })
    }
    ends.sort((a, b) => a.y - b.y)
    for (let k = 1; k < ends.length; k++) if (ends[k].y - ends[k - 1].y < 14) ends[k].y = ends[k - 1].y + 14
    for (const e of ends) s += `<text class="mg-direct" x="${right + 6}" y="${e.y.toFixed(1)}" dominant-baseline="middle">${esc(e.label)}</text>`
    // Cruz de leitura (posição atualizada em moveCursor).
    s += `<line class="mg-cursor" x1="0" x2="0" y1="${M.top}" y2="${M.top + plotH}"/>`
    for (const ser of o.series) {
      s += `<circle class="mg-dot ${ser.cls}" r="4" cx="0" cy="0" data-series="${ser.cls}" data-max="${max}" data-plot="${plotH}"/>`
    }
    s += `</svg></figure>`
    return s
  }

  private seriesAt(cls: string, i: number): number | null {
    const d = this.data!
    if (cls === 'mg-wind') return convertKnots(d.wind[i], this.unit)
    if (cls === 'mg-gust') return convertKnots(d.gust[i], this.unit)
    return d.waveHeight[i]
  }

  private moveCursor(i: number): void {
    const d = this.data
    if (!d) return
    this.cursor = i
    const cx = this.x(i).toFixed(1)
    this.charts.querySelectorAll<SVGLineElement>('.mg-cursor').forEach((l) => {
      l.setAttribute('x1', cx)
      l.setAttribute('x2', cx)
    })
    this.charts.querySelectorAll<SVGCircleElement>('.mg-dot').forEach((dot) => {
      const v = this.seriesAt(dot.dataset.series!, i)
      if (v === null) {
        dot.style.display = 'none'
        return
      }
      const max = Number(dot.dataset.max)
      const plotH = Number(dot.dataset.plot)
      dot.style.display = ''
      dot.setAttribute('cx', cx)
      dot.setAttribute('cy', (M.top + plotH - (v / max) * plotH).toFixed(1))
    })
    this.readout.textContent = this.readoutText(i)
  }

  private readoutText(i: number): string {
    const d = this.data!
    const locale = getLocale()
    const num = (v: number | null, digits: number) => (v === null ? t('point.noValue') : formatNumber(v, locale, digits))
    const unit = t(`unit.${this.unit}`)
    const when = formatLocal(d.times[i], locale, undefined, { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    const parts = [
      when,
      t('point.readWind', { value: num(convertKnots(d.wind[i], this.unit), 0), unit, dir: directionLabel(d.windDir[i]) }),
      t('point.readGust', { value: num(convertKnots(d.gust[i], this.unit), 0), unit }),
    ]
    if (d.waveHeight.some((v) => v !== null)) {
      parts.push(
        t('point.readWaves', {
          value: num(d.waveHeight[i], 1),
          period: num(d.wavePeriod[i], 0),
          dir: directionLabel(d.waveDir[i]),
        }),
      )
    }
    return parts.join(' · ')
  }

  private renderTable(wind: (number | null)[], gust: (number | null)[], locale: string): void {
    const d = this.data!
    const num = (v: number | null, digits: number) => (v === null ? t('point.noValue') : formatNumber(v, locale, digits))
    const unit = t(`unit.${this.unit}`)
    const head: MessageKey[] = ['point.colTime', 'point.wind', 'point.gust', 'point.colWindDir', 'point.waveHeight', 'point.colPeriod', 'point.colWaveDir']
    const units = ['', unit, unit, '', t('unit.m'), t('unit.s'), '']
    let html = `<table><thead><tr>${head.map((k, c) => `<th scope="col">${esc(t(k))}${units[c] ? ` (${esc(units[c])})` : ''}</th>`).join('')}</tr></thead><tbody>`
    d.times.forEach((time, i) => {
      const when = formatLocal(time, locale, undefined, { weekday: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
      html +=
        `<tr><th scope="row">${esc(when)}</th><td>${num(wind[i], 0)}</td><td>${num(gust[i], 0)}</td>` +
        `<td>${esc(directionLabel(d.windDir[i]))}</td><td>${num(d.waveHeight[i], 1)}</td><td>${num(d.wavePeriod[i], 0)}</td>` +
        `<td>${esc(directionLabel(d.waveDir[i]))}</td></tr>`
    })
    html += `</tbody></table>`
    this.table.querySelector('summary')!.textContent = t('point.showTable')
    this.table.querySelector('.mg-table-body')!.innerHTML = html
  }

  private onPointer(e: PointerEvent): void {
    const d = this.data
    if (!d) return
    this.readout.setAttribute('aria-live', 'off')
    const rect = this.charts.getBoundingClientRect()
    const plot = this.width - M.left - M.right
    const f = (e.clientX - rect.left - M.left) / plot
    this.moveCursor(Math.round(Math.min(1, Math.max(0, f)) * (d.times.length - 1)))
  }

  private onKey(e: KeyboardEvent): void {
    const d = this.data
    if (!d) return
    const last = d.times.length - 1
    const step = e.shiftKey ? 24 : 1
    const next =
      e.key === 'ArrowRight' ? this.cursor + step : e.key === 'ArrowLeft' ? this.cursor - step : e.key === 'Home' ? 0 : e.key === 'End' ? last : null
    if (next === null) return
    e.preventDefault()
    // Pelo teclado, a leitura é anunciada; pelo mouse, não (seria ruído).
    this.readout.setAttribute('aria-live', 'polite')
    this.moveCursor(Math.min(last, Math.max(0, next)))
  }
}

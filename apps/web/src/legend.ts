// Legenda sempre visível (B10): faixas de cor com rótulo numérico em cada limite.
import type { LayerId } from './api.ts'
import { getLocale, t } from './i18n.ts'
import { WAVE_BANDS_M, WIND_BANDS_KN, WIND_COLORS, formatNumber, fromKnots, waveCss, type SpeedUnit } from './scales.ts'
import type { Mode } from './theme.ts'

export interface LegendItem {
  color: string
  label: string
}

/** Itens da legenda: um por faixa; a última leva "+". */
export function legendItems(layer: LayerId, mode: Mode, unit: SpeedUnit, locale: string): LegendItem[] {
  if (layer === 'wind') {
    return WIND_BANDS_KN.map((kn, i) => {
      const value = formatNumber(fromKnots(kn, unit), locale, 0)
      return { color: WIND_COLORS[mode][i], label: i === WIND_BANDS_KN.length - 1 ? t('legend.plus', { value }) : value }
    })
  }
  return WAVE_BANDS_M.map((m, i) => {
    const value = formatNumber(m, locale, 1)
    return { color: waveCss(mode, i), label: i === WAVE_BANDS_M.length - 1 ? t('legend.plus', { value }) : value }
  })
}

export function renderLegend(el: HTMLElement, layer: LayerId, mode: Mode, unit: SpeedUnit): void {
  const title = layer === 'wind' ? t('legend.wind', { unit: t(`unit.${unit}`) }) : t('legend.waves', { unit: t('unit.m') })
  const items = legendItems(layer, mode, unit, getLocale())
  el.replaceChildren()
  const caption = document.createElement('p')
  caption.className = 'legend-title'
  caption.textContent = title
  const list = document.createElement('ol')
  list.className = `legend-scale legend-${layer}`
  for (const item of items) {
    const li = document.createElement('li')
    const swatch = document.createElement('span')
    swatch.className = 'legend-swatch'
    swatch.style.setProperty('--swatch', item.color)
    const label = document.createElement('span')
    label.className = 'legend-label'
    label.textContent = item.label
    li.append(swatch, label)
    list.append(li)
  }
  el.append(caption, list)
}

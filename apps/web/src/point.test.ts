// Painel do ponto (6b): unidades, eixos, direção, Retry-After e mensagens de erro.
import { describe, expect, it } from 'vitest'
import { ApiError, pointUrl } from './api.ts'
import { setLocale, t } from './i18n.ts'
import { directionLabel } from './meteogram.ts'
import { allNull, compassIndex, convertKnots, currentIndex, isSpeedUnit, maxOf, niceScale, waitParts } from './point-format.ts'
import { pointErrorMessage } from './point-panel.ts'

describe('unidades do painel', () => {
  it('converte nós para a unidade escolhida e mantém null', () => {
    expect(convertKnots(10, 'kn')).toBe(10)
    expect(convertKnots(10, 'kmh')).toBeCloseTo(18.52)
    expect(convertKnots(10, 'ms')).toBeCloseTo(5.1444, 4)
    expect(convertKnots(null, 'kmh')).toBeNull()
  })
  it('aceita só kn, kmh e ms vindos do armazenamento', () => {
    expect(isSpeedUnit('kmh')).toBe(true)
    expect(isSpeedUnit('mph')).toBe(false)
    expect(isSpeedUnit(null)).toBe(false)
  })
})

describe('eixos do meteograma', () => {
  it('máximo redondo com marcas a partir de zero', () => {
    expect(niceScale(17)).toEqual({ max: 20, ticks: [0, 5, 10, 15, 20] })
    expect(niceScale(1.3)).toEqual({ max: 1.5, ticks: [0, 0.5, 1, 1.5] })
    expect(niceScale(0).max).toBeGreaterThan(0)
  })
  it('máximo ignora nulos; série toda nula = sem dado', () => {
    expect(maxOf([1, null, 3], [2, 7])).toBe(7)
    expect(maxOf([null, null])).toBeNull()
    expect(allNull([null, null])).toBe(true)
    expect(allNull([null, 0])).toBe(false)
  })
  it('começa na hora atual', () => {
    const times = ['2026-11-18T10:00:00Z', '2026-11-18T11:00:00Z', '2026-11-18T12:00:00Z']
    expect(currentIndex(times, Date.parse('2026-11-18T11:40:00Z'))).toBe(1)
    expect(currentIndex(times, Date.parse('2026-11-18T09:00:00Z'))).toBe(0)
  })
})

describe('direção', () => {
  it('16 rumos, com 360 e negativos normalizados', () => {
    expect(compassIndex(0)).toBe(0)
    expect(compassIndex(359)).toBe(0)
    expect(compassIndex(-90)).toBe(12)
    expect(compassIndex(135)).toBe(6)
  })
  it('rótulo "de onde vem" em cada idioma', () => {
    setLocale('pt-BR')
    expect(directionLabel(90)).toBe('de L (90°)')
    expect(directionLabel(null)).toBe('—')
    setLocale('en')
    expect(directionLabel(270)).toBe('from W (270°)')
    setLocale('pt-BR')
  })
})

describe('Retry-After e mensagens', () => {
  it('espera em linguagem simples', () => {
    expect(waitParts(30)).toEqual({ unit: 'minutes', value: 1 })
    expect(waitParts(1500)).toEqual({ unit: 'minutes', value: 25 })
    expect(waitParts(5 * 3600 + 1)).toEqual({ unit: 'hours', value: 6 })
  })
  it('429, 503 de cota, coordenada fora e rede', () => {
    setLocale('pt-BR')
    expect(pointErrorMessage(new ApiError(429, 'rate_limited', 'x', 120))).toContain('cerca de 2 min')
    expect(pointErrorMessage(new ApiError(503, 'quota_exhausted', 'x', 7200))).toContain('limite diário')
    expect(pointErrorMessage(new ApiError(422, 'invalid_coordinates', 'x'))).toBe(t('point.outside'))
    expect(pointErrorMessage(new ApiError(503, 'service_unavailable', 'x'))).toBe(t('error.unavailable'))
    expect(pointErrorMessage(new ApiError(0, 'network', 'x'))).toBe(t('error.network'))
  })
  it('texto de resolução do ponto exato do B10', () => {
    setLocale('pt-BR')
    expect(t('resolution.point')).toBe(
      'Previsão para a coordenada arredondada a 0,25° (cerca de 28 km). Os valores podem diferir do mapa. É previsão de modelo, não medição no seu local.',
    )
  })
})

describe('pointUrl', () => {
  it('arredonda o toque a 2 casas e pede só as variáveis do painel', () => {
    const url = new URL(pointUrl(-22.914791, -43.104781), 'http://x')
    expect(url.pathname).toBe('/api/v1/point')
    expect(url.searchParams.get('lat')).toBe('-22.91')
    expect(url.searchParams.get('lon')).toBe('-43.10')
    expect(url.searchParams.get('hours')).toBe('168')
    expect(url.searchParams.get('vars')!.split(',')).toContain('wave_height')
  })
})

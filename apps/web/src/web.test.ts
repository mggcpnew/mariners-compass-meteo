// Testes de unidade do front (sem DOM): textos, escolha da grade, amostragem,
// escalas e barra de tempo.
import { describe, expect, it } from 'vitest'
import type { GridRecord, RegionInfo } from './api.ts'
import { chooseRegion } from './grid-choice.ts'
import { cellAt, sampleDirection, sampleScalar, splitWaves } from './grid-sample.ts'
import { detectLocale, MESSAGES, setLocale, t } from './i18n.ts'
import { bandIndex, fromKnots, WAVE_BANDS_M, WIND_BANDS_KN, WIND_COLORS, windColorScale } from './scales.ts'
import { frameLabel, nearestFrame } from './timebar.ts'

describe('i18n (AC-MVP-15)', () => {
  it('pt-BR e en têm as mesmas chaves, sem texto vazio', () => {
    const pt = Object.keys(MESSAGES['pt-BR']).sort()
    const en = Object.keys(MESSAGES.en).sort()
    expect(en).toEqual(pt)
    for (const locale of ['pt-BR', 'en'] as const) {
      for (const [key, value] of Object.entries(MESSAGES[locale])) expect(value.trim(), `${locale} ${key}`).not.toBe('')
    }
  })
  it('os mesmos parâmetros {x} nos dois idiomas', () => {
    const params = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
    for (const key of Object.keys(MESSAGES['pt-BR']) as (keyof (typeof MESSAGES)['pt-BR'])[]) {
      expect(params(MESSAGES.en[key]), key).toEqual(params(MESSAGES['pt-BR'][key]))
    }
  })
  it('textos obrigatórios do B10 exatos em pt-BR', () => {
    const pt = MESSAGES['pt-BR']
    expect(pt['footer.disclaimer']).toBe('Dados de modelos numéricos. Não substitui previsão oficial da Marinha do Brasil para navegação.')
    expect(pt['resolution.wide']).toBe(
      'Mapa regional montado a partir de pontos espaçados em 2° (cerca de 220 km). Não representa o vento local da enseada.',
    )
    expect(pt['resolution.bay']).toBe(
      'Mapa montado a partir de pontos espaçados em 0,25° (cerca de 28 km). Não representa o vento local da enseada: junto ao morro, à ponte ou à entrada da baía o vento pode ser bem diferente.',
    )
  })
  it('detecta o idioma e troca parâmetros', () => {
    expect(detectLocale(['pt-PT'])).toBe('pt-BR')
    expect(detectLocale(['en-US', 'pt-BR'])).toBe('pt-BR')
    expect(detectLocale(['es-AR'])).toBe('en')
    setLocale('en')
    expect(t('legend.wind', { unit: 'kn' })).toBe('Wind (kn)')
    setLocale('pt-BR')
    expect(t('legend.wind', { unit: 'nós' })).toBe('Vento (nós)')
  })
})

const REGIONS: RegionInfo[] = [
  { id: 'wide', bbox: [-54, -35, -30, 5], res: 2 },
  { id: 'bay', bbox: [-44, -24, -42, -22], res: 0.25 },
]

describe('chooseRegion (AC-MVP-27)', () => {
  const enseada = { lat: -22.71982, lng: -43.17215 }
  it('zoom 10 com centro na baía usa a grade da baía', () => {
    expect(chooseRegion(REGIONS, 10, enseada, 9)?.id).toBe('bay')
    expect(chooseRegion(REGIONS, 9, enseada, 9)?.id).toBe('bay')
  })
  it('zoom abaixo do mínimo ou centro fora do bbox usa a ampla', () => {
    expect(chooseRegion(REGIONS, 8, enseada, 9)?.id).toBe('wide')
    expect(chooseRegion(REGIONS, 11, { lat: -23.5, lng: -46.6 }, 9)?.id).toBe('wide')
  })
  it('o padrão de build é 9', () => {
    expect(chooseRegion(REGIONS, 9, enseada)?.id).toBe('bay')
    expect(chooseRegion(REGIONS, 8, enseada)?.id).toBe('wide')
  })
})

// Grade 3 x 2 (lon -44..-42 passo 1; lat -22..-23 passo 1), linhas norte -> sul.
function grid(data: (number | null)[], parameter?: string): GridRecord {
  return { header: { lo1: -44, la1: -22, lo2: -42, la2: -23, dx: 1, dy: 1, nx: 3, ny: 2, refTime: '2026-11-18T00:00:00Z', parameter }, data }
}

describe('amostragem da grade', () => {
  it('acha a célula e a posição dentro dela', () => {
    const c = cellAt(grid([1, 2, 3, 4, 5, 6]), -22.25, -43.5)!
    expect(c.corners).toEqual([1, 2, 4, 5])
    expect(c.x).toBeCloseTo(0.5)
    expect(c.y).toBeCloseTo(0.25)
  })
  it('borda leste e sul usam a última célula; fora da grade é null', () => {
    expect(sampleScalar(grid([1, 2, 3, 4, 5, 6]), -23, -42)).toBe(6)
    expect(sampleScalar(grid([1, 2, 3, 4, 5, 6]), -21.9, -43)).toBeNull()
    expect(sampleScalar(grid([1, 2, 3, 4, 5, 6]), -22.5, -41.9)).toBeNull()
  })
  it('interpola e respeita a regra de nulos (terra transparente)', () => {
    expect(sampleScalar(grid([1, 2, 3, 4, 5, 6]), -22.5, -43.5)).toBeCloseTo(3)
    expect(sampleScalar(grid([null, 2, 3, 4, 5, 6]), -22.1, -43.9)).toBeNull()
    expect(sampleScalar(grid([null, 2, 3, 4, 5, 6]), -22.9, -43.1)).not.toBeNull()
  })
  it('direção por componentes: 359° e 1° dão cerca de 0°', () => {
    const d = sampleDirection(grid([359, 1, 0, 359, 1, 0]), -22.5, -43.5)!
    expect(Math.min(d, 360 - d)).toBeLessThan(1e-6)
  })
  it('separa altura e direção do arquivo de ondas', () => {
    const h = grid([1, 1, 1, 1, 1, 1], 'height')
    const d = grid([90, 90, 90, 90, 90, 90], 'direction')
    expect(splitWaves([h, d])).toEqual({ height: h, direction: d })
    expect(splitWaves([h])).toBeNull()
  })
})

describe('escalas', () => {
  it('faixas: o limite inferior pertence à faixa', () => {
    expect(bandIndex(WIND_BANDS_KN, 0)).toBe(0)
    expect(bandIndex(WIND_BANDS_KN, 4.9)).toBe(0)
    expect(bandIndex(WIND_BANDS_KN, 5)).toBe(1)
    expect(bandIndex(WIND_BANDS_KN, 80)).toBe(WIND_BANDS_KN.length - 1)
    expect(bandIndex(WAVE_BANDS_M, 1.5)).toBe(3)
  })
  it('escala do leaflet-velocity: o nó arredondado cai na cor da faixa', () => {
    for (const mode of ['light', 'dark', 'night'] as const) {
      const scale = windColorScale(mode)
      expect(scale).toHaveLength(36)
      expect(scale[4]).toBe(WIND_COLORS[mode][0])
      expect(scale[5]).toBe(WIND_COLORS[mode][1])
      expect(scale[35]).toBe(WIND_COLORS[mode][7])
    }
  })
  it('modo noturno só usa vermelho (verde e azul nunca acima do vermelho)', () => {
    for (const hex of WIND_COLORS.night) {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
      expect(g).toBe(b)
      expect(g).toBeLessThan(r)
    }
  })
  it('rótulos convertidos para a unidade escolhida', () => {
    expect(fromKnots(10, 'kn')).toBe(10)
    expect(fromKnots(10, 'kmh')).toBeCloseTo(18.52)
    expect(fromKnots(10, 'ms')).toBeCloseTo(5.144, 3)
  })
})

describe('barra de tempo', () => {
  const times = ['2026-11-18T00:00:00Z', '2026-11-18T03:00:00Z', '2026-11-18T06:00:00Z']
  it('começa no quadro mais próximo de agora', () => {
    expect(nearestFrame(times, Date.parse('2026-11-18T04:10:00Z'))).toBe(1)
    expect(nearestFrame(times, Date.parse('2026-11-17T12:00:00Z'))).toBe(0)
    expect(nearestFrame(times, Date.parse('2026-11-25T00:00:00Z'))).toBe(2)
  })
  it('mostra o horário no fuso do aparelho (UTC-3 e UTC+0)', () => {
    expect(frameLabel('2026-11-18T03:00:00Z', 'pt-BR', 'America/Sao_Paulo')).toMatch(/18\/11.*00:00/)
    expect(frameLabel('2026-11-18T03:00:00Z', 'pt-BR', 'UTC')).toMatch(/18\/11.*03:00/)
  })
})

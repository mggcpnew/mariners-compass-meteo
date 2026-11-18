// Camada de ondas própria em Canvas (B6/B10): altura em faixas de cor com
// interpolação bilinear e regra de nulos (terra = transparente), mais setas no
// sentido de propagação (waveArrowDeg).
import { waveArrowDeg } from '@mariners-compass/core'
import type { GridRecord } from './api.ts'
import { sampleDirection, sampleScalar, splitWaves } from './grid-sample.ts'
import L from './leaflet-global.ts'
import { waveRgba } from './scales.ts'
import { cssVar, type Mode } from './theme.ts'

/** Passo da amostragem em pixels de tela; a imagem é ampliada com suavização. */
const SAMPLE_PX = 4
/** Espaço entre as setas, em pixels de tela. */
const ARROW_PX = 64

export class WavesLayer extends L.Layer {
  private canvas: HTMLCanvasElement | null = null
  private grids: { height: GridRecord; direction: GridRecord } | null = null
  private mode: Mode
  private readonly paneName: string

  constructor(mode: Mode, pane: string) {
    super()
    this.mode = mode
    this.paneName = pane
  }

  override onAdd(map: L.Map): this {
    this.canvas = L.DomUtil.create('canvas', 'mc-waves leaflet-zoom-hide') as HTMLCanvasElement
    this.canvas.setAttribute('aria-hidden', 'true')
    map.getPane(this.paneName)!.appendChild(this.canvas)
    map.on('moveend zoomend resize', this.redraw, this)
    this.redraw()
    return this
  }

  override onRemove(map: L.Map): this {
    map.off('moveend zoomend resize', this.redraw, this)
    this.canvas?.remove()
    this.canvas = null
    return this
  }

  setData(file: GridRecord[]): void {
    this.grids = splitWaves(file)
    this.redraw()
  }

  setMode(mode: Mode): void {
    this.mode = mode
    this.redraw()
  }

  redraw(): void {
    const map = this._map as L.Map | undefined
    const canvas = this.canvas
    if (!map || !canvas) return
    const size = map.getSize()
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(size.x * dpr)
    canvas.height = Math.round(size.y * dpr)
    canvas.style.width = `${size.x}px`
    canvas.style.height = `${size.y}px`
    L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint([0, 0]))
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, size.x, size.y)
    if (!this.grids) return
    this.drawField(map, ctx, size)
    this.drawArrows(map, ctx, size)
  }

  private drawField(map: L.Map, ctx: CanvasRenderingContext2D, size: L.Point): void {
    const w = Math.ceil(size.x / SAMPLE_PX) + 1
    const h = Math.ceil(size.y / SAMPLE_PX) + 1
    const off = document.createElement('canvas')
    off.width = w
    off.height = h
    const offCtx = off.getContext('2d')
    if (!offCtx) return
    const img = offCtx.createImageData(w, h)
    const { height } = this.grids!
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const ll = map.containerPointToLatLng([i * SAMPLE_PX, j * SAMPLE_PX])
        const v = sampleScalar(height, ll.lat, ll.lng)
        if (v === null) continue
        const [r, g, b, a] = waveRgba(this.mode, v)
        const k = (j * w + i) * 4
        img.data[k] = r
        img.data[k + 1] = g
        img.data[k + 2] = b
        img.data[k + 3] = a
      }
    }
    offCtx.putImageData(img, 0, 0)
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(off, 0, 0, w * SAMPLE_PX, h * SAMPLE_PX)
  }

  private drawArrows(map: L.Map, ctx: CanvasRenderingContext2D, size: L.Point): void {
    const { height, direction } = this.grids!
    ctx.strokeStyle = cssVar('--map-arrow')
    ctx.lineWidth = 1.5
    ctx.lineCap = 'round'
    for (let y = ARROW_PX / 2; y < size.y; y += ARROW_PX) {
      for (let x = ARROW_PX / 2; x < size.x; x += ARROW_PX) {
        const ll = map.containerPointToLatLng([x, y])
        if (sampleScalar(height, ll.lat, ll.lng) === null) continue
        const dir = sampleDirection(direction, ll.lat, ll.lng)
        if (dir === null) continue
        const rad = (waveArrowDeg(dir) * Math.PI) / 180
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(rad)
        ctx.beginPath()
        ctx.moveTo(0, 10)
        ctx.lineTo(0, -10)
        ctx.moveTo(-5, -4)
        ctx.lineTo(0, -10)
        ctx.lineTo(5, -4)
        ctx.stroke()
        ctx.restore()
      }
    }
  }
}

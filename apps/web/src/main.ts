// Mapa de vento e ondas (etapa 6a). Painel do ponto (6b) e avisos, modal,
// idiomas, modo noturno e PWA (6c) entram nas próximas entregas.
import 'leaflet/dist/leaflet.css'
import './style.css'
import { formatLocal } from '@mariners-compass/core'
import { ApiError, type LayerId, type RegionInfo } from './api.ts'
import { Forecast } from './forecast.ts'
import { chooseRegion } from './grid-choice.ts'
import { applyI18n, detectLocale, getLocale, setLocale, t, type MessageKey } from './i18n.ts'
import { compassRoseSvg, ICONS } from './icons.ts'
import { renderLegend } from './legend.ts'
import { addLand, createMap, INITIAL_CENTER, INITIAL_ZOOM, PANES } from './map.ts'
import type { SpeedUnit } from './scales.ts'
import { currentMode, onModeChange } from './theme.ts'
import { nearestFrame, TimeBar } from './timebar.ts'
import { WavesLayer } from './waves-layer.ts'
import { createWindLayer } from './wind-layer.ts'

/** Intervalo entre quadros no play (ms). */
const PLAY_INTERVAL_MS = 1500

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!

setLocale(detectLocale(navigator.languages ?? [navigator.language]))
document.documentElement.lang = getLocale()
document.title = t('app.title')
applyI18n(document)
$('#brand-mark').innerHTML = compassRoseSvg()
$('#recenter').innerHTML = compassRoseSvg()
document.querySelectorAll<HTMLElement>('[data-icon]').forEach((el) => {
  el.innerHTML = ICONS[el.dataset.icon as keyof typeof ICONS]
})

const state = {
  layer: 'wind' as LayerId,
  unit: 'kn' as SpeedUnit,
  index: 0,
  region: null as RegionInfo | null,
  playing: false,
  /** Pedido em curso; respostas de pedidos antigos são descartadas. */
  seq: 0,
}

const forecast = new Forecast()
const map = createMap($('#map'))
const wind = createWindLayer(currentMode(), PANES.wind)
const waves = new WavesLayer(currentMode(), PANES.waves)
let land: { restyle(): void } | null = null
let playTimer: number | undefined

const timebar = new TimeBar($('#timebar'), {
  onSelect: (i) => {
    stopPlay()
    void showFrame(i)
  },
  onTogglePlay: () => (state.playing ? stopPlay() : startPlay()),
})

function showStatus(key: MessageKey | null, params: Record<string, string> = {}, retry = false): void {
  const box = $('#status')
  box.hidden = key === null
  $('#status-text').textContent = key ? t(key, params) : ''
  $('#status-retry').hidden = !retry
}

function errorKey(err: unknown): MessageKey {
  if (!(err instanceof ApiError)) return 'error.generic'
  if (err.status === 0) return 'error.network'
  if (err.code === 'data_expired') return 'error.dataExpired'
  if (err.status === 503) return 'error.unavailable'
  return 'error.generic'
}

function runLabel(runTime: string): string {
  return formatLocal(runTime, getLocale(), undefined, { dateStyle: 'short', timeStyle: 'short' })
}

function renderMeta(): void {
  const meta = forecast.frames?.meta
  $('#source-label').textContent = meta
    ? t('source.label', { model: meta.model === 'auto' ? t('source.modelAuto') : meta.model, run: runLabel(meta.run_time) })
    : ''
  $('#attribution').textContent = meta?.attribution.join(' ') ?? ''
  $('#resolution').textContent = state.region ? t(state.region.id === 'bay' ? 'resolution.bay' : 'resolution.wide') : ''
  renderLegend($('#legend'), state.layer, currentMode(), state.unit)
  document.querySelectorAll<HTMLButtonElement>('.seg-btn').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.layer === state.layer))
  })
}

function setActiveLayer(): void {
  const showWind = state.layer === 'wind'
  if (showWind) {
    if (map.hasLayer(waves)) map.removeLayer(waves)
    if (!map.hasLayer(wind.layer)) wind.layer.addTo(map)
  } else {
    if (map.hasLayer(wind.layer)) map.removeLayer(wind.layer)
    if (!map.hasLayer(waves)) waves.addTo(map)
  }
}

async function showFrame(index: number, retried = false): Promise<void> {
  const frames = forecast.frames
  if (!frames) return
  const seq = ++state.seq
  state.index = index
  state.region = chooseRegion(frames.meta.regions, map.getZoom(), map.getCenter())
  timebar.setIndex(index)
  renderMeta()
  const region = state.region
  if (!region) return
  try {
    const file = await forecast.grid(state.layer, region, index)
    if (seq !== state.seq) return
    if (state.layer === 'wind') wind.setData(file)
    else waves.setData(file)
    if (frames.meta.status === 'stale') showStatus('status.stale', { run: runLabel(frames.meta.run_time) })
    else showStatus(null)
    forecast.preload(state.layer, region, index)
  } catch (err) {
    if (seq !== state.seq) return
    // Rodada trocada ou apagada: recarrega /frames uma vez (B7).
    if (err instanceof ApiError && err.code === 'run_not_found' && !retried) {
      await loadFrames(false)
      return
    }
    stopPlay()
    showStatus(errorKey(err), {}, true)
  }
}

async function loadFrames(keepTime: boolean): Promise<void> {
  const previous = forecast.frames?.times[state.index]
  try {
    const frames = await forecast.loadFrames(state.layer)
    const same = keepTime && previous ? frames.times.indexOf(previous) : -1
    const index = same >= 0 ? same : nearestFrame(frames.times, Date.now())
    timebar.setTimes(frames.times, index)
    await showFrame(index, true)
  } catch (err) {
    stopPlay()
    showStatus(errorKey(err), {}, true)
  }
}

function startPlay(): void {
  const frames = forecast.frames
  if (!frames) return
  state.playing = true
  timebar.setPlaying(true)
  const tick = () => {
    const next = state.index + 1 < frames.times.length ? state.index + 1 : 0
    // Só avança quando o próximo quadro já chegou; senão espera o próximo tique.
    if (state.region && forecast.isReady(state.layer, state.region, next)) void showFrame(next)
    else if (state.region) forecast.preload(state.layer, state.region, state.index)
    playTimer = window.setTimeout(tick, PLAY_INTERVAL_MS)
  }
  playTimer = window.setTimeout(tick, PLAY_INTERVAL_MS)
}

function stopPlay(): void {
  state.playing = false
  window.clearTimeout(playTimer)
  timebar.setPlaying(false)
}

document.querySelectorAll<HTMLButtonElement>('.seg-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const layer = btn.dataset.layer as LayerId
    if (layer === state.layer) return
    state.layer = layer
    setActiveLayer()
    void loadFrames(true)
  })
})

$('#status-retry').addEventListener('click', () => void loadFrames(true))
$('#recenter').addEventListener('click', () => map.setView(INITIAL_CENTER, INITIAL_ZOOM))

map.on('moveend', () => {
  const frames = forecast.frames
  if (!frames) return
  const region = chooseRegion(frames.meta.regions, map.getZoom(), map.getCenter())
  if (region?.id !== state.region?.id) void showFrame(state.index)
})

onModeChange((mode) => {
  wind.setMode(mode)
  waves.setMode(mode)
  land?.restyle()
  renderMeta()
})

setActiveLayer()
addLand(map)
  .then((l) => (land = l))
  .catch(() => undefined)
void loadFrames(false)

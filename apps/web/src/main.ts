// App: mapa de vento e ondas (6a), painel do ponto (6b), avisos oficiais,
// modal de segurança, idiomas, modo noturno e PWA (6c).
import 'leaflet/dist/leaflet.css'
import './style.css'
import { formatLocal } from '@mariners-compass/core'
import { ApiError, getNotices, type LayerId, type RegionInfo } from './api.ts'
import { Forecast } from './forecast.ts'
import { chooseRegion } from './grid-choice.ts'
import { applyI18n, detectLocale, getLocale, LOCALES, setLocale, t, type Locale, type MessageKey } from './i18n.ts'
import { compassRoseSvg, ICONS } from './icons.ts'
import { renderLegend } from './legend.ts'
import { renderNotices, type NoticesResponse } from './notices.ts'
import { createSafetyDialog, safetyAcknowledged } from './safety.ts'
import L from './leaflet-global.ts'
import { addLand, createMap, INITIAL_CENTER, INITIAL_ZOOM, PANES } from './map.ts'
import { isSpeedUnit } from './point-format.ts'
import { PointPanel } from './point-panel.ts'
import { readPref, writePref } from './prefs.ts'
import type { SpeedUnit } from './scales.ts'
import { cssVar, currentMode, onModeChange, setNightMode } from './theme.ts'
import { nearestFrame, TimeBar } from './timebar.ts'
import { WavesLayer } from './waves-layer.ts'
import { createWindLayer } from './wind-layer.ts'

/** Intervalo entre quadros no play (ms). */
const PLAY_INTERVAL_MS = 1500
/** Recarga dos avisos oficiais (ms). */
const NOTICES_REFRESH_MS = 15 * 60_000

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!

const storedLocale = readPref('lang')
setLocale(LOCALES.includes(storedLocale as Locale) ? (storedLocale as Locale) : detectLocale(navigator.languages ?? [navigator.language]))
if (readPref('mode') === 'night') setNightMode(true)
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
  unit: (isSpeedUnit(readPref('unit')) ? readPref('unit') : 'kn') as SpeedUnit,
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

/** Status do quadro: sem rede (dado salvo no aparelho), rodada antiga ou nada. */
function frameStatus(frames: NonNullable<Forecast['frames']>): void {
  if (!navigator.onLine) showStatus('status.offline', { run: runLabel(frames.meta.run_time) })
  else if (frames.meta.status === 'stale') showStatus('status.stale', { run: runLabel(frames.meta.run_time) })
  else showStatus(null)
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
  document.querySelectorAll<HTMLButtonElement>('.seg-btn[data-layer]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.layer === state.layer))
  })
  document.querySelectorAll<HTMLButtonElement>('.seg-btn[data-unit]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.unit === state.unit))
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
  // A camada é a do pedido: se o usuário trocar de camada no meio, a resposta é descartada.
  const layer = state.layer
  if (!region) return
  try {
    const file = await forecast.grid(layer, region, index)
    if (seq !== state.seq || layer !== state.layer) return
    if (layer === 'wind') wind.setData(file)
    else waves.setData(file)
    frameStatus(frames)
    forecast.preload(layer, region, index)
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
    // O pedido em curso é reaproveitado (Forecast.grid); se falhar, o play para e
    // o erro aparece com "Tentar de novo", em vez de congelar em silêncio.
    const region = state.region
    if (!region) return
    if (forecast.isReady(state.layer, region, next)) void showFrame(next)
    else {
      forecast.grid(state.layer, region, next).catch((err: unknown) => {
        if (!state.playing) return
        stopPlay()
        showStatus(errorKey(err), {}, true)
      })
    }
    if (state.playing) playTimer = window.setTimeout(tick, PLAY_INTERVAL_MS)
  }
  playTimer = window.setTimeout(tick, PLAY_INTERVAL_MS)
}

function stopPlay(): void {
  state.playing = false
  window.clearTimeout(playTimer)
  timebar.setPlaying(false)
}

document.querySelectorAll<HTMLButtonElement>('.seg-btn[data-layer]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const layer = btn.dataset.layer as LayerId
    if (layer === state.layer) return
    state.layer = layer
    setActiveLayer()
    void loadFrames(true)
  })
})

document.querySelectorAll<HTMLButtonElement>('.seg-btn[data-unit]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const unit = btn.dataset.unit
    if (!isSpeedUnit(unit) || unit === state.unit) return
    state.unit = unit
    writePref('unit', unit)
    renderMeta()
    panel.setUnit(unit)
  })
})

// Painel do ponto: toque no mapa pede o /point; o marcador fica na coordenada
// arredondada que a previsão usa (o toque original é só o pedido).
let marker: L.CircleMarker | null = null
const panel = new PointPanel($('#point-panel'), closePanel)

function closePanel(): void {
  panel.close()
  marker?.remove()
  marker = null
  $('#map').focus()
}

map.on('click', (e: L.LeafletMouseEvent) => {
  $('#tap-hint').hidden = true
  marker?.remove()
  marker = L.circleMarker(e.latlng, { pane: PANES.marker, radius: 8, weight: 3, className: 'mc-point-marker', interactive: false }).addTo(map)
  void panel.open(e.latlng.lat, e.latlng.lng, state.unit).then((point) => {
    if (point && marker) marker.setLatLng([point.lat, point.lon])
  })
})

// Teclado: Enter no mapa pede a previsão do centro.
$('#map').addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || e.target !== $('#map')) return
  map.fire('click', { latlng: map.getCenter() })
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
  syncChrome()
})

// Avisos oficiais (B3.3): carregam na abertura e a cada 15 min.
let notices: NoticesResponse | null = null
let noticesFailed = false
async function loadNotices(): Promise<void> {
  try {
    notices = await getNotices()
    noticesFailed = false
  } catch {
    noticesFailed = notices === null
  }
  renderNotices($('#notices'), notices, noticesFailed)
}
window.setInterval(() => void loadNotices(), NOTICES_REFRESH_MS)

// Modal de segurança: na primeira abertura e pelo link do rodapé.
const safety = createSafetyDialog()
$('#safety-open').addEventListener('click', () => safety.open())

/** Estado dos botões de idioma e de modo noturno e a cor da barra do navegador. */
function syncChrome(): void {
  document.querySelectorAll<HTMLButtonElement>('.seg-btn[data-lang]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.lang === getLocale()))
  })
  $('#night-toggle').setAttribute('aria-pressed', String(currentMode() === 'night'))
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    meta.content = cssVar('--surface') || meta.content
  })
}

document.querySelectorAll<HTMLButtonElement>('.seg-btn[data-lang]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const locale = btn.dataset.lang as Locale
    if (locale === getLocale()) return
    setLocale(locale)
    writePref('lang', locale)
    document.documentElement.lang = locale
    document.title = t('app.title')
    applyI18n(document)
    timebar.refreshText()
    panel.refreshText()
    safety.refreshText()
    renderMeta()
    renderNotices($('#notices'), notices, noticesFailed)
    syncChrome()
  })
})

$('#night-toggle').addEventListener('click', () => {
  const on = currentMode() !== 'night'
  writePref('mode', on ? 'night' : 'system')
  setNightMode(on)
})

window.addEventListener('online', () => forecast.frames && frameStatus(forecast.frames))
window.addEventListener('offline', () => forecast.frames && frameStatus(forecast.frames))

// PWA: Service Worker só no build de produção (no dev, o cache atrapalharia).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  })
}

syncChrome()
if (!safetyAcknowledged()) safety.open()
void loadNotices()
setActiveLayer()
addLand(map)
  .then((l) => (land = l))
  .catch(() => undefined)
void loadFrames(false)

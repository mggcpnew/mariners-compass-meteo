// Service Worker do PWA (AC-MVP-12, recomendado; offline não é prioridade).
// Só mesma origem e só GET. Estratégias:
// - páginas e /api/v1 (frames, notices, point): rede primeiro, cache como reserva
//   (sem rede, o app mostra o último dado salvo e avisa);
// - /api/v1/grid de rodada fechada: cache primeiro (arquivo imutável), com limite;
// - arquivos do app (/assets, /data, /icons): cache primeiro.
// Mudou este arquivo? Suba VERSION: os caches antigos são apagados na ativação.
const VERSION = 'v1'
const SHELL = `mc-shell-${VERSION}`
const DATA = `mc-data-${VERSION}`
const GRID = `mc-grid-${VERSION}`
const GRID_MAX_ENTRIES = 240
const DATA_MAX_ENTRIES = 60

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL)
      const html = await fetch('/', { cache: 'no-cache' })
      await cache.put('/', html.clone())
      // Arquivos com hash do build citados no index.html.
      const text = await html.text()
      const assets = [...text.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1])
      await cache.addAll([...new Set(assets), '/data/land.geojson', '/manifest.webmanifest', '/icons/icon.svg'])
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHELL, DATA, GRID])
      for (const key of await caches.keys()) if (key.startsWith('mc-') && !keep.has(key)) await caches.delete(key)
      await self.clients.claim()
    })(),
  )
})

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  for (const key of keys.slice(0, Math.max(0, keys.length - max))) await cache.delete(key)
}

async function networkFirst(request, cacheName, cacheKey = request, max = 0) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request)
    if (response.ok) {
      await cache.put(cacheKey, response.clone())
      if (max) await trim(cacheName, max)
    }
    return response
  } catch (err) {
    const cached = await cache.match(cacheKey)
    if (cached) return cached
    throw err
  }
}

async function cacheFirst(request, cacheName, max) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) {
    await cache.put(request, response.clone())
    if (max) await trim(cacheName, max)
  }
  return response
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    // Chave pelo caminho: "/?x=1" e "/" são a mesma página; /licenses/ tem a sua.
    event.respondWith(networkFirst(request, SHELL, url.pathname))
  } else if (url.pathname === '/api/v1/grid') {
    event.respondWith(cacheFirst(request, GRID, GRID_MAX_ENTRIES))
  } else if (url.pathname.startsWith('/api/v1/')) {
    event.respondWith(networkFirst(request, DATA, request, DATA_MAX_ENTRIES))
  } else if (/^\/(assets|data|icons)\//.test(url.pathname) || url.pathname === '/manifest.webmanifest') {
    event.respondWith(cacheFirst(request, SHELL))
  }
})

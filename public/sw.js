const CACHE = 'dronecalc-v2'

// HTML routes are NOT precached — always fetched from network so users
// always receive fresh markup. Only content-addressed static assets are cached.
const STATIC_PRECACHE = []

addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC_PRECACHE)).then(skipWaiting)
  )
})

addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => clients.claim())
  )
})

addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)
  if (url.origin !== location.origin) return

  // Only cache /_next/static/* — these are content-hashed and safe to cache forever.
  // HTML pages (/, /dashboard, /android) always go to network to ensure freshness.
  if (!url.pathname.startsWith('/_next/static/')) {
    // Network-only for HTML and other routes
    e.respondWith(fetch(e.request))
    return
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached
      return fetch(e.request).then((res) => {
        if (res.ok) {
          caches.open(CACHE).then((c) => c.put(e.request, res.clone()))
        }
        return res
      })
    })
  )
})

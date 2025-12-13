/**
 * Service Worker - Manejo de offline y caché
 * Estrategia: Cache First para assets, Network First para API calls
 */

const CACHE_NAME = 'soci-app-v1'
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.scss',
]

// Instalar service worker y cachear archivos
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    })
  )
})

// Activar service worker y limpiar cachés antigos
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Fetch event - Estrategia según el tipo de request
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event

  // Para API calls - Network First
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cachear respuestas exitosas
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Si falla, intenta obtener del caché
          return caches.match(request).then((response) => {
            if (response) {
              return response
            }
            // Si no está en caché, retorna respuesta offline
            return new Response(
              JSON.stringify({
                message: 'Estás offline. Algunos datos pueden no estar disponibles.',
              }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'application/json',
                }),
              }
            )
          })
        })
    )
    return
  }

  // Para archivos estáticos - Cache First
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response
      }
      return fetch(request).then((response) => {
        // No cachear respuestas que no sean exitosas
        if (!response || response.status !== 200 || response.type === 'error') {
          return response
        }
        // Cachear respuesta exitosa
        const responseClone = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone)
        })
        return response
      })
    })
  )
})

// Permitir que TypeScript reconozca el contexto de service worker
declare const self: ServiceWorkerGlobalScope

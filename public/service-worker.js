/**
 * Service Worker - Manejo de offline y caché para Vite
 * Estrategia optimizada para desarrollo
 */

const CACHE_NAME = 'soci-app-v2'
const RUNTIME_CACHE = 'soci-app-runtime-v2'

// Solo cachear el HTML en instalación
const urlsToCache = [
  '/',
]

// Instalar service worker y cachear archivos críticos
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cacheando archivos críticos')
        return cache.addAll(urlsToCache).catch((err) => {
          console.warn('[SW] Error cacheando algunos archivos:', err)
          // No fallar la instalación si algún archivo no se cachea
        })
      })
      .then(() => {
        console.log('[SW] Instalación completada')
        return self.skipWaiting() // Activar inmediatamente
      })
  )
})

// Activar service worker y limpiar cachés antiguos
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE
          })
          .map((cacheName) => {
            console.log('[SW] Eliminando caché antiguo:', cacheName)
            return caches.delete(cacheName)
          })
      )
    }).then(() => self.clients.claim()) // Tomar control inmediatamente
  )
})

// Fetch event - Estrategia según el tipo de request
self.addEventListener('fetch', (event) => {
  const { request } = event
  
  try {
    const url = new URL(request.url)

    // Ignorar requests que no son http/https
    if (!url.protocol.startsWith('http')) {
      return
    }

    // Ignorar chrome extensions y otros orígenes (excepto API ngrok)
    if (!url.origin.includes(self.location.origin) && !url.origin.includes('ngrok')) {
      return
    }

    // Ignorar completamente recursos de desarrollo de Vite
    if (url.pathname.startsWith('/@') || 
        url.pathname.startsWith('/__') || 
        url.pathname.includes('/node_modules') ||
        url.pathname.includes('@vite') ||
        url.pathname.includes('@react-refresh') ||
        url.pathname.includes('/src/') || // Archivos fuente
        url.pathname.endsWith('.tsx') ||
        url.pathname.endsWith('.ts') ||
        url.pathname.endsWith('.jsx') ||
        url.search.includes('?import') ||
        url.search.includes('?direct') ||
        url.search.includes('t=') ||
        request.method !== 'GET' ||
        request.destination === 'worker') {
      return
    }
  } catch (error) {
    // Si hay error parseando la URL, dejar pasar el request
    return
  }

  // Para API calls - Network First con fallback
  if (request.url.includes('/api/') || request.url.includes('ngrok')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // No cachear respuestas de error
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          console.log('[SW] Request de API falló, buscando en caché:', request.url)
          // Si falla, intenta obtener del caché
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log('[SW] Respuesta de caché:', request.url)
              return cachedResponse
            }
            // Si no está en caché, retorna respuesta offline
            return new Response(
              JSON.stringify({
                error: 'offline',
                message: 'Sin conexión. Los datos no están disponibles.',
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

  // Para navegación (HTML) - Siempre intentar network primero, luego caché
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cachear cada página HTML que se visite
          if (response && response.status === 200) {
            const responseClone = response.clone()
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put('/', responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Offline: servir última versión cacheada
          console.log('[SW] Offline - Sirviendo última versión desde caché')
          return caches.match('/').then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }
            // Si no hay nada en caché, crear una respuesta básica
            return new Response(
              '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Offline</title></head><body><h1>Sin conexión</h1><p>Recarga cuando tengas internet</p></body></html>',
              {
                status: 200,
                headers: { 'Content-Type': 'text/html' }
              }
            )
          })
        })
    )
    return
  }

  // Para otros recursos - Solo cachear en producción (archivos con hash)
  const hasHash = /\.[a-f0-9]{8}\.(js|css)$/i.test(request.url)
  
  if (hasHash) {
    // Archivos con hash: Cache First (nunca cambian)
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone()
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
      })
    )
  } else {
    // Otros archivos: Network Only (no cachear en desarrollo)
    event.respondWith(
      fetch(request).catch(() => {
        // Si falla y es una imagen, retornar placeholder
        if (/\.(png|jpg|jpeg|gif|svg|ico)$/i.test(request.url)) {
          return new Response('', {
            status: 200,
            headers: { 'Content-Type': 'image/svg+xml' }
          })
        }
        return new Response('Offline', { status: 503 })
      })
    )
  }
})

// Manejo de mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        )
      })
    )
  }
})

console.log('[SW] Service Worker cargado correctamente')

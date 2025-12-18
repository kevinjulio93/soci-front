/**
 * Service Worker con TypeScript
 * Manejo de offline y caché optimizado para Vite + React
 */

/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope

// Configuración de caché
const CACHE_CONFIG = {
  static: 'soci-app-static-v5',
  runtime: 'soci-app-runtime-v5',
}

// URLs críticas para cachear en instalación
const CRITICAL_URLS = [
  '/',
  '/index.html',
]

// Helpers
function isHttpRequest(url: URL): boolean {
  return url.protocol.startsWith('http')
}

function isOwnOrigin(url: URL): boolean {
  return url.origin.includes(self.location.origin) || url.origin.includes('ngrok')
}

function isViteDevResource(url: URL, request: Request): boolean {
  const isDev = url.hostname === 'localhost' || url.hostname.includes('127.0.0.1')
  
  // En desarrollo, no cachear recursos de Vite HMR
  if (isDev) {
    return (
      url.pathname.startsWith('/@') ||
      url.pathname.startsWith('/__') ||
      url.pathname.includes('/node_modules') ||
      url.pathname.includes('@vite') ||
      url.pathname.includes('@react-refresh') ||
      url.pathname.includes('/src/') || // No cachear archivos fuente en dev
      url.search.includes('?import') ||
      url.search.includes('?direct') ||
      url.search.includes('t=') ||
      request.method !== 'GET' ||
      request.destination === 'worker'
    )
  }
  
  // En producción, solo excluir workers y métodos no-GET
  return (
    request.method !== 'GET' ||
    request.destination === 'worker'
  )
}

function isApiRequest(url: URL): boolean {
  return url.pathname.includes('/api/') || url.hostname.includes('ngrok')
}

function hasHashInFilename(url: URL): boolean {
  return /\.[a-f0-9]{8}\.(js|css)$/i.test(url.pathname)
}

function isImageRequest(url: URL): boolean {
  return /\.(png|jpg|jpeg|gif|svg|ico)$/i.test(url.pathname)
}

// Install event - Cachear recursos críticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_CONFIG.static)
      
      try {
        await cache.addAll(CRITICAL_URLS)
      } catch (err) {
        // Intentar cachear uno por uno si falla el batch
        for (const url of CRITICAL_URLS) {
          try {
            await cache.add(url)
          } catch (e) {
            // Error silencioso
          }
        }
      }
      return self.skipWaiting()
    })()
  )
})

// Activate event - Limpiar cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return (
                cacheName !== CACHE_CONFIG.static &&
                cacheName !== CACHE_CONFIG.runtime
              )
            })
            .map((cacheName) => {
              return caches.delete(cacheName)
            })
        )
      })
      .then(() => self.clients.claim())
  )
})

// Fetch event - Estrategias de caché según tipo de recurso
self.addEventListener('fetch', (event) => {
  const { request } = event

  try {
    const url = new URL(request.url)

    // Ignorar requests no HTTP
    if (!isHttpRequest(url)) return

    // Ignorar orígenes externos (excepto API)
    if (!isOwnOrigin(url)) return

    // Ignorar recursos de desarrollo de Vite
    if (isViteDevResource(url, request)) return

    // Estrategia para API: Network First con fallback a caché
    if (isApiRequest(url)) {
      event.respondWith(handleApiRequest(request))
      return
    }

    // Estrategia para navegación: Network First
    if (request.mode === 'navigate') {
      event.respondWith(handleNavigationRequest(request))
      return
    }

    // Estrategia para recursos con hash: Cache First
    if (hasHashInFilename(url)) {
      event.respondWith(handleHashedResourceRequest(request))
      return
    }

    // Otros recursos: Network First con fallback
    event.respondWith(handleOtherResourceRequest(request))
  } catch (error) {
    // Error silencioso
  }
})

// Estrategia Network First para API
async function handleApiRequest(request: Request): Promise<Response> {
  try {
    const response = await fetch(request)
    
    if (response.ok) {
      const cache = await caches.open(CACHE_CONFIG.runtime)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Respuesta offline genérica
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
  }
}

// Estrategia Network First para navegación
async function handleNavigationRequest(request: Request): Promise<Response> {
  try {
    const response = await fetch(request)
    
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_CONFIG.runtime)
      // Cachear tanto la URL específica como la raíz
      cache.put(request, response.clone())
      cache.put('/', response.clone())
    }
    
    return response
  } catch (error) {
    // Intentar primero con la URL específica, luego con la raíz
    let cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    cachedResponse = await caches.match('/')
    if (cachedResponse) {
      return cachedResponse
    }
    
    cachedResponse = await caches.match('/index.html')
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Página offline básica como último recurso
    return new Response(
      '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Offline</title></head><body><h1>Sin conexión</h1><p>Recarga cuando tengas internet</p></body></html>',
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }
    )
  }
}

// Estrategia Cache First para recursos con hash
async function handleHashedResourceRequest(request: Request): Promise<Response> {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const response = await fetch(request)
    
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_CONFIG.runtime)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    return new Response('Resource not available', { status: 503 })
  }
}

// Estrategia Network First con cache para otros recursos
async function handleOtherResourceRequest(request: Request): Promise<Response> {
  try {
    const response = await fetch(request)
    
    // Cachear recursos exitosos (JS, CSS, fuentes, imágenes)
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_CONFIG.runtime)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    // Intentar servir desde caché
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    const requestUrl = new URL(request.url)
    
    // Placeholder para imágenes
    if (isImageRequest(requestUrl)) {
      return new Response('', {
        status: 200,
        headers: { 'Content-Type': 'image/svg+xml' },
      })
    }
    
    return new Response('Offline', { status: 503 })
  }
}

// Message event - Manejo de mensajes del cliente
self.addEventListener('message', (event) => {
  const data = event.data

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
      })
    )
  }

  if (data.type === 'CACHE_CURRENT_PAGE') {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(CACHE_CONFIG.runtime)
        const urlsToCache = data.urls || []
        
        for (const url of urlsToCache) {
          try {
            const response = await fetch(url)
            if (response && response.ok) {
              await cache.put(url, response)
            }
          } catch (error) {
            // Error silencioso
          }
        }
      })()
    )
  }
})

// Export vacio para que TypeScript lo trate como módulo
export {}

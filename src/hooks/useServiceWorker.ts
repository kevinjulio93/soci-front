/**
 * Hook para registrar y manejar el Service Worker
 * Activación: Funciona offline con caché
 */

import { useEffect } from 'react'

// Helper para precachear recursos de la página actual
const precacheCurrentPageResources = () => {
  if (!navigator.serviceWorker.controller) return

  // Obtener todos los recursos cargados en la página
  const resources: string[] = []
  
  // Scripts
  document.querySelectorAll('script[src]').forEach((script) => {
    const src = (script as HTMLScriptElement).src
    if (src && !src.includes('/@') && !src.includes('node_modules')) {
      resources.push(src)
    }
  })
  
  // Estilos
  document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    const href = (link as HTMLLinkElement).href
    if (href && !href.includes('/@')) {
      resources.push(href)
    }
  })
  
  // Imágenes
  document.querySelectorAll('img[src]').forEach((img) => {
    const src = (img as HTMLImageElement).src
    if (src && !src.startsWith('data:')) {
      resources.push(src)
    }
  })
  
  // Página actual
  resources.push(window.location.href)
  resources.push('/')
  resources.push('/index.html')
  
  // Enviar mensaje al service worker para cachear
  navigator.serviceWorker.controller.postMessage({
    type: 'CACHE_CURRENT_PAGE',
    urls: [...new Set(resources)], // Eliminar duplicados
  })
  
  console.log('[App] Solicitando precacheo de recursos:', resources.length)
}

export function useServiceWorker() {
  useEffect(() => {
    // Verificar si el navegador soporta service workers
    if (!('serviceWorker' in navigator)) {
      console.warn('[App] Service Workers no soportados en este navegador')
      return
    }

    // Registrar service worker
    const registerServiceWorker = async () => {
      try {
        console.log('[App] Registrando Service Worker...')
        // Siempre usar /service-worker.js (servido por el plugin en dev, compilado en prod)
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/',
        })

        console.log('[App] Service Worker registrado exitosamente:', registration.scope)

        // Verificar si hay un SW activo
        if (registration.active) {
          console.log('[App] Service Worker activo:', registration.active.state)
        }

        // Escuchar actualizaciones
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          console.log('[App] Nueva versión del Service Worker encontrada')
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              console.log('[App] Service Worker estado:', newWorker.state)
              
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Hay una nueva versión disponible
                console.log('[App] Nueva versión disponible. Considera recargar.')
              }
              
              if (newWorker.state === 'activated') {
                console.log('[App] Nueva versión activada')
              }
            })
          }
        })

        // Verificar actualizaciones cada hora
        setInterval(() => {
          registration.update()
        }, 60 * 60 * 1000)

        // Precachear recursos cuando el service worker esté activo
        if (registration.active) {
          // Esperar un poco para que la página termine de cargar
          setTimeout(() => {
            precacheCurrentPageResources()
          }, 2000)
        }

      } catch (error) {
        console.error('[App] Error registrando Service Worker:', error)
      }
    }
    
    // Precachear recursos cuando cambie la ruta
    const handleRouteChange = () => {
      setTimeout(() => {
        precacheCurrentPageResources()
      }, 1000)
    }
    
    window.addEventListener('popstate', handleRouteChange)

    // Esperar a que la página esté completamente cargada
    if (document.readyState === 'complete') {
      registerServiceWorker()
    } else {
      window.addEventListener('load', registerServiceWorker)
      return () => {
        window.removeEventListener('load', registerServiceWorker)
        window.removeEventListener('popstate', handleRouteChange)
      }
    }
  }, [])
}

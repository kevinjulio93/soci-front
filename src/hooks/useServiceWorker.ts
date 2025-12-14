/**
 * Hook para registrar y manejar el Service Worker
 * Activación: Funciona offline con caché
 */

import { useEffect } from 'react'

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

      } catch (error) {
        console.error('[App] Error registrando Service Worker:', error)
      }
    }

    // Esperar a que la página esté completamente cargada
    if (document.readyState === 'complete') {
      registerServiceWorker()
    } else {
      window.addEventListener('load', registerServiceWorker)
      return () => {
        window.removeEventListener('load', registerServiceWorker)
      }
    }
  }, [])
}

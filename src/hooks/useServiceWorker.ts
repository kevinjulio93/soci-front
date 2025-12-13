/**
 * Hook para registrar y manejar el Service Worker
 * Activación: Funciona offline con caché
 */

import { useEffect } from 'react'

export function useServiceWorker() {
  useEffect(() => {
    // Verificar si el navegador soporta service workers
    if (!('serviceWorker' in navigator)) {
      return
    }

    // Registrar service worker
    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/',
        })

        // Escuchar actualizaciones
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                // Notificar al usuario que hay una nueva versión (opcional)
                window.location.reload()
              }
            })
          }
        })
      } catch (error) {
        // Error registrando Service Worker
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

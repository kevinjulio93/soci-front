/**
 * useOnlineStatus - Hook para detectar estado de conexión
 * Devuelve true si hay conexión, false si está offline
 */

import { useState, useEffect } from 'react'

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => {
      console.log('Conexión restaurada')
      setIsOnline(true)
    }

    const handleOffline = () => {
      console.log('Conexión perdida - modo offline activado')
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

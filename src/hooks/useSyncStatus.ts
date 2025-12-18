/**
 * useSyncStatus - Hook para gestionar sincronización
 * Proporciona estado y funciones para sincronizar datos offline
 */

import { useState, useEffect, useCallback } from 'react'
import { syncService } from '../services/sync.service'
import { useOnlineStatus } from './useOnlineStatus'

export function useSyncStatus() {
  const isOnline = useOnlineStatus()
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncError, setLastSyncError] = useState<string | null>(null)

  const updatePendingCount = useCallback(async () => {
    try {
      const count = await syncService.getPendingCount()
      setPendingCount(count)
    } catch (error) {
      // Error silencioso
    }
  }, [])

  const manualSync = useCallback(async () => {
    if (!isOnline) {
      setLastSyncError('No hay conexión a internet')
      return
    }

    if (isSyncing) {
      return
    }

    setIsSyncing(true)
    setLastSyncError(null)

    try {
      const results = await syncService.syncPendingRespondents()
      
      if (results.failed > 0) {
        setLastSyncError(`${results.failed} encuestas fallaron: ${results.errors.join(', ')}`)
      }

      await updatePendingCount()
      
      return results
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error de sincronización'
      setLastSyncError(errorMessage)
    } finally {
      setIsSyncing(false)
    }
  }, [isOnline, isSyncing, updatePendingCount])

  // Actualizar conteo al montar y cuando cambia conexión
  useEffect(() => {
    updatePendingCount()
  }, [updatePendingCount])

  // Auto-sincronizar cuando se recupera la conexión
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      setTimeout(() => {
        manualSync()
      }, 2000) // Esperar 2 segundos para estabilidad
    }
  }, [isOnline, pendingCount, manualSync])

  return {
    isOnline,
    pendingCount,
    isSyncing,
    lastSyncError,
    manualSync,
    updatePendingCount
  }
}

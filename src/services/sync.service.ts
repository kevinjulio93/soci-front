/**
 * Sync Service - Servicio de sincronización offline-online
 * Sincroniza encuestas guardadas localmente con el backend
 */

import { apiService } from './api.service'
import { indexedDBService } from './indexedDB.service'

class SyncService {
  private isSyncing = false
  private syncInterval: number | null = null

  async syncPendingRespondents(): Promise<{
    success: number
    failed: number
    errors: string[]
  }> {
    if (this.isSyncing) {
      return { success: 0, failed: 0, errors: [] }
    }

    this.isSyncing = true
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    try {
      const pendingRespondents = await indexedDBService.getPendingRespondents()
      
      if (pendingRespondents.length === 0) {
        return results
      }

      for (const pending of pendingRespondents) {
        try {
          // 1. Crear el respondent en el backend
          const response = await apiService.createRespondent(pending.data)
          const respondentId = response.data._id

          // 2. Si hay audio, subirlo
          const audioBlob = await indexedDBService.getAudioBlob(pending.id)
          if (audioBlob && respondentId) {
            try {
              await apiService.uploadAudio(respondentId, audioBlob)
            } catch (audioError) {
              // Continuar aunque falle el audio
            }
          }

          // 3. Marcar como sincronizado
          await indexedDBService.markAsSynced(pending.id)
          results.success++

        } catch (error) {
          results.failed++
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
          results.errors.push(`${pending.id}: ${errorMessage}`)
          
          await indexedDBService.updateSyncError(pending.id, errorMessage)
        }
      }

      // Limpiar registros sincronizados exitosamente
      if (results.success > 0) {
        await indexedDBService.clearSyncedRespondents()
      }

    } catch (error) {
      // Error silencioso
    } finally {
      this.isSyncing = false
    }

    return results
  }

  startAutoSync(intervalMinutes: number = 5): void {
    if (this.syncInterval) {
      return
    }

    const intervalMs = intervalMinutes * 60 * 1000
    
    this.syncInterval = setInterval(async () => {
      if (navigator.onLine) {
        await this.syncPendingRespondents()
      }
    }, intervalMs)
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  async getPendingCount(): Promise<number> {
    const pending = await indexedDBService.getPendingRespondents()
    return pending.length
  }

  getIsSyncing(): boolean {
    return this.isSyncing
  }
}

export const syncService = new SyncService()

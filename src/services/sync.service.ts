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
      console.log('Sincronización ya en progreso')
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
        console.log('No hay encuestas pendientes de sincronización')
        return results
      }

      console.log(`Sincronizando ${pendingRespondents.length} encuestas pendientes...`)

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
              console.log(`Audio sincronizado para respondent ${respondentId}`)
            } catch (audioError) {
              console.error(`Error al subir audio para ${respondentId}:`, audioError)
              // Continuar aunque falle el audio
            }
          }

          // 3. Marcar como sincronizado
          await indexedDBService.markAsSynced(pending.id)
          results.success++
          console.log(`Encuesta ${pending.id} sincronizada exitosamente`)

        } catch (error) {
          results.failed++
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
          results.errors.push(`${pending.id}: ${errorMessage}`)
          
          await indexedDBService.updateSyncError(pending.id, errorMessage)
          console.error(`Error al sincronizar ${pending.id}:`, error)
        }
      }

      // Limpiar registros sincronizados exitosamente
      if (results.success > 0) {
        await indexedDBService.clearSyncedRespondents()
        console.log(`${results.success} encuestas sincronizadas y limpiadas`)
      }

    } catch (error) {
      console.error('Error en proceso de sincronización:', error)
    } finally {
      this.isSyncing = false
    }

    return results
  }

  startAutoSync(intervalMinutes: number = 5): void {
    if (this.syncInterval) {
      console.log('Auto-sincronización ya está activa')
      return
    }

    const intervalMs = intervalMinutes * 60 * 1000
    
    this.syncInterval = setInterval(async () => {
      if (navigator.onLine) {
        console.log('Ejecutando auto-sincronización...')
        await this.syncPendingRespondents()
      }
    }, intervalMs)

    console.log(`Auto-sincronización iniciada (cada ${intervalMinutes} minutos)`)
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
      console.log('Auto-sincronización detenida')
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

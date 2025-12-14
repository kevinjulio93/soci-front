/**
 * IndexedDB Service - Manejo de almacenamiento local offline
 * Almacena encuestas pendientes de sincronización
 */

interface RespondentData {
  fullName: string
  idType: string
  identification: string
  email?: string
  phone?: string
  address?: string
  gender?: string
  ageRange?: string
  region?: string
  department?: string
  city?: string
  stratum?: string
  neighborhood?: string
}

interface PendingRespondent {
  id: string
  data: RespondentData
  audioBlob?: Blob
  timestamp: number
  synced: boolean
  error?: string
}

class IndexedDBService {
  private dbName = 'SociAppDB'
  private version = 1
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Object store para respondents pendientes
        if (!db.objectStoreNames.contains('pendingRespondents')) {
          const store = db.createObjectStore('pendingRespondents', { keyPath: 'id' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('synced', 'synced', { unique: false })
        }

        // Object store para audio blobs
        if (!db.objectStoreNames.contains('audioBlobs')) {
          db.createObjectStore('audioBlobs', { keyPath: 'id' })
        }
      }
    })
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init()
    }
    return this.db!
  }

  async savePendingRespondent(data: RespondentData, audioBlob?: Blob): Promise<string> {
    const db = await this.ensureDB()
    const id = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingRespondents', 'audioBlobs'], 'readwrite')
      
      const respondentStore = transaction.objectStore('pendingRespondents')
      const pendingData: PendingRespondent = {
        id,
        data,
        timestamp: Date.now(),
        synced: false
      }

      const respondentRequest = respondentStore.add(pendingData)

      // Guardar audio si existe
      if (audioBlob) {
        const audioStore = transaction.objectStore('audioBlobs')
        audioStore.add({ id, blob: audioBlob })
      }

      transaction.oncomplete = () => resolve(id)
      transaction.onerror = () => reject(transaction.error)
      respondentRequest.onerror = () => reject(respondentRequest.error)
    })
  }

  async getPendingRespondents(): Promise<PendingRespondent[]> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('pendingRespondents', 'readonly')
      const store = transaction.objectStore('pendingRespondents')
      const request = store.getAll()

      request.onsuccess = () => {
        // Filtrar manualmente los no sincronizados
        const allRecords = request.result
        const pending = allRecords.filter(record => record.synced === false)
        resolve(pending)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getAudioBlob(id: string): Promise<Blob | null> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('audioBlobs', 'readonly')
      const store = transaction.objectStore('audioBlobs')
      const request = store.get(id)

      request.onsuccess = () => {
        const result = request.result
        resolve(result ? result.blob : null)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async markAsSynced(id: string): Promise<void> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingRespondents', 'audioBlobs'], 'readwrite')
      const respondentStore = transaction.objectStore('pendingRespondents')
      
      const getRequest = respondentStore.get(id)
      
      getRequest.onsuccess = () => {
        const record = getRequest.result
        if (record) {
          record.synced = true
          const updateRequest = respondentStore.put(record)
          
          updateRequest.onsuccess = () => {
            // Eliminar audio blob después de sincronizar
            const audioStore = transaction.objectStore('audioBlobs')
            audioStore.delete(id)
          }
        }
      }

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }

  async updateSyncError(id: string, error: string): Promise<void> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('pendingRespondents', 'readwrite')
      const store = transaction.objectStore('pendingRespondents')
      
      const getRequest = store.get(id)
      
      getRequest.onsuccess = () => {
        const record = getRequest.result
        if (record) {
          record.error = error
          store.put(record)
        }
      }

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }

  async deletePendingRespondent(id: string): Promise<void> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingRespondents', 'audioBlobs'], 'readwrite')
      
      transaction.objectStore('pendingRespondents').delete(id)
      transaction.objectStore('audioBlobs').delete(id)

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }

  async getAllRespondents(): Promise<PendingRespondent[]> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('pendingRespondents', 'readonly')
      const store = transaction.objectStore('pendingRespondents')
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async clearSyncedRespondents(): Promise<void> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('pendingRespondents', 'readwrite')
      const store = transaction.objectStore('pendingRespondents')
      const request = store.openCursor()

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          // Solo eliminar los sincronizados
          if (cursor.value.synced === true) {
            cursor.delete()
          }
          cursor.continue()
        }
      }

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }
}

export const indexedDBService = new IndexedDBService()

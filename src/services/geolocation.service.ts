/**
 * Servicio de Geolocalización
 * Maneja el tracking y envío de ubicación en tiempo real
 */

import { apiService } from './api.service'

interface GeolocationPosition {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

interface GeolocationError {
  code: number
  message: string
}

class GeolocationService {
  private watchId: number | null = null
  private intervalId: number | null = null
  private isTracking: boolean = false
  private lastPosition: GeolocationPosition | null = null

  /**
   * Iniciar tracking de ubicación
   */
  startTracking(intervalMs: number = 30000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocalización no soportada en este navegador'))
        return
      }

      if (this.isTracking) {
        console.log('[Geolocation] Ya está en tracking')
        resolve()
        return
      }

      this.isTracking = true

      // Configuración de opciones de geolocalización
      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }

      // Obtener posición inicial
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('[Geolocation] Posición inicial obtenida')
          this.lastPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          }
          this.sendLocationToServer(this.lastPosition)
          resolve()
        },
        (error) => {
          console.error('[Geolocation] Error obteniendo posición inicial:', error)
          this.isTracking = false
          reject(this.mapGeolocationError(error))
        },
        options
      )

      // Iniciar watch para actualizaciones continuas de posición
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          this.lastPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          }
          console.log('[Geolocation] Posición actualizada:', this.lastPosition)
        },
        (error) => this.handlePositionError(error),
        options
      )

      // Configurar intervalo para enviar ubicación periódicamente
      this.intervalId = window.setInterval(() => {
        if (this.lastPosition) {
          console.log('[Geolocation] Enviando ubicación periódica')
          this.sendLocationToServer(this.lastPosition)
        }
      }, intervalMs)

      console.log('[Geolocation] Tracking iniciado con intervalo de', intervalMs, 'ms')
    })
  }

  /**
   * Detener tracking de ubicación
   */
  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isTracking = false
    this.lastPosition = null
    console.log('[Geolocation] Tracking detenido')
  }

  /**
   * Obtener estado actual del tracking
   */
  getTrackingStatus(): boolean {
    return this.isTracking
  }



  /**
   * Manejar error de geolocalización
   */
  private handlePositionError(error: GeolocationPositionError): void {
    console.error('[Geolocation] Error en tracking:', error)
    
    const mappedError = this.mapGeolocationError(error)
    
    // Emitir evento personalizado para que la UI pueda manejarlo
    window.dispatchEvent(
      new CustomEvent('geolocation-error', {
        detail: mappedError,
      })
    )
  }

  /**
   * Mapear errores de geolocalización
   */
  private mapGeolocationError(error: GeolocationPositionError): GeolocationError {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return {
          code: 1,
          message: 'Permiso de ubicación denegado. Por favor, habilita los permisos de ubicación.',
        }
      case error.POSITION_UNAVAILABLE:
        return {
          code: 2,
          message: 'Ubicación no disponible. Verifica tu conexión GPS.',
        }
      case error.TIMEOUT:
        return {
          code: 3,
          message: 'Tiempo de espera agotado al obtener ubicación.',
        }
      default:
        return {
          code: 0,
          message: 'Error desconocido al obtener ubicación.',
        }
    }
  }

  /**
   * Enviar ubicación al servidor
   */
  private async sendLocationToServer(location: GeolocationPosition): Promise<void> {
    try {
      // Obtener userId del localStorage
      const userString = localStorage.getItem('soci_user')
      if (!userString) {
        console.error('[Geolocation] No se encontró información del usuario')
        return
      }

      const user = JSON.parse(userString)
      if (!user || !user.id) {
        console.error('[Geolocation] ID de usuario no disponible')
        return
      }

      await apiService.updateLocation({
        userId: user.id,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
      })
    } catch (error) {
      console.error('[Geolocation] Error al enviar ubicación al servidor:', error)
      throw error
    }
  }

  /**
   * Obtener posición actual una sola vez (sin tracking)
   */
  async getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocalización no soportada'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          })
        },
        (error) => {
          reject(this.mapGeolocationError(error))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    })
  }

  /**
   * Verificar si los permisos de ubicación están concedidos
   */
  async checkPermissions(): Promise<PermissionState> {
    if (!('permissions' in navigator)) {
      return 'prompt'
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' })
      return permission.state
    } catch (error) {
      console.warn('[Geolocation] No se pudo verificar permisos:', error)
      return 'prompt'
    }
  }
}

export const geolocationService = new GeolocationService()

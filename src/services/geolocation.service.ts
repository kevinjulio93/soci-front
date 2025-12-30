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
          console.error('❌ GeolocationService: Error obteniendo posición inicial:', error)
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

        },
        (error) => this.handlePositionError(error),
        options
      )

      // Configurar intervalo para enviar ubicación periódicamente
      this.intervalId = window.setInterval(() => {
        if (this.lastPosition) {

          this.sendLocationToServer(this.lastPosition)
        } else {
          console.warn('⏰ GeolocationService: Intervalo disparado pero no hay posición disponible')
        }
      }, intervalMs)
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
        console.warn('📍 GeolocationService: No se encontró usuario en localStorage')
        return
      }

      const user = JSON.parse(userString)
      // El backend devuelve _id, no id
      const userId = user?.id || user?._id
      if (!userId) {
        console.warn('📍 GeolocationService: Usuario sin ID válido', user)
        return
      }

      const locationData = {
        userId: userId,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
      }
      
      const result = await apiService.updateLocation(locationData)
      console.log('✅ GeolocationService: Ubicación enviada exitosamente:', result)
    } catch (error) {
      console.error('❌ GeolocationService: Error al enviar ubicación:', error)
      // Error silencioso para no interrumpir el tracking
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
      return 'prompt'
    }
  }
}

export const geolocationService = new GeolocationService()

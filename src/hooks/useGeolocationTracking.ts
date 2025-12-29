/* eslint-disable react-hooks/set-state-in-effect */
/**
 * Hook para tracking de geolocalización en tiempo real
 * Solo para usuarios con rol de socializador
 */

import { useEffect, useState } from 'react'
import { geolocationService } from '../services/geolocation.service'
import { useAuth } from '../contexts/AuthContext'

export interface UseGeolocationTrackingOptions {
  enabled?: boolean
  intervalMs?: number
}

export interface GeolocationState {
  isTracking: boolean
  error: string | null
  permissionState: PermissionState | null
}

export function useGeolocationTracking(options: UseGeolocationTrackingOptions = {}) {
  const { enabled = true, intervalMs = 30000 } = options
  const { user } = useAuth()
  const [state, setState] = useState<GeolocationState>({
    isTracking: false,
    error: null,
    permissionState: null,
  })

  // Verificar permisos al montar
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const permission = await geolocationService.checkPermissions()
        setState((prev) => ({ ...prev, permissionState: permission }))
      } catch (error) {
        // Error verificando permisos
      }
    }

    checkPermission()
  }, [])

  // Manejar errores de geolocalización
  useEffect(() => {
    const handleGeolocationError = (event: CustomEvent) => {
      const error = event.detail
      setState((prev) => ({
        ...prev,
        error: error.message,
        isTracking: false,
      }))
    }

    window.addEventListener('geolocation-error', handleGeolocationError as EventListener)

    return () => {
      window.removeEventListener('geolocation-error', handleGeolocationError as EventListener)
    }
  }, [])

  // Iniciar/detener tracking según configuración y rol de usuario
  useEffect(() => {
    // Solo iniciar tracking si:
    // 1. El tracking está habilitado
    // 2. El usuario está autenticado
    // 3. El usuario tiene rol de socializador (sociologist o similar)
    const shouldTrack = enabled && user && (
      user.role?.role === 'sociologist' || 
      user.role?.role === 'socializer'
    )

    console.log('🎯 useGeolocationTracking: Evaluando tracking:', {
      enabled,
      hasUser: !!user,
      userRole: user?.role?.role,
      shouldTrack,
      intervalMs
    })

    if (shouldTrack) {
      console.log('▶️ useGeolocationTracking: Iniciando tracking...')
      geolocationService
        .startTracking(intervalMs)
        .then(() => {
          console.log('✅ useGeolocationTracking: Tracking iniciado exitosamente')
          setState((prev) => ({
            ...prev,
            isTracking: true,
            error: null,
          }))
        })
        .catch((error) => {
          console.error('❌ useGeolocationTracking: Error al iniciar tracking:', error)
          setState((prev) => ({
            ...prev,
            isTracking: false,
            error: error.message || 'Error al iniciar tracking de ubicación',
          }))
        })
    } else {
      // Detener tracking si las condiciones ya no se cumplen
      if (geolocationService.getTrackingStatus()) {
        console.log('⏹️ useGeolocationTracking: Deteniendo tracking')
        geolocationService.stopTracking()
        setState((prev) => ({
          ...prev,
          isTracking: false,
        }))
      }
    }

    // Cleanup al desmontar
    return () => {
      if (geolocationService.getTrackingStatus()) {
        geolocationService.stopTracking()
      }
    }
  }, [enabled, user, intervalMs])

  return state
}

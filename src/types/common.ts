/**
 * Common Types - Tipos compartidos en toda la aplicación
 * Centraliza tipos reutilizables para evitar duplicación
 */

// Tipo unificado para razones de rechazo/no respuesta
export interface RejectionReason {
  value: string
  label: string
}

export type RejectionReasonValue = RejectionReason | string | null | undefined

// Tipo para estados de encuesta
export type SurveyStatus = 'successful' | 'unsuccessful'

// Tipo para roles del sistema
export type UserRole = 'admin' | 'coordinator' | 'socializer' | 'readonly' | 'root'

// Tipo para estados de permisos
export type PermissionState = 'granted' | 'denied' | 'prompt'

// Tipo para filtros de mapas
export type MapFilterType = 'all' | 'successful' | 'unsuccessful'

// Tipo para coordenadas geográficas
export interface Coordinates {
  latitude: number
  longitude: number
  accuracy?: number
  timestamp?: string
  speed?: number | null
  heading?: number | null
}

// Tipo para ubicación GeoJSON
export interface GeoLocation {
  type: 'Point'
  coordinates: [number, number] // [longitude, latitude]
}

// Tipo para stats generales
export interface Stats {
  total: number
  successful: number
  unsuccessful: number
}

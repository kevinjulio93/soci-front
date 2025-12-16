/**
 * URLs - Constantes de URLs externas
 * Centraliza URLs de recursos externos
 */

export const EXTERNAL_URLS = {
  // Videos
  VIDEO_TUTORIAL: import.meta.env.VITE_VIDEO_TUTORIAL_URL || 'https://www.youtube.com/embed/vVy9Lgpg1m8?si=0Jr7F2YQh58n9JMF',
  
  // API
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://82f60cf02a72.ngrok-free.app/api/v1',
} as const

/**
 * API Endpoints - Constantes de endpoints de API
 * Centraliza todas las rutas de API
 */
export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/auth/login',
  AUTH_LOGOUT: '/auth/logout',
  
  // Respondents
  RESPONDENTS: '/respondents',
  RESPONDENT_BY_ID: (id: string) => `/respondents/${id}`,
  UPLOAD_AUDIO: '/respondents/upload-audio',
  
  // Socializers
  SOCIALIZERS: '/socializers',
  SOCIALIZER_BY_ID: (id: string) => `/socializers/${id}`,
  
  // Roles
  ROLES: '/roles',
  
  // Location
  LOCATIONS: '/locations',
  LOCATION_LATEST: (userId: string) => `/locations/${userId}/latest`,
} as const

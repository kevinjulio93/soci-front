/**
 * URLs - Constantes de URLs externas
 * Centraliza URLs de recursos externos
 */

export const EXTERNAL_URLS = {
  // Videos
  VIDEO_TUTORIAL: import.meta.env.VITE_VIDEO_TUTORIAL_URL || 'https://res.cloudinary.com/dfnlxed2w/video/upload/v1766900429/video_qzcjjq.mp4',
  
  // API
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://82f60cf02a72.ngrok-free.app/api/v1',
  
  // API Externa - Colombia
  COLOMBIA_API_BASE_URL: 'https://api-colombia.com/api/v1',
  
  // Mapas - Leaflet
  LEAFLET_TILE_URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  LEAFLET_ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  LEAFLET_MARKER_ICON: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  LEAFLET_MARKER_ICON_2X: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  LEAFLET_MARKER_SHADOW: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  
  // Google Maps
  GOOGLE_MAPS_BASE: 'https://www.google.com/maps',
  GOOGLE_MAPS_QUERY: (lat: number, lng: number) => `${EXTERNAL_URLS.GOOGLE_MAPS_BASE}?q=${lat},${lng}`,
  
  // WhatsApp
  WHATSAPP_GROUP_LINK: 'https://group.wha.link/eV76Wa',
  WHATSAPP_QR_CODE: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://group.wha.link/eV76Wa',
} as const

/**
 * API Endpoints - Constantes de endpoints de API
 * Centraliza todas las rutas de API
 */
export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/auth/login',
  AUTH_LOGOUT: '/auth/logout',
  USER_PROFILE: '/users/profile',
  
  // Respondents
  RESPONDENTS: '/respondents',
  RESPONDENT_BY_ID: (id: string) => `/respondents/${id}`,
  UPLOAD_AUDIO: '/respondents/upload-audio',
  RESPONDENTS_STATS_TOTAL: '/respondents/stats/total',
  RESPONDENTS_STATS_TOP_SOCIALIZERS: (limit: number = 10) => `/respondents/stats/top-socializers?limit=${limit}`,
  RESPONDENTS_REPORTS_BY_SOCIALIZER_DATE: '/respondents/reports/by-socializer-date',
  RESPONDENTS_REPORTS_COMPLETE: '/respondents/reports/complete',
  
  // Socializers
  SOCIALIZERS: '/socializers',
  SOCIALIZER_BY_ID: (id: string) => `/socializers/${id}`,
  SOCIALIZERS_WITH_LOCATIONS: '/socializers/with-locations',
  
  // Roles
  ROLES: '/roles',
  
  // Coordinators
  COORDINATORS: '/socializers/coordinators',
  COORDINATOR_ASSIGNMENTS_BATCH: '/coordinator-assignments/batch',
  COORDINATOR_ASSIGNMENTS_BATCH_UNASSIGN: '/coordinator-assignments/batch-unassign',
  
  // Location
  LOCATIONS: '/locations',
  LOCATION_LATEST: (userId: string) => `/locations/${userId}/latest`,
} as const

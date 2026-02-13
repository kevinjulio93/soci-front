/**
 * Config - Constantes de configuración
 * Centraliza configuraciones de la aplicación
 */

export const MAP_CONFIG = {
  // Zoom por defecto
  DEFAULT_ZOOM: 15,
  
  // Configuración de íconos de Leaflet
  MARKER_SIZE: [25, 41] as [number, number],
  MARKER_ANCHOR: [12, 41] as [number, number],
  POPUP_ANCHOR: [1, -34] as [number, number],
  SHADOW_SIZE: [41, 41] as [number, number],
  
  // Altura del mapa
  MAP_HEIGHT: '400px',
} as const

export const AUDIO_CONFIG = {
  // Bitrate para MP3
  MP3_BITRATE: 128,
  
  // Tamaño de bloque para encoding MP3
  MP3_SAMPLE_BLOCK_SIZE: 1152,
  
  // Canales de audio (1 = mono, 2 = estéreo)
  AUDIO_CHANNELS: 1,
} as const

export const PAGINATION_CONFIG = {
  // Elementos por página por defecto
  DEFAULT_PER_PAGE: 10,
  
  // Máximo de elementos por página para obtener todos
  MAX_PER_PAGE: 1000,
} as const

export const TOAST_CONFIG = {
  // Duración por defecto en milisegundos
  DEFAULT_DURATION: 5000,
} as const

export const SYNC_CONFIG = {
  // Intervalo de sincronización automática (30 segundos)
  AUTO_SYNC_INTERVAL: 30000,
} as const

export const FILE_CONFIG = {
  // Extensiones de archivos de audio
  AUDIO_EXTENSIONS: {
    MP3: 'mp3',
    WEBM: 'webm',
    M4A: 'm4a',
  },
  
  // Tipos MIME de audio
  AUDIO_MIME_TYPES: {
    MP3: 'audio/mp3',
    MPEG: 'audio/mpeg',
    WEBM: 'audio/webm',
    MP4: 'audio/mp4',
  },
} as const

export const LOCALE_CONFIG = {
  // Idioma por defecto
  DEFAULT_LOCALE: 'es-CO',
  
  // Formato de fecha
  DATE_FORMAT: {
    year: 'numeric' as const,
    month: 'short' as const,
    day: 'numeric' as const,
    hour: '2-digit' as const,
    minute: '2-digit' as const,
  },
} as const

export const OTP_CONFIG = {
  // Permitir al usuario omitir la verificación por SMS
  ALLOW_SKIP: import.meta.env.VITE_OTP_ALLOW_SKIP !== 'false', // true por defecto
} as const

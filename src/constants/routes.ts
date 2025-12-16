/**
 * Routes - Constantes de rutas de navegación
 * Centraliza todas las rutas de la aplicación
 */

export const ROUTES = {
  // Raíz
  ROOT: '/',
  
  // Autenticación
  LOGIN: '/login',
  
  // Dashboard
  DASHBOARD: '/sociologist/dashboard',
  ADMIN_DASHBOARD: '/admin/dashboard',
  
  // Admin
  ADMIN_SOCIALIZERS: '/admin/socializers',
  ADMIN_SOCIALIZERS_NEW: '/admin/socializers/new',
  ADMIN_SOCIALIZERS_EDIT: (id: string) => `/admin/socializers/edit/${id}`,
  ADMIN_SURVEYS: '/admin/surveys',
  ADMIN_USERS: '/admin/users',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_SETTINGS: '/admin/settings',
  
  // Encuestas
  SURVEY_PARTICIPANT: (surveyId: string) => `/survey/${surveyId}/participant`,
} as const

/**
 * NotificationService - Servicio centralizado para manejar notificaciones
 * Maneja respuestas del backend y muestra notificaciones apropiadas
 */

import { MESSAGES } from '../constants'

type ToastCallback = (message: string, duration?: number) => void

interface NotificationService {
  success: ToastCallback
  error: ToastCallback
  warning: ToastCallback
  info: ToastCallback
}

let notificationInstance: NotificationService | null = null

export const setNotificationService = (service: NotificationService) => {
  notificationInstance = service
}

export const notificationService = {
  success: (message: string, duration?: number) => {
    if (notificationInstance) {
      notificationInstance.success(message, duration)
    }
  },

  error: (message: string, duration?: number) => {
    if (notificationInstance) {
      notificationInstance.error(message, duration)
    }
  },

  warning: (message: string, duration?: number) => {
    if (notificationInstance) {
      notificationInstance.warning(message, duration)
    }
  },

  info: (message: string, duration?: number) => {
    if (notificationInstance) {
      notificationInstance.info(message, duration)
    }
  },

  /**
   * Maneja errores de API y muestra notificaciones apropiadas
   */
  handleApiError: (error: any, defaultMessage: string = MESSAGES.GENERIC_ERROR) => {
    const rawStatus = error?.code || error?.response?.status || error?.status
    const status = typeof rawStatus === 'string' ? parseInt(rawStatus, 10) : rawStatus
    const friendlyByStatus: Record<number, string> = {
      400: 'La solicitud no es valida. Verifique los datos e intente de nuevo.',
      401: 'Sesion expirada o no autorizada. Inicie sesion nuevamente.',
      403: 'No tienes permisos para realizar esta accion.',
      404: 'No se encontro el recurso solicitado.',
      408: 'La solicitud tomo demasiado tiempo. Intente de nuevo.',
      409: 'Conflicto con el estado actual. Actualice e intente de nuevo.',
      422: 'Datos invalidos. Revise la informacion enviada.',
      429: 'Demasiadas solicitudes. Espera un momento e intenta de nuevo.',
      500: 'Error interno del servidor. Intente mas tarde.',
      502: 'Servidor no disponible. Intente mas tarde.',
      503: 'Servicio no disponible. Intente mas tarde.',
      504: 'Tiempo de espera del servidor. Intente mas tarde.',
    }

    // Si la API envío un mensaje específico, lo mostramos (evitando los generados automáticamente)
    const customMessage = error?.message && typeof error.message === 'string' && !error.message.startsWith('HTTP ')
      ? error.message
      : null

    if (customMessage) {
      notificationService.error(customMessage)
      return
    }

    if (typeof status === 'number' && !Number.isNaN(status)) {
      const friendly = friendlyByStatus[status] || defaultMessage
      notificationService.error(`HTTP ${status} - ${friendly}`)
      return
    }

    // Registrar el error en consola para depuración
    console.error('API Error details:', error)

    // Sin estatus: error de red, error de lógica o desconocido
    const errorMessage = error?.message || 'Error desconocido'
    notificationService.error(`Error: ${errorMessage}. Verifique su conexion e intente de nuevo.`)
  },

  /**
   * Maneja respuestas exitosas de API
   */
  handleApiSuccess: (message: string) => {
    notificationService.success(message)
  },

  /**
   * Wrapper para operaciones async con manejo de errores automático
   */
  async withErrorHandling<T>(
    operation: () => Promise<T>,
    successMessage?: string,
    errorMessage?: string
  ): Promise<T | null> {
    try {
      const result = await operation()
      if (successMessage) {
        notificationService.success(successMessage)
      }
      return result
    } catch (error) {
      notificationService.handleApiError(error, errorMessage)
      return null
    }
  },
}

/**
 * NotificationService - Servicio centralizado para manejar notificaciones
 * Maneja respuestas del backend y muestra notificaciones apropiadas
 */

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
    } else {
      console.log('[Success]:', message)
    }
  },

  error: (message: string, duration?: number) => {
    if (notificationInstance) {
      notificationInstance.error(message, duration)
    } else {
      console.error('[Error]:', message)
    }
  },

  warning: (message: string, duration?: number) => {
    if (notificationInstance) {
      notificationInstance.warning(message, duration)
    } else {
      console.warn('[Warning]:', message)
    }
  },

  info: (message: string, duration?: number) => {
    if (notificationInstance) {
      notificationInstance.info(message, duration)
    } else {
      console.info('[Info]:', message)
    }
  },

  /**
   * Maneja errores de API y muestra notificaciones apropiadas
   */
  handleApiError: (error: any, defaultMessage = 'Ha ocurrido un error') => {
    console.error('[API Error]:', error)
    
    const message = 
      error?.response?.data?.message || 
      error?.response?.data?.error ||
      error?.message || 
      defaultMessage

    notificationService.error(message)
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

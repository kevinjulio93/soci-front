/**
 * Componente App - Wrapper principal
 * Responsabilidad: Activar service worker y providers globales
 */

import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AudioRecorderProvider } from './contexts/AudioRecorderContext'
import { ToastProvider } from './contexts/ToastContext'
import { router } from './routes'
import { useServiceWorker } from './hooks'
import { useToast } from './contexts/ToastContext'
import { setNotificationService } from './services/notification.service'
import { useEffect } from 'react'

function AppContent() {
  const toast = useToast()

  // Configurar el servicio de notificaciones con el contexto de toast
  useEffect(() => {
    setNotificationService(toast)
  }, [toast])

  return <RouterProvider router={router} />
}

export function App() {
  // Activar service worker
  useServiceWorker()

  return (
    <ToastProvider>
      <AuthProvider>
        <AudioRecorderProvider>
          <AppContent />
        </AudioRecorderProvider>
      </AuthProvider>
    </ToastProvider>
  )
}

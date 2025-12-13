/**
 * Componente App - Wrapper principal
 * Responsabilidad: Activar service worker y providers globales
 */

import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AudioRecorderProvider } from './contexts/AudioRecorderContext'
import { router } from './routes'
// import { useServiceWorker } from './hooks'

export function App() {
  // Activar service worker
  // useServiceWorker()

  return (
    <AuthProvider>
      <AudioRecorderProvider>
        <RouterProvider router={router} />
      </AudioRecorderProvider>
    </AuthProvider>
  )
}

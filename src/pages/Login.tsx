/**
 * Login Page - Página de login simplificada
 * Principio: Single Responsibility (coordina el flujo de login)
 * Utiliza componentes presentacionales (LoginForm)
 * Utiliza servicios (authService via AuthContext)
 */

import { useNavigate } from 'react-router-dom'
import { LoginForm } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { authService } from '../services/auth.service'
import { useToast } from '../contexts/ToastContext'

export default function Login() {
  const navigate = useNavigate()
  const { login, isLoading, error } = useAuth()
  const { error: showErrorToast } = useToast()

  const handleLogin = async (email: string, password: string) => {
    try {
      const user = await login(email, password)
      // Redirigir al dashboard según el rol
      const route = authService.getDashboardRoute(user)
      
      // Pequeño delay para asegurar que el estado se actualiza
      setTimeout(() => {
        navigate(route)
      }, 100)
    } catch (err) {
      // Mostrar toast para errores de autenticación (401, 403)
      if (err && typeof err === 'object' && 'code' in err) {
        const apiError = err as { code: string; message: string }
        if (apiError.code === '401' || apiError.code === '403') {
          const message = apiError.code === '401' 
            ? 'Credenciales incorrectas. Por favor verifica tu email y contraseña.'
            : 'No tienes permisos para acceder. Tu cuenta puede estar deshabilitada.'
          showErrorToast(message)
        }
      }
      // El error también está en el estado de AuthContext
    }
  }

  return (
    <LoginForm
      onSubmit={(data) => handleLogin(data.email, data.password)}
      isLoading={isLoading}
      error={error}
    />
  )
}

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

export default function Login() {
  const navigate = useNavigate()
  const { login, isLoading, error } = useAuth()

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
      // El error ya está en el estado de AuthContext
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

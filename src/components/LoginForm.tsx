/**
 * LoginForm - Componente presentacional para el formulario de login
 * Principio: Single Responsibility (solo renderiza el formulario)
 * Reutilizable y fácil de testear
 */

import { useForm } from 'react-hook-form'
import '../styles/Login.scss'

interface LoginFormData {
  email: string
  password: string
}

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>
  isLoading?: boolean
  error?: string | null
}

export function LoginForm({ onSubmit, isLoading = false, error }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
    },
  })

  return (
    <div className="login">
      <div className="login__box">
        <h1 className="login__title">Iniciar Sesión</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label htmlFor="email" className="form-group__label">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              className={`form-group__input ${errors.email ? 'form-group__input--error' : ''}`}
              placeholder="Ingresa tu correo"
              disabled={isLoading}
              {...register('email', {
                required: 'El correo es requerido',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Por favor ingresa un email válido',
                },
              })}
            />
            {errors.email && (
              <span className="form-group__error-text">{errors.email.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-group__label">Contraseña</label>
            <input
              id="password"
              type="password"
              className={`form-group__input ${errors.password ? 'form-group__input--error' : ''}`}
              placeholder="Ingresa tu contraseña"
              disabled={isLoading}
              {...register('password', {
                required: 'La contraseña es requerida',
                minLength: {
                  value: 6,
                  message: 'La contraseña debe tener al menos 6 caracteres',
                },
              })}
            />
            {errors.password && (
              <span className="form-group__error-text">{errors.password.message}</span>
            )}
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}

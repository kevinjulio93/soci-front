/**
 * LoginForm - Componente presentacional para el formulario de login
 * Principio: Single Responsibility (solo renderiza el formulario)
 * Reutilizable y fácil de testear
 */

import { useForm } from 'react-hook-form'
import { LoginFormData } from '../models/FormData'
import type { LoginFormProps } from './types'
import { Input } from './Input'
import { useSafeRegister } from '../hooks/useSafeRegister'
import '../styles/Login.scss'

export function LoginForm({ onSubmit, isLoading = false, error }: LoginFormProps) {
  const {
    register: _register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReturnType<LoginFormData['toFormData']>>({
    mode: 'onBlur',
    defaultValues: new LoginFormData().toFormData(),
  })
  const register = useSafeRegister(_register)

  return (
    <div className="login">
      <div className="login__box">
        <div className="login__icon-container">
          <img src="/image.png" alt="Logo de la Aplicación" className="login__icon" />
        </div>
        <h1 className="login__title">Iniciar Sesión</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Input
            id="email"
            type="email"
            label="Correo Electrónico"
            placeholder="Ingresa tu correo"
            disabled={isLoading}
            error={errors.email?.message}
            {...register('email', {
              required: 'El correo es requerido',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Por favor ingresa un email válido',
              },
            })}
          />

          <Input
            id="password"
            type="password"
            label="Contraseña"
            placeholder="Ingresa tu contraseña"
            disabled={isLoading}
            error={errors.password?.message}
            {...register('password', {
              required: 'La contraseña es requerida',
              minLength: {
                value: 6,
                message: 'La contraseña debe tener al menos 6 caracteres',
              },
            })}
          />

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

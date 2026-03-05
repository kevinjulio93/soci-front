/**
 * LoginForm - Componente presentacional para el formulario de login
 * Principio: Single Responsibility (solo renderiza el formulario)
 * Reutilizable y fácil de testear
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { LoginFormData } from '../models/FormData'
import type { LoginFormProps } from './types'
import { Input } from './Input'
import { useSafeRegister } from '../hooks/useSafeRegister'
import '../styles/Login.scss'

export function LoginForm({ onSubmit, isLoading = false, error }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
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
            type={showPassword ? 'text' : 'password'}
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
            action={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            }
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

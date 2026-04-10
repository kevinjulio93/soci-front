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
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSafeRegister } from '../hooks/useSafeRegister'
import { EyeIcon, EyeOffIcon } from './Icons'

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
    <div
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden p-4"
      style={{
        background: 'linear-gradient(135deg, #2d4a5f 0%, #4a7c6f 50%, #6b3d5f 100%)',
      }}
    >
      {/* Spotlight superior */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(255,237,78,0.15) 0%, transparent 60%)',
        }}
      />
      {/* Orbe animado */}
      <div
        className="pointer-events-none absolute -top-72 -right-48 h-[800px] w-[800px] rounded-full animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(255,237,78,0.08) 0%, transparent 70%)',
        }}
      />

      <Card className="relative z-10 w-full max-w-md border border-white/80 bg-white/95 shadow-2xl backdrop-blur-sm">
        <CardHeader className="items-center gap-3 pb-2">
          <img src="/image.png" alt="Logo de la Aplicación" className="h-16 w-auto object-contain" />
          <CardTitle className="text-2xl font-bold text-foreground">Iniciar Sesión</CardTitle>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              }
            />

            <Button
              type="submit"
              className="mt-2 w-full bg-[#ffed4e] text-[#2d4a5f] font-semibold hover:bg-[#ffed4e]/90"
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

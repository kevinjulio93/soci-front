/**
 * Input - Componente reutilizable para inputs del formulario
 * Maneja inputs de tipo text, email, tel, date, etc.
 */

import React from 'react'
import { Input as ShadInput } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  required?: boolean
  className?: string
  ref?: React.Ref<HTMLInputElement>
  action?: React.ReactNode
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  required = false,
  className = '',
  id,
  ref,
  action,
  ...props
}) => {
  const inputId = id || `input-${label?.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <Label htmlFor={inputId}>
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
      )}
      <div className="relative flex items-center">
        <ShadInput
          id={inputId}
          ref={ref}
          aria-invalid={!!error}
          className={cn(action && 'pr-10')}
          {...props}
        />
        {action && (
          <div className="absolute right-2 flex items-center">
            {action}
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}

export default Input

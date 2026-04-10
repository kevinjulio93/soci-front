/**
 * DateInput - Componente especializado para inputs de fecha
 * Con estilos consistentes del sistema
 */

import React from 'react'
import { Input as ShadInput } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  required?: boolean
  className?: string
}

export const DateInput: React.FC<DateInputProps> = ({
  label,
  error,
  required = false,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `date-${label?.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <Label htmlFor={inputId}>
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
      )}
      <ShadInput
        id={inputId}
        type="date"
        aria-invalid={!!error}
        {...props}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

export default DateInput

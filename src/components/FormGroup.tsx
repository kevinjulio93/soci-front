/**
 * FormGroup - Componente contenedor genérico para grupos de formulario
 * Útil para checkboxes, radios y otros elementos personalizados
 */

import React from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FormGroupProps {
  label?: string
  error?: string
  required?: boolean
  className?: string
  children: React.ReactNode
}

export const FormGroup: React.FC<FormGroupProps> = ({
  label,
  error,
  required = false,
  className = '',
  children,
}) => {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
      )}
      {children}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}

export default FormGroup

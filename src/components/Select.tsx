/**
 * Select - Componente reutilizable para selects del formulario
 */

import React from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface SelectOption {
  readonly value: string | number
  readonly label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  required?: boolean
  options: readonly SelectOption[]
  placeholder?: string
  className?: string
  ref?: React.Ref<HTMLSelectElement>
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  required = false,
  options,
  placeholder = 'Seleccione una opción',
  className = '',
  id,
  ref,
  ...props
}) => {
  const selectId = id || `select-${label?.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <Label htmlFor={selectId}>
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
      )}
      <select
        id={selectId}
        ref={ref}
        aria-invalid={!!error}
        className={cn(
          'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm',
          'outline-none transition-colors appearance-none',
          'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}

export default Select

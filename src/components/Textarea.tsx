/**
 * Textarea - Componente reutilizable para textarea del formulario
 */

import React from 'react'
import { Textarea as ShadTextarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  required?: boolean
  className?: string
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  required = false,
  className = '',
  id,
  ...props
}) => {
  const textareaId = id || `textarea-${label?.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <Label htmlFor={textareaId}>
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
      )}
      <ShadTextarea
        id={textareaId}
        aria-invalid={!!error}
        {...props}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}

export default Textarea

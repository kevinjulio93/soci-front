/**
 * FormGroup - Componente contenedor genérico para grupos de formulario
 * Útil para checkboxes, radios y otros elementos personalizados
 */

import React from 'react'

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
    <div className={`form-group ${className}`}>
      {label && (
        <div className="form-group__label">
          {label}
          {required && <span className="form-group__required">*</span>}
        </div>
      )}
      {children}
      {error && <span className="form-group__error">{error}</span>}
    </div>
  )
}

export default FormGroup

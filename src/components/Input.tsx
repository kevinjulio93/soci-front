/**
 * Input - Componente reutilizable para inputs del formulario
 * Maneja inputs de tipo text, email, tel, date, etc.
 */

import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  required?: boolean
  className?: string
  ref?: React.Ref<HTMLInputElement>
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  required = false,
  className = '',
  id,
  ref,
  ...props
}) => {
  const inputId = id || `input-${label?.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className="form-group__label">
          {label}
          {required && <span className="form-group__required">*</span>}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        className={`form-group__input ${error ? 'form-group__input--error' : ''}`}
        {...props}
      />
      {error && <span className="form-group__error">{error}</span>}
    </div>
  )
}

export default Input

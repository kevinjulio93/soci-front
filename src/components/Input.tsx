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
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className="form-group__label">
          {label}
          {required && <span className="form-group__required">*</span>}
        </label>
      )}
      <div className="form-group__input-wrapper">
        <input
          id={inputId}
          ref={ref}
          className={`form-group__input ${error ? 'form-group__input--error' : ''} ${action ? 'form-group__input--with-action' : ''}`}
          {...props}
        />
        {action && (
          <div className="form-group__input-action">
            {action}
          </div>
        )}
      </div>
      {error && <span className="form-group__error">{error}</span>}
    </div>
  )
}

export default Input

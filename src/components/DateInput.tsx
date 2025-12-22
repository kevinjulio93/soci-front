/**
 * DateInput - Componente especializado para inputs de fecha
 * Con estilos consistentes del sistema
 */

import React from 'react'

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
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className="form-group__label">
          {label}
          {required && <span className="form-group__required">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type="date"
        className={`form-group__input date-input ${error ? 'form-group__input--error' : ''}`}
        {...props}
      />
      {error && <span className="form-group__error">{error}</span>}
    </div>
  )
}

export default DateInput

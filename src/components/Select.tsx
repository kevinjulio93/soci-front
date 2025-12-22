/**
 * Select - Componente reutilizable para selects del formulario
 */

import React from 'react'

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
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  required = false,
  options,
  placeholder = 'Seleccione una opción',
  className = '',
  id,
  ...props
}) => {
  const selectId = id || `select-${label?.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={selectId} className="form-group__label">
          {label}
          {required && <span className="form-group__required">*</span>}
        </label>
      )}
      <div className="form-group__select-wrapper">
        <select
          id={selectId}
          className={`form-group__input ${error ? 'form-group__input--error' : ''}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg className="form-group__select-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      {error && <span className="form-group__error">{error}</span>}
    </div>
  )
}

export default Select

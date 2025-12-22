/**
 * Textarea - Componente reutilizable para textarea del formulario
 */

import React from 'react'

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
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={textareaId} className="form-group__label">
          {label}
          {required && <span className="form-group__required">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`form-group__input ${error ? 'form-group__input--error' : ''}`}
        {...props}
      />
      {error && <span className="form-group__error">{error}</span>}
    </div>
  )
}

export default Textarea

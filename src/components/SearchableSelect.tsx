/**
 * SearchableSelect - Dropdown con búsqueda integrada para listas largas
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'

interface SelectOption {
  readonly value: string | number
  readonly label: string
}

interface SearchableSelectProps {
  label?: string
  error?: string
  required?: boolean
  options: readonly SelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  id?: string
  disabled?: boolean
  value?: string | number
  name?: string
  onChange?: (value: string) => void
  onBlur?: () => void
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  error,
  required = false,
  options,
  placeholder = 'Seleccione una opción',
  searchPlaceholder = 'Buscar...',
  className = '',
  id,
  disabled = false,
  value,
  name,
  onChange,
  onBlur,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const selectId = id || `searchable-select-${label?.replace(/\s+/g, '-').toLowerCase()}`

  const selectedOption = options.find(o => String(o.value) === String(value))

  const filtered = search.trim()
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearch('')
        onBlur?.()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onBlur])

  // Focus en el input de búsqueda al abrir
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  const handleSelect = useCallback((optionValue: string | number) => {
    onChange?.(String(optionValue))
    setIsOpen(false)
    setSearch('')
  }, [onChange])

  const handleToggle = () => {
    if (disabled) return
    setIsOpen(prev => !prev)
    if (isOpen) setSearch('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setSearch('')
    }
  }

  return (
    <div className={`form-group ${className}`} ref={containerRef} onKeyDown={handleKeyDown}>
      {label && (
        <label htmlFor={selectId} className="form-group__label">
          {label}
          {required && <span className="form-group__required">*</span>}
        </label>
      )}

      {/* Hidden input para react-hook-form */}
      <input type="hidden" name={name} value={value ?? ''} />

      <div className="searchable-select" data-open={isOpen} data-disabled={disabled}>
        {/* Trigger */}
        <button
          type="button"
          id={selectId}
          className={`searchable-select__trigger ${error ? 'searchable-select__trigger--error' : ''}`}
          onClick={handleToggle}
          disabled={disabled}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className={`searchable-select__value ${!selectedOption ? 'searchable-select__value--placeholder' : ''}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <svg
            className="searchable-select__chevron"
            width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="searchable-select__dropdown">
            <div className="searchable-select__search-wrapper">
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="searchable-select__search-icon"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                className="searchable-select__search"
                placeholder={searchPlaceholder}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onClick={e => e.stopPropagation()}
              />
              {search && (
                <button
                  type="button"
                  className="searchable-select__clear"
                  onClick={(e) => { e.stopPropagation(); setSearch('') }}
                >
                  ×
                </button>
              )}
            </div>

            <div className="searchable-select__list" ref={listRef} role="listbox">
              {/* Opción vacía (placeholder) */}
              <div
                className={`searchable-select__option ${!value ? 'searchable-select__option--selected' : ''}`}
                onClick={() => handleSelect('')}
                role="option"
                aria-selected={!value}
              >
                <span className="searchable-select__option-text searchable-select__option-text--placeholder">
                  {placeholder}
                </span>
              </div>

              {filtered.length === 0 ? (
                <div className="searchable-select__empty">
                  No se encontraron resultados
                </div>
              ) : (
                filtered.map(option => (
                  <div
                    key={option.value}
                    className={`searchable-select__option ${String(option.value) === String(value) ? 'searchable-select__option--selected' : ''}`}
                    onClick={() => handleSelect(option.value)}
                    role="option"
                    aria-selected={String(option.value) === String(value)}
                  >
                    <span className="searchable-select__option-text">{option.label}</span>
                    {String(option.value) === String(value) && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                ))
              )}
            </div>

            {options.length > 0 && (
              <div className="searchable-select__footer">
                {filtered.length} de {options.length}
              </div>
            )}
          </div>
        )}
      </div>

      {error && <span className="form-group__error">{error}</span>}
    </div>
  )
}

export default SearchableSelect

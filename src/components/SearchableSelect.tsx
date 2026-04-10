/**
 * SearchableSelect - Dropdown con búsqueda integrada para listas largas
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDownIcon, SearchIcon, CheckIcon } from './Icons'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

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
    <div className={cn('flex flex-col gap-1.5', className)} ref={containerRef} onKeyDown={handleKeyDown}>
      {label && (
        <Label htmlFor={selectId}>
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
      )}

      {/* Hidden input para react-hook-form */}
      <input type="hidden" name={name} value={value ?? ''} />

      <div className="relative" data-open={isOpen} data-disabled={disabled}>
        {/* Trigger */}
        <button
          type="button"
          id={selectId}
          className={cn(
            'flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors',
            'hover:bg-accent focus:outline-none focus:ring-1 focus:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus:ring-destructive',
          )}
          onClick={handleToggle}
          disabled={disabled}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className={cn('truncate', !selectedOption && 'text-muted-foreground')}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDownIcon
            className={cn('shrink-0 opacity-50 transition-transform duration-200', isOpen && 'rotate-180')}
            size={16}
          />
        </button>

        {/* Backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 z-10"
            onClick={handleToggle}
            aria-hidden="true"
          />
        )}

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-20 mt-1 w-full min-w-48 rounded-md border bg-popover shadow-md">
            <div className="relative flex items-center border-b px-2">
              <SearchIcon size={14} className="shrink-0 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                className="flex h-9 w-full bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
                placeholder={searchPlaceholder}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onClick={e => e.stopPropagation()}
              />
              {search && (
                <button
                  type="button"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={(e) => { e.stopPropagation(); setSearch('') }}
                >
                  ×
                </button>
              )}
            </div>

            <div className="max-h-48 overflow-y-auto py-1" ref={listRef} role="listbox">
              {/* Opción vacía */}
              <div
                className={cn(
                  'flex cursor-pointer items-center px-3 py-2 text-sm text-muted-foreground hover:bg-accent',
                  !value && 'bg-accent/50',
                )}
                onClick={() => handleSelect('')}
                role="option"
                aria-selected={!value}
              >
                {placeholder}
              </div>

              {filtered.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  No se encontraron resultados
                </div>
              ) : (
                filtered.map(option => (
                  <div
                    key={option.value}
                    className={cn(
                      'flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-accent',
                      String(option.value) === String(value) && 'bg-accent/50 font-medium',
                    )}
                    onClick={() => handleSelect(option.value)}
                    role="option"
                    aria-selected={String(option.value) === String(value)}
                  >
                    <span>{option.label}</span>
                    {String(option.value) === String(value) && (
                      <CheckIcon size={14} strokeWidth={3} className="text-primary shrink-0" />
                    )}
                  </div>
                ))
              )}
            </div>

            {options.length > 0 && (
              <div className="border-t px-3 py-1.5 text-xs text-muted-foreground">
                {filtered.length} de {options.length}
              </div>
            )}
          </div>
        )}
      </div>

      {error && <span className="text-sm text-destructive">{error}</span>}
    </div>
  )
}

export default SearchableSelect

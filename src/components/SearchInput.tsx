import { useCallback, type ChangeEvent } from 'react'
import { SearchIcon } from './Icons'

interface SearchInputProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
}

/**
 * SearchInput - Componente de búsqueda estandarizado para Dashboards
 */
export function SearchInput({ value, onChange, placeholder = "Buscar...", className = "" }: SearchInputProps) {
    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value)
    }, [onChange])

    const handleClear = useCallback(() => {
        onChange('')
    }, [onChange])

    return (
        <div className={`dashboard-layout__search ${className}`}>
            <SearchIcon
                size={18}
                color="#999"
                className="dashboard-layout__search-icon"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={handleChange}
                className="dashboard-layout__search-input"
            />
            {value ? (
                <button
                    type="button"
                    onClick={handleClear}
                    className="dashboard-layout__search-clear"
                    title="Limpiar búsqueda"
                >
                    ×
                </button>
            ) : null}
        </div>
    )
}

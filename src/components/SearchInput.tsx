import { useCallback, type ChangeEvent } from 'react'
import { SearchIcon } from './Icons'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

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
        <div className={cn('relative flex items-center', className)}>
            <SearchIcon
                size={16}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={handleChange}
                className="pl-8 pr-8"
            />
            {value && (
                <button
                    type="button"
                    onClick={handleClear}
                    title="Limpiar búsqueda"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-base leading-none"
                >
                    ×
                </button>
            )}
        </div>
    )
}

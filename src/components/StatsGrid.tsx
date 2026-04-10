import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StatsGridProps {
    children: ReactNode
    className?: string
    columns?: number
    style?: React.CSSProperties
}

/**
 * StatsGrid - Contenedor grid para StatCards.
 */
export function StatsGrid({ children, className = '', columns, style }: StatsGridProps) {
    return (
        <div
            className={cn(
                'grid gap-4',
                !columns && 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
                className,
            )}
            style={{
                ...(columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : {}),
                ...style,
            }}
        >
            {children}
        </div>
    )
}

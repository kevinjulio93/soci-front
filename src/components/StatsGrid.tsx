import { type ReactNode } from 'react'

interface StatsGridProps {
    children: ReactNode
    className?: string
    columns?: number
    style?: React.CSSProperties
}

/**
 * StatsGrid - Contenedor flex/grid para StatCards.
 * Si se pasa un className personalizado (como "reports-stats"), se usa
 * ese como clase principal para respetar sus estilos CSS propios.
 */
export function StatsGrid({ children, className = '', columns, style }: StatsGridProps) {
    const baseClass = className || 'stats-grid'
    const gridStyle = {
        ...(columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : {}),
        ...style,
    }

    return (
        <div className={baseClass} style={Object.keys(gridStyle).length ? gridStyle : undefined}>
            {children}
        </div>
    )
}

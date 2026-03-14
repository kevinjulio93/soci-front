/**
 * StatCard - Componente reutilizable para tarjetas de estadísticas
 * Principio: Single Responsibility
 */

import type { ReactNode } from 'react'

export interface StatCardProps {
  icon?: ReactNode
  value: number | string
  label: string
  variant?: 'default' | 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'purple' | 'darkblue'
  onClick?: () => void
  isActive?: boolean
  className?: string
  style?: React.CSSProperties
}

export function StatCard({
  icon,
  value,
  label,
  variant = 'default',
  onClick,
  isActive = false,
  className = '',
  style,
}: StatCardProps) {
  const variantClass = variant !== 'default' ? `stat-card--${variant}` : ''
  const activeClass = isActive ? 'stat-card--active' : ''
  const clickableClass = onClick ? 'stat-card--clickable' : ''

  return (
    <div
      className={`stat-card ${variantClass} ${activeClass} ${clickableClass} ${className}`.trim()}
      onClick={onClick}
      style={{
        ...(onClick ? { cursor: 'pointer' } : {}),
        ...style
      }}
    >
      {icon && <div className="stat-card__icon">{icon}</div>}
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__label">{label}</div>
    </div>
  )
}

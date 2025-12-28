/**
 * EmptyState - Componente reutilizable para estados vacíos
 * Principio: Single Responsibility
 */

import type { ReactNode } from 'react'

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`empty-state ${className}`.trim()}>
      {icon && <div className="empty-state__icon">{icon}</div>}
      <h2 className="empty-state__title">{title}</h2>
      {description && <p className="empty-state__description">{description}</p>}
      {action && (
        <button
          className="btn btn--primary"
          onClick={action.onClick}
          style={{ marginTop: '1.5rem' }}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

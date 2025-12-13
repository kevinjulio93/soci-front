/**
 * PageHeader - Componente reutilizable para headers de sección
 * Principio: Single Responsibility (solo renderiza el header de una sección)
 * Reutilizable en todas las vistas del dashboard
 */

import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  children?: ReactNode // Para botones u otros elementos personalizados
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="dashboard__header-section">
      <div className="dashboard__header-text">
        <h2 className="dashboard__section-title">{title}</h2>
        {description && (
          <p className="dashboard__section-desc">{description}</p>
        )}
      </div>
      {children && <div className="dashboard__header-actions">{children}</div>}
    </div>
  )
}

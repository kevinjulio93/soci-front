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
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex shrink-0 items-center gap-2">{children}</div>
      )}
    </div>
  )
}

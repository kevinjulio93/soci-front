/**
 * StatCard - Componente reutilizable para tarjetas de estadísticas
 * Principio: Single Responsibility
 */

import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

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

const variantStyles: Record<NonNullable<StatCardProps['variant']>, string> = {
  default:  '',
  primary:  'border-yellow-300 bg-yellow-50 text-yellow-800',
  success:  'border-emerald-300 bg-emerald-50 text-emerald-800',
  danger:   'border-red-300 bg-red-50 text-red-800',
  warning:  'border-amber-300 bg-amber-50 text-amber-800',
  info:     'border-blue-300 bg-blue-50 text-blue-800',
  purple:   'border-purple-300 bg-purple-50 text-purple-800',
  darkblue: 'border-indigo-300 bg-indigo-50 text-indigo-800',
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
  return (
    <Card
      className={cn(
        'transition-all',
        variantStyles[variant],
        isActive && 'ring-2 ring-ring',
        onClick && 'cursor-pointer hover:shadow-md',
        className,
      )}
      onClick={onClick}
      style={style}
    >
      <CardContent className="flex flex-col items-center gap-1 py-4 text-center">
        {icon && <div className="mb-1 text-2xl">{icon}</div>}
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground font-medium">{label}</div>
      </CardContent>
    </Card>
  )
}

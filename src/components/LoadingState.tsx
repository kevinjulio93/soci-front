/**
 * LoadingState - Componente reutilizable para estados de carga
 * Principio: Single Responsibility
 */

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface LoadingStateProps {
  message?: string
  className?: string
  rows?: number
}

export function LoadingState({
  message = 'Cargando...',
  className = '',
  rows = 5,
}: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col gap-3 p-4', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-full rounded-md" />
      ))}
      {message && (
        <p className="mt-1 text-center text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  )
}

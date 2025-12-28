/**
 * LoadingState - Componente reutilizable para estados de carga
 * Principio: Single Responsibility
 */

export interface LoadingStateProps {
  message?: string
  className?: string
}

export function LoadingState({
  message = 'Cargando...',
  className = '',
}: LoadingStateProps) {
  return (
    <div className={`loading-state ${className}`.trim()}>
      <div className="spinner"></div>
      {message && <p>{message}</p>}
    </div>
  )
}

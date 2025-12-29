/**
 * DashboardHeader - Componente presentacional para el encabezado
 * Principio: Single Responsibility (solo renderiza el header)
 * Props: user, onLogout
 */

import type { User } from '../types'
import '../styles/Dashboard.scss'

interface DashboardHeaderProps {
  title: string
  user: User | null
  onLogout: () => void
}

export function DashboardHeader({ title, user, onLogout }: DashboardHeaderProps) {
  return (
    <header className="dashboard__header">
      <div className="dashboard__header-content">
        <div className="dashboard__header-left">
          <h1 className="dashboard__title">{title}</h1>
        </div>
        <div className="dashboard__user-info">
          <span>Bienvenido, {user?.fullName || user?.profile?.fullName || user?.email}</span>
          <button onClick={onLogout} className="dashboard__logout-btn">
            Cerrar Sesión
          </button>
        </div>
      </div>
    </header>
  )
}

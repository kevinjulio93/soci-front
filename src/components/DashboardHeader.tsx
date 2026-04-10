/**
 * DashboardHeader - Componente presentacional para el encabezado
 * Principio: Single Responsibility (solo renderiza el header)
 * Props: user, onLogout
 */

import { LogoutIcon } from './Icons'
import { Button } from '@/components/ui/button'
import type { User } from '../types'

interface DashboardHeaderProps {
  title: string
  user: User | null
  onLogout: () => void
}

export function DashboardHeader({ title, user, onLogout }: DashboardHeaderProps) {
  return (
    <header className="border-b bg-card px-6 py-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{title}</h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            Bienvenido, {user?.profile?.name || user?.fullName || user?.profile?.fullName || user?.email}
          </span>
          <Button variant="ghost" size="sm" onClick={onLogout} className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10">
            <LogoutIcon size={16} />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </header>
  )
}

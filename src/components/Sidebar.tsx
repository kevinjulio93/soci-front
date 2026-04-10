/**
 * Sidebar - Componente de navegación lateral para dashboards
 */

import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLogout } from '../hooks'
import { ROUTES } from '../constants'
import { translateRole } from '../utils'
import { HomeIcon, UsersIcon, FileIcon, ChartIcon, LocationIcon, MapIcon, LogoutIcon } from './Icons'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const location = useLocation()
  const { user } = useAuth()
  const roleType = user?.role?.role?.toLowerCase() || ''
  const canViewSocializersReport = roleType === 'admin' || roleType === 'zonecoordinator'

  const handleLogout = useLogout()

  const isActive = (path: string) => location.pathname === path
  const isReportsActive = () => location.pathname.startsWith('/admin/reports')

  const linkClass = (active: boolean) =>
    cn(
      'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
      'hover:bg-accent hover:text-accent-foreground',
      active && 'bg-accent text-accent-foreground font-medium',
    )

  const sublinkClass = (active: boolean) =>
    cn(
      'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
      'hover:bg-accent hover:text-accent-foreground',
      active && 'bg-accent text-accent-foreground font-medium',
    )

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-card shadow-xl transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="font-semibold text-sm">SOCI Admin</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {/* User info */}
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
            {(user?.profile?.name || user?.fullName || user?.profile?.fullName || user?.email)?.charAt(0).toUpperCase()}
          </div>
          <div className="flex min-w-0 flex-col">
            <p
              className="truncate text-sm font-medium"
              title={user?.profile?.name || user?.fullName || user?.profile?.fullName || user?.email}
            >
              {user?.profile?.name || user?.fullName || user?.profile?.fullName || user?.email}
            </p>
            <p className="text-xs text-muted-foreground">{translateRole(user?.role?.role || '')}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-2">
          <Link to={ROUTES.ADMIN_DASHBOARD} className={linkClass(isActive(ROUTES.ADMIN_DASHBOARD))} onClick={onClose}>
            <HomeIcon className="h-4 w-4 shrink-0" />
            <span>Dashboard</span>
          </Link>

          <Link to={ROUTES.ADMIN_SOCIALIZERS} className={linkClass(isActive(ROUTES.ADMIN_SOCIALIZERS))} onClick={onClose}>
            <UsersIcon className="h-4 w-4 shrink-0" />
            <span>Usuarios</span>
          </Link>

          <Link to={ROUTES.ADMIN_SURVEYS} className={linkClass(isActive(ROUTES.ADMIN_SURVEYS))} onClick={onClose}>
            <FileIcon className="h-4 w-4 shrink-0" />
            <span>Encuestas</span>
          </Link>

          <div>
            <div className={linkClass(isReportsActive())}>
              <ChartIcon className="h-4 w-4 shrink-0" />
              <span>Reportes</span>
            </div>
            <div className="flex flex-col gap-0.5 pl-7 pt-0.5">
              <Link to={ROUTES.ADMIN_REPORTS_REALTIME} className={sublinkClass(isActive(ROUTES.ADMIN_REPORTS_REALTIME))} onClick={onClose}>
                <LocationIcon size={16} className="h-4 w-4 shrink-0" />
                <span>Tiempo Real</span>
              </Link>
              <Link to={ROUTES.ADMIN_REPORTS_MAP} className={sublinkClass(isActive(ROUTES.ADMIN_REPORTS_MAP))} onClick={onClose}>
                <MapIcon size={16} className="h-4 w-4 shrink-0" />
                <span>Mapa de Encuestas</span>
              </Link>
              <Link to={ROUTES.ADMIN_REPORTS_GENERATE} className={sublinkClass(isActive(ROUTES.ADMIN_REPORTS_GENERATE))} onClick={onClose}>
                <FileIcon size={16} className="h-4 w-4 shrink-0" />
                <span>Generar Reporte</span>
              </Link>
              {canViewSocializersReport && (
                <Link to={ROUTES.ADMIN_REPORTS_SOCIALIZERS} className={sublinkClass(isActive(ROUTES.ADMIN_REPORTS_SOCIALIZERS))} onClick={onClose}>
                  <UsersIcon size={16} className="h-4 w-4 shrink-0" />
                  <span>Por Roles</span>
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t px-2 py-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogoutIcon className="h-4 w-4 shrink-0" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  )
}

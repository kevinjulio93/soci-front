/**
 * Sidebar - Componente de navegación lateral para dashboards
 */

import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLogout } from '../hooks'
import { ROUTES } from '../constants'
import { translateRole } from '../utils'
import { HomeIcon, UsersIcon, FileIcon, ChartIcon, LocationIcon, MapIcon, LogoutIcon } from './Icons'
import '../styles/Sidebar.scss'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const location = useLocation()
  const { user } = useAuth()
  const roleType = user?.role?.role?.toLowerCase() || ''
  const canViewSocializersReport = roleType === 'admin' || roleType === 'zonecoordinator'

  // Hook centralizado para logout
  const handleLogout = useLogout()

  const isActive = (path: string) => {
    return location.pathname === path
  }

  const isReportsActive = () => {
    return location.pathname.startsWith('/admin/reports')
  }

  return (
    <>
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <h2 className="sidebar__title">SOCI Admin</h2>
          <button className="sidebar__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="sidebar__user">
          <div className="sidebar__user-avatar">
            {(user?.profile?.name || user?.fullName || user?.profile?.fullName || user?.email)?.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar__user-info">
            <p
              className="sidebar__user-email"
              title={user?.profile?.name || user?.fullName || user?.profile?.fullName || user?.email}
            >
              {user?.profile?.name || user?.fullName || user?.profile?.fullName || user?.email}
            </p>
            <p className="sidebar__user-role">{translateRole(user?.role?.role || '')}</p>
          </div>
        </div>

        <nav className="sidebar__nav">
          <Link
            to={ROUTES.ADMIN_DASHBOARD}
            className={`sidebar__link ${isActive(ROUTES.ADMIN_DASHBOARD) ? 'sidebar__link--active' : ''}`}
            onClick={onClose}
          >
            <HomeIcon className="sidebar__icon" />
            <span>Dashboard</span>
          </Link>

          <Link
            to={ROUTES.ADMIN_SOCIALIZERS}
            className={`sidebar__link ${isActive(ROUTES.ADMIN_SOCIALIZERS) ? 'sidebar__link--active' : ''}`}
            onClick={onClose}
          >
            <UsersIcon className="sidebar__icon" />
            <span>Usuarios</span>
          </Link>

          <Link
            to={ROUTES.ADMIN_SURVEYS}
            className={`sidebar__link ${isActive(ROUTES.ADMIN_SURVEYS) ? 'sidebar__link--active' : ''}`}
            onClick={onClose}
          >
            <FileIcon className="sidebar__icon" />
            <span>Encuestas</span>
          </Link>

          <div className="sidebar__menu-item">
            <div className={`sidebar__link sidebar__link--parent ${isReportsActive() ? 'sidebar__link--active' : ''}`}>
              <ChartIcon className="sidebar__icon" />
              <span>Reportes</span>
            </div>

            <div className="sidebar__submenu">
              <Link
                to={ROUTES.ADMIN_REPORTS_REALTIME}
                className={`sidebar__submenu-link ${isActive(ROUTES.ADMIN_REPORTS_REALTIME) ? 'sidebar__submenu-link--active' : ''}`}
                onClick={onClose}
              >
                <LocationIcon size={18} className="sidebar__submenu-icon" />
                <span>Tiempo Real</span>
              </Link>

              <Link
                to={ROUTES.ADMIN_REPORTS_MAP}
                className={`sidebar__submenu-link ${isActive(ROUTES.ADMIN_REPORTS_MAP) ? 'sidebar__submenu-link--active' : ''}`}
                onClick={onClose}
              >
                <MapIcon size={18} className="sidebar__submenu-icon" />
                <span>Mapa de Encuestas</span>
              </Link>

              <Link
                to={ROUTES.ADMIN_REPORTS_GENERATE}
                className={`sidebar__submenu-link ${isActive(ROUTES.ADMIN_REPORTS_GENERATE) ? 'sidebar__submenu-link--active' : ''}`}
                onClick={onClose}
              >
                <FileIcon size={18} className="sidebar__submenu-icon" />
                <span>Generar Reporte</span>
              </Link>

              {canViewSocializersReport && (
                <Link
                  to={ROUTES.ADMIN_REPORTS_SOCIALIZERS}
                  className={`sidebar__submenu-link ${isActive(ROUTES.ADMIN_REPORTS_SOCIALIZERS) ? 'sidebar__submenu-link--active' : ''}`}
                  onClick={onClose}
                >
                  <UsersIcon size={18} className="sidebar__submenu-icon" />
                  <span>Por Roles</span>
                </Link>
              )}
            </div>
          </div>
        </nav>

        <div className="sidebar__footer">
          <button className="sidebar__logout" onClick={handleLogout}>
            <LogoutIcon className="sidebar__icon" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  )
}

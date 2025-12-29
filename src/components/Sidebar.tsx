/**
 * Sidebar - Componente de navegación lateral para dashboards
 */

import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLogout } from '../hooks'
import { ROUTES } from '../constants'
import '../styles/Sidebar.scss'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const location = useLocation()
  const { user } = useAuth()

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
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar__user-info">
            <p className="sidebar__user-email">{user?.email}</p>
            <p className="sidebar__user-role">{user?.role?.role}</p>
          </div>
        </div>

        <nav className="sidebar__nav">
          <Link
            to={ROUTES.ADMIN_DASHBOARD}
            className={`sidebar__link ${isActive(ROUTES.ADMIN_DASHBOARD) ? 'sidebar__link--active' : ''}`}
            onClick={onClose}
          >
            <svg className="sidebar__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Dashboard</span>
          </Link>

          <Link
            to={ROUTES.ADMIN_SOCIALIZERS}
            className={`sidebar__link ${isActive(ROUTES.ADMIN_SOCIALIZERS) ? 'sidebar__link--active' : ''}`}
            onClick={onClose}
          >
            <svg className="sidebar__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Usuarios</span>
          </Link>

          <Link
            to={ROUTES.ADMIN_SURVEYS}
            className={`sidebar__link ${isActive(ROUTES.ADMIN_SURVEYS) ? 'sidebar__link--active' : ''}`}
            onClick={onClose}
          >
            <svg className="sidebar__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Encuestas</span>
          </Link>

          <div className="sidebar__menu-item">
            <div className={`sidebar__link sidebar__link--parent ${isReportsActive() ? 'sidebar__link--active' : ''}`}>
              <svg className="sidebar__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Reportes</span>
            </div>

            <div className="sidebar__submenu">
              <Link
                to={ROUTES.ADMIN_REPORTS_REALTIME}
                className={`sidebar__submenu-link ${isActive(ROUTES.ADMIN_REPORTS_REALTIME) ? 'sidebar__submenu-link--active' : ''}`}
                onClick={onClose}
              >
                <svg className="sidebar__submenu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Tiempo Real</span>
              </Link>

              <Link
                to={ROUTES.ADMIN_REPORTS_MAP}
                className={`sidebar__submenu-link ${isActive(ROUTES.ADMIN_REPORTS_MAP) ? 'sidebar__submenu-link--active' : ''}`}
                onClick={onClose}
              >
                <svg className="sidebar__submenu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 013.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span>Mapa de Encuestas</span>
              </Link>

              <Link
                to={ROUTES.ADMIN_REPORTS_GENERATE}
                className={`sidebar__submenu-link ${isActive(ROUTES.ADMIN_REPORTS_GENERATE) ? 'sidebar__submenu-link--active' : ''}`}
                onClick={onClose}
              >
                <svg className="sidebar__submenu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Generar</span>
              </Link>
            </div>
          </div>
        </nav>

        <div className="sidebar__footer">
          <button className="sidebar__logout" onClick={handleLogout}>
            <svg className="sidebar__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  )
}

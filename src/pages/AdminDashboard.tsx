/**
 * AdminDashboard - Dashboard del administrador
 * Página de bienvenida con navegación a diferentes secciones
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Sidebar } from '../components'
import { ROUTES } from '../constants'
import '../styles/Dashboard.scss'

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="dashboard-layout__content">
        <div className="dashboard-layout__header">
          <button 
            className="dashboard-layout__menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="dashboard-layout__title">Dashboard Administrativo</h1>
        </div>

        <div className="dashboard-layout__body">
          <div className="empty-state">
            <div className="empty-state__icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h2 className="empty-state__title">
              ¡Bienvenido, {user?.email}!
            </h2>
            <p className="empty-state__description">
              Utiliza el menú lateral para navegar por las diferentes secciones del sistema.
            </p>
            <div className="empty-state__hints">
              <div className="hint-card" onClick={() => navigate(ROUTES.ADMIN_SOCIALIZERS)} style={{ cursor: 'pointer' }}>
                <svg className="hint-card__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <h3 className="hint-card__title">Usuarios</h3>
                <p className="hint-card__text">Crea y administra usuarios del sistema</p>
              </div>
              <div className="hint-card" onClick={() => navigate(ROUTES.ADMIN_SURVEYS)} style={{ cursor: 'pointer' }}>
                <svg className="hint-card__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="hint-card__title">Encuestas</h3>
                <p className="hint-card__text">Consulta todas las encuestas realizadas</p>
              </div>
              <div className="hint-card" onClick={() => navigate(ROUTES.ADMIN_REPORTS)} style={{ cursor: 'pointer' }}>
                <svg className="hint-card__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="hint-card__title">Reportes</h3>
                <p className="hint-card__text">Consulta estadísticas y reportes del sistema</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * UserManagement - Gestión de usuarios
 * Página para administrar usuarios del sistema
 */

import { useState } from 'react'
import { Sidebar } from '../components'
import '../styles/Dashboard.scss'

export default function UserManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
          <h1 className="dashboard-layout__title">Gestión de Usuarios</h1>
        </div>

        <div className="dashboard-layout__body">
          <div className="empty-state">
            <div className="empty-state__icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h2 className="empty-state__title">
              Gestión de Usuarios
            </h2>
            <p className="empty-state__description">
              Esta sección te permitirá administrar los usuarios del sistema, asignar roles y gestionar permisos.
            </p>
            <div className="empty-state__hints">
              <div className="hint-card">
                <svg className="hint-card__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <h3 className="hint-card__title">Crear Usuarios</h3>
                <p className="hint-card__text">Registra nuevos usuarios en el sistema</p>
              </div>
              <div className="hint-card">
                <svg className="hint-card__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <h3 className="hint-card__title">Asignar Roles</h3>
                <p className="hint-card__text">Define permisos y niveles de acceso</p>
              </div>
              <div className="hint-card">
                <svg className="hint-card__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="hint-card__title">Historial</h3>
                <p className="hint-card__text">Consulta el registro de actividad de usuarios</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

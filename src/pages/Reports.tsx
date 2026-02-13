/**
 * Reports - Reportes y estadísticas
 * Página principal con submenú para reportes
 */

import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Sidebar } from '../components'
import { ROUTES } from '../constants'
import '../styles/Dashboard.scss'

export default function Reports() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

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
          <h1 className="dashboard-layout__title">Reportes y Estadísticas</h1>
        </div>

        <div className="dashboard-layout__body">
          <div className="reports-menu">
            <div className="reports-menu__grid">
              <Link 
                to={ROUTES.ADMIN_REPORTS_REALTIME}
                className={`reports-menu__card ${isActive(ROUTES.ADMIN_REPORTS_REALTIME) ? 'reports-menu__card--active' : ''}`}
              >
                <div className="reports-menu__icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <h3 className="reports-menu__title">Ubicaciones en Tiempo Real</h3>
                <p className="reports-menu__description">
                  Visualiza la ubicación actual de todos los socializadores activos en el sistema
                </p>
                <div className="reports-menu__badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="8" />
                  </svg>
                  En vivo
                </div>
              </Link>

              <Link 
                to={ROUTES.ADMIN_REPORTS_MAP}
                className={`reports-menu__card ${isActive(ROUTES.ADMIN_REPORTS_MAP) ? 'reports-menu__card--active' : ''}`}
              >
                <div className="reports-menu__icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 013.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <h3 className="reports-menu__title">Mapa de Encuestas</h3>
                <p className="reports-menu__description">
                  Visualiza todas las encuestas en un mapa, diferenciando exitosas (azul) de rechazadas (rojo)
                </p>
                <div className="reports-menu__badge reports-menu__badge--info">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 013.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Geográfico
                </div>
              </Link>

              <Link 
                to={ROUTES.ADMIN_REPORTS_GENERATE}
                className={`reports-menu__card ${isActive(ROUTES.ADMIN_REPORTS_GENERATE) ? 'reports-menu__card--active' : ''}`}
              >
                <div className="reports-menu__icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="reports-menu__title">Generar Reporte Tabular</h3>
                <p className="reports-menu__description">
                  Crea reportes personalizados por rango de fechas y socializador, exporta en Excel
                </p>
                <div className="reports-menu__badge reports-menu__badge--secondary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Exportable
                </div>
              </Link>

              <Link 
                to={ROUTES.ADMIN_REPORTS_SOCIALIZERS}
                className={`reports-menu__card ${isActive(ROUTES.ADMIN_REPORTS_SOCIALIZERS) ? 'reports-menu__card--active' : ''}`}
              >
                <div className="reports-menu__icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="reports-menu__title">Resumen por Socializador</h3>
                <p className="reports-menu__description">
                  Resumen de intervenciones, exitosas, no exitosas y defensores agrupados por socializador
                </p>
                <div className="reports-menu__badge reports-menu__badge--secondary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                  Agrupado
                </div>
              </Link>
            </div>

            <div className="reports-menu__info">
              <div className="info-card">
                <svg className="info-card__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01" />
                </svg>
                <div className="info-card__content">
                  <h4 className="info-card__title">Acerca de los Reportes</h4>
                  <p className="info-card__text">
                    Los reportes te permiten monitorear la actividad de los socializadores y generar análisis detallados del trabajo de campo. 
                    Los datos se actualizan en tiempo real y puedes exportarlos para análisis externos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

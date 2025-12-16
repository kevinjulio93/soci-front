/**
 * Reports - Reportes y estadísticas
 * Página para visualizar reportes del sistema
 */

import { useState } from 'react'
import { Sidebar, Card } from '../components'
import { REPORT_CARDS } from '../constants'
import '../styles/Dashboard.scss'

export default function Reports() {
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
          <h1 className="dashboard-layout__title">Reportes y Estadísticas</h1>
        </div>

        <div className="dashboard-layout__body">
          <div className="empty-state">
            <div className="empty-state__icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="empty-state__title">
              Reportes y Estadísticas
            </h2>
            <p className="empty-state__description">
              Consulta y analiza estadísticas detalladas sobre el uso del sistema, encuestas completadas y rendimiento de los socializadores.
            </p>
            <div className="empty-state__hints">
              {REPORT_CARDS.map((card) => (
                <Card
                  key={card.id}
                  icon={card.icon}
                  title={card.title}
                  description={card.description}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

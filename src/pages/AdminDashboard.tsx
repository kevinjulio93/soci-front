/**
 * AdminDashboard - Dashboard del administrador
 * Página de bienvenida con navegación a diferentes secciones
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Sidebar, StatCard, LoadingState, EmptyState, MenuIcon } from '../components'
import { apiService } from '../services/api.service'
import { notificationService } from '../services/notification.service'
import { MESSAGES } from '../constants'
import '../styles/Dashboard.scss'

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()
  const [totalSurveys, setTotalSurveys] = useState<number>(0)
  const [topSocializers, setTopSocializers] = useState<Array<{
    socializerId: string;
    fullName: string;
    idNumber: string;
    userId: string;
    email: string;
    totalSurveys: number;
    successfulSurveys: number;
    unsuccessfulSurveys: number;
  }>>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoading(true)
        const [stats, topSocializersData] = await Promise.all([
          apiService.getRespondentStats(),
          apiService.getTopSocializers(10)
        ])
        setTotalSurveys(stats.totalSurveys)
        setTopSocializers(topSocializersData)
      } catch (error) {
        notificationService.handleApiError(error, MESSAGES.STATS_LOAD_ERROR)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [])

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="dashboard-layout__content">
        <div className="dashboard-layout__header">
          <button 
            className="dashboard-layout__menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <MenuIcon size={24} />
          </button>
          <h1 className="dashboard-layout__title">Dashboard Administrativo</h1>
        </div>

        <div className="dashboard-layout__body">
          <div className="dashboard__header-section">
            <div className="dashboard__header-text">
              <h2 className="dashboard__section-title">¡Bienvenido, {user?.fullName || user?.profile?.fullName || user?.email}!</h2>
              <p className="dashboard__section-desc">
                Resumen general del sistema
              </p>
            </div>
          </div>

          {isLoading ? (
            <LoadingState message="Cargando estadísticas..." />
          ) : (
            <>
              <div className="stats-grid">
                <StatCard 
                  icon={(
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                  value={totalSurveys.toLocaleString()}
                  label="Total Intervenciones"
                  variant="primary"
                />
              </div>

              <div className="dashboard__section" style={{ marginTop: '2rem' }}>
                <h3 className="dashboard__section-subtitle">Top 10 Socializadores</h3>
                <div className="ranking-list">
                  {topSocializers.map((item, index) => (
                    <div key={item.socializerId} className="ranking-item">
                      <div className="ranking-item__position">
                        <span className={`ranking-badge ${index < 3 ? `ranking-badge--${index + 1}` : ''}`}>
                          #{index + 1}
                        </span>
                      </div>
                      <div className="ranking-item__info">
                        <h4 className="ranking-item__name">{item.fullName}</h4>
                        <p className="ranking-item__email">{item.email}</p>
                      </div>
                      <div className="ranking-item__stats">
                        <div className="ranking-item__main">
                          <span className="ranking-item__count">{item.totalSurveys}</span>
                          <span className="ranking-item__label">total</span>
                        </div>
                        <div className="ranking-item__breakdown">
                          <span className="ranking-item__detail ranking-item__detail--success">
                            {item.successfulSurveys} exitosas
                          </span>
                          <span className="ranking-item__detail ranking-item__detail--unsuccessful">
                            {item.unsuccessfulSurveys} no exitosas
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {topSocializers.length === 0 && (
                    <EmptyState 
                      title="No hay datos disponibles"
                      description="Aún no se han registrado socializadores"
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

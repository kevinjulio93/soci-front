/**
 * SociologistDashboard - Dashboard del sociólogo
 * Principio: Single Responsibility (coordina el dashboard)
 * Utiliza componentes presentacionales (DashboardHeader, SurveyTable)
 */

import { useNavigate } from 'react-router-dom'
import { DashboardHeader, PageHeader, MetricsCard } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { useSyncStatus, useGeolocationTracking, useLogout } from '../hooks'
import { ROUTES } from '../constants'
import '../styles/Dashboard.scss'

export default function SociologistDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { isOnline, pendingCount, isSyncing, manualSync } = useSyncStatus()

  // Tracking de geolocalización para socializadores
  const { isTracking, error: geoError, permissionState } = useGeolocationTracking({
    enabled: true,
    intervalMs: 300000, // 5 minutos
  })  // Hook centralizado para logout
  const handleLogout = useLogout()

  const handleManualSync = async () => {
    await manualSync()
  }

  const handleNewSurvey = () => {
    // Navegar a la página de nueva encuesta, la grabación iniciará allí
    navigate(ROUTES.SURVEY_PARTICIPANT('new'), {
      state: {
        startRecording: true,
        editMode: false
      }
    })
  }

  return (
    <div className="dashboard">
      <DashboardHeader
        title="Dashboard Socializador"
        user={user}
        onLogout={handleLogout}
      />

      <main className="dashboard__main">
        <PageHeader
          title="Mis Encuestas"
          description="Aquí puedes ver las encuestas que has registrado"
        >
          <div className="dashboard__header-actions-group">
            {/* Indicador de tracking GPS */}
            {isTracking && (
              <div className="location-indicator">
                <span className="location-indicator__icon">📍</span>
                <span className="location-indicator__text">GPS Activo</span>
              </div>
            )}
            {geoError && permissionState !== 'denied' && (
              <div className="location-error">
                <span className="location-error__text">{geoError}</span>
              </div>
            )}
            {!isOnline && (
              <div className="offline-indicator">
                <span className="offline-indicator__text">Sin conexión</span>
              </div>
            )}
            {pendingCount > 0 && (
              <button
                className="btn btn--sync"
                onClick={handleManualSync}
                disabled={isSyncing || !isOnline}
              >
                <span className="btn__icon">{isSyncing ? '🔄' : '🔁'}</span>
                {isSyncing ? 'Sincronizando...' : `Sincronizar (${pendingCount})`}
              </button>
            )}
            <button className="btn btn--primary" onClick={handleNewSurvey}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Nueva Encuesta</span>
            </button>
          </div>
        </PageHeader>

        <section className="dashboard__content">
          {/* Métricas Diarias del Socializador */}
          <MetricsCard
            viewType="socializer"
            showDailyView={true}
            autoLoad={true}
          />

          {/* Tabla de encuestas (oculta por ahora, disponible para futura expansión) */}
          {/* 
          <DataTable
            columns={getSocializerSurveysTableColumns(formatDate, handleViewDetails)}
            data={surveys}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalRecords}
            itemsPerPage={10}
            onPageChange={handlePageChange}
            isLoading={isLoading}
            emptyStateIcon={
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            emptyStateTitle="No hay encuestas"
            emptyStateDescription="Aún no has registrado encuestas. Comienza creando una nueva encuesta."
            getRowKey={(survey) => survey._id}
          />
          */}
        </section>
      </main>
    </div>
  )
}

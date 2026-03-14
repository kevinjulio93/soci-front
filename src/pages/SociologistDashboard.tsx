/**
 * SociologistDashboard - Dashboard del sociólogo
 * Principio: Single Responsibility (coordina el dashboard)
 * Utiliza componentes presentacionales (DashboardHeader, SurveyTable)
 */

import { useNavigate } from 'react-router-dom'
import { useCallback } from 'react'
import { DashboardHeader, PageHeader, MetricsCard, PlusIcon, LocationIcon, RefreshIcon } from '../components'
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

  const handleManualSync = useCallback(async () => {
    await manualSync()
  }, [manualSync])

  const handleNewSurvey = useCallback(() => {
    // Navegar a la página de nueva encuesta, la grabación iniciará allí
    navigate(ROUTES.SURVEY_PARTICIPANT('new'), {
      state: {
        startRecording: true,
        editMode: false
      }
    })
  }, [navigate])

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
            {isTracking ? (
              <div className="location-indicator">
                <LocationIcon size={16} className="location-indicator__icon" />
                <span className="location-indicator__text">GPS Activo</span>
              </div>
            ) : null}
            {geoError && permissionState !== 'denied' ? (
              <div className="location-error">
                <span className="location-error__text">{geoError}</span>
              </div>
            ) : null}
            {!isOnline ? (
              <div className="offline-indicator">
                <span className="offline-indicator__text">Sin conexión</span>
              </div>
            ) : null}
            {pendingCount > 0 ? (
              <button
                className="btn btn--sync"
                onClick={handleManualSync}
                disabled={isSyncing || !isOnline}
              >
                <RefreshIcon size={16} className={`btn__icon ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Sincronizando...' : `Sincronizar (${pendingCount})`}
              </button>
            ) : null}
            <button className="btn btn--primary" onClick={handleNewSurvey}>
              <PlusIcon size={20} />
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
            emptyStateIcon={<FileIcon size={80} strokeWidth={1.5} />}
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

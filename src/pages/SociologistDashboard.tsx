/**
 * SociologistDashboard - Dashboard del sociólogo
 * Principio: Single Responsibility (coordina el dashboard)
 * Utiliza componentes presentacionales (DashboardHeader, SurveyTable)
 */

import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { DashboardHeader, DataTable, PageHeader } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api.service'
import { notificationService } from '../services/notification.service'
import { useSyncStatus, useGeolocationTracking } from '../hooks'
import { ROUTES, getSocializerSurveysTableColumns, MESSAGES } from '../constants'
import type { RespondentData } from '../models/ApiResponses'
import '../styles/Dashboard.scss'

export default function SociologistDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { isOnline, pendingCount, isSyncing, manualSync } = useSyncStatus()
  
  // Tracking de geolocalización para socializadores
  const { isTracking, error: geoError, permissionState } = useGeolocationTracking({
    enabled: true,
    intervalMs: 30000, // 30 segundos para pruebas
  })
  
  const [surveys, setSurveys] = useState<RespondentData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)

  const loadSurveys = async (page: number) => {
    try {
      setIsLoading(true)
      const response = await apiService.getRespondents(page, 10)
      setSurveys(response.data || [])
      setTotalPages(response.totalPages || 1)
      setTotalRecords(response.totalItems || 0)
      setCurrentPage(page)
    } catch (error) {
      notificationService.handleApiError(error, MESSAGES.LOAD_ERROR)
    } finally {
      setIsLoading(false)
    }
  }

  const loadData = async () => {
    await loadSurveys(1)
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Recargar datos después de sincronizar
  useEffect(() => {
    if (!isSyncing && pendingCount === 0 && isOnline) {
      // Recargar datos cuando se completa la sincronización
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSyncing, pendingCount, isOnline])

  const handlePageChange = async (page: number) => {
    await loadSurveys(page)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleViewDetails = (id: string) => {
    // Navegar al formulario en modo edición
    navigate(ROUTES.SURVEY_PARTICIPANT(id), { 
      state: { 
        startRecording: false,
        editMode: true,
        respondentId: id
      } 
    })
  }

  const handleCloseDetailModal = () => {
    // Ya no se usa, pero mantengo la función por si acaso
  }

  const handleLogout = async () => {
    try {
      // Limpiar localStorage
      localStorage.removeItem('soci_token')
      localStorage.removeItem('soci_user')
      
      // Navegar al login
      navigate(ROUTES.LOGIN)
    } catch (err) {
      // Error silencioso
    }
  }

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
          description={`${totalRecords} encuesta${totalRecords !== 1 ? 's' : ''} registrada${totalRecords !== 1 ? 's' : ''}`}
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
        </section>
      </main>
    </div>
  )
}

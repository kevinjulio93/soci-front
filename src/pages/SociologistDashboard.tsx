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
import { useSyncStatus, useGeolocationTracking } from '../hooks'
import { ROUTES, getRespondentsTableColumns } from '../constants'
import type { Survey } from '../types'
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
  
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    let isMounted = true

    const fetchRespondents = async () => {
      try {
        setIsLoading(true)
        const response = await apiService.getRespondents(currentPage, itemsPerPage)
        
        if (!isMounted) return

        // Actualizar información de paginación desde el backend
        setTotalPages(response.totalPages)
        setTotalItems(response.totalItems)
        setItemsPerPage(response.itemsPerPage)

        // Transformar datos de respondents a formato de surveys
        const surveysData: Survey[] = response.data.map(respondent => ({
          id: respondent._id,
          title: respondent.fullName,
          status: respondent.status === 'enabled' ? 'completed' as const : 'pending' as const,
          participants: 1,
          date: new Date(respondent.createdAt).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }),
          idType: respondent.idType,
          identification: respondent.identification,
          email: respondent.email,
          phone: respondent.phone,
          gender: respondent.gender,
          ageRange: respondent.ageRange,
          city: respondent.city,
          neighborhood: respondent.neighborhood,
          stratum: respondent.stratum,
        }))
        
        setSurveys(surveysData)
      } catch {
        if (!isMounted) return
        // Error al cargar encuestados
        setSurveys([])
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchRespondents()

    return () => {
      isMounted = false
    }
  }, [currentPage, itemsPerPage])

  // Recargar datos después de sincronizar
  useEffect(() => {
    if (!isSyncing && pendingCount === 0 && isOnline) {
      // Recargar datos cuando se completa la sincronización
      setCurrentPage(1)
    }
  }, [isSyncing, pendingCount, isOnline])

  const handleLogout = async () => {
    try {
      // Limpiar localStorage
      localStorage.removeItem('soci_token')
      localStorage.removeItem('soci_user')
      
      // Navegar al login
      navigate(ROUTES.LOGIN)
    } catch (err) {
      console.error('Error al cerrar sesión:', err)
    }
  }

  const handleManualSync = async () => {
    await manualSync()
  }

  const handleViewSurveyDetails = (respondentId: string) => {
    // Navegar al formulario en modo edición
    navigate(ROUTES.SURVEY_PARTICIPANT(respondentId), { 
      state: { 
        startRecording: false,
        editMode: true,
        respondentId: respondentId
      } 
    })
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
          title="Lista de Encuestas"
          description="Gestione los registros y comience nuevas sesiones de recolección de datos."
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
              <span className="btn__icon">+</span> Nueva Encuesta
            </button>
          </div>
        </PageHeader>

        <section className="dashboard__content">
          <DataTable<Survey>
            columns={getRespondentsTableColumns(handleViewSurveyDetails)}
            data={surveys}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
            emptyStateIcon={
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            emptyStateTitle="No hay encuestas disponibles"
            emptyStateDescription="Aún no se han registrado encuestas. Comienza creando una nueva encuesta."
            getRowKey={(survey) => survey.id}
          />
        </section>
      </main>
    </div>
  )
}

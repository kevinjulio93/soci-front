/**
 * SurveysList - Vista de encuestas
 * Métricas: visibles para todos los roles con acceso a admin
 * Tabla: visible solo para el rol admin
 */

import { useState, useEffect } from 'react'
import { Sidebar, DataTable, ConfirmModal, SurveyDetailModal, MetricsCard } from '../components'
import { apiService } from '../services/api.service'
import { notificationService } from '../services/notification.service'
import { getSurveysTableColumns, MESSAGES } from '../constants'
import type { RespondentData } from '../models/ApiResponses'
import { useAuth } from '../contexts/AuthContext'
import '../styles/Dashboard.scss'

export default function SurveysList() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [surveys, setSurveys] = useState<RespondentData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [respondentToDelete, setRespondentToDelete] = useState<{ id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedSurvey, setSelectedSurvey] = useState<RespondentData | null>(null)

  const userRole = user?.role?.role?.toLowerCase() || ''
  const isAdmin = userRole === 'admin'

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

  useEffect(() => {
    if (isAdmin) {
      loadSurveys(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

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

  const handleDeleteClick = (id: string, name: string) => {
    setRespondentToDelete({ id, name })
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!respondentToDelete) return

    try {
      setIsDeleting(true)
      await apiService.deleteRespondent(respondentToDelete.id)
      notificationService.success(MESSAGES.RESPONDENT_DELETE_SUCCESS)
      
      await loadSurveys(currentPage)
      
      setShowDeleteModal(false)
      setRespondentToDelete(null)
    } catch (error) {
      notificationService.handleApiError(error, MESSAGES.DELETE_ERROR)
      alert('Error al eliminar el encuestado. Por favor, intenta de nuevo.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    setRespondentToDelete(null)
  }

  const handleViewDetails = (id: string) => {
    const survey = surveys.find(s => s._id === id)
    if (survey) {
      setSelectedSurvey(survey)
      setShowDetailModal(true)
    }
  }

  const handleCloseDetailModal = () => {
    setShowDetailModal(false)
    setSelectedSurvey(null)
  }

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
          <h1 className="dashboard-layout__title">Encuestas</h1>
        </div>

        <div className="dashboard-layout__body">
          {/* Métricas - Visible para todos los roles */}
          <MetricsCard 
            viewType={userRole as 'admin' | 'coordinador_zona' | 'coordinador_campo' | 'supervisor' | 'socializer'}
            showDailyView={false}
            autoLoad={true}
          />

          {/* Tabla - Solo visible para admin */}
          {isAdmin && (
            <>
              <div className="dashboard__header-section">
                <div className="dashboard__header-text">
                  <h2 className="dashboard__section-title">Todas las Encuestas</h2>
                  <p className="dashboard__section-desc">
                    {totalRecords} encuesta{totalRecords !== 1 ? 's' : ''} registrada{totalRecords !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <DataTable
                columns={getSurveysTableColumns(formatDate, handleViewDetails, handleDeleteClick)}
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
                emptyStateDescription="Aún no se han registrado encuestas en el sistema."
                getRowKey={(survey) => survey._id}
              />
            </>
          )}
        </div>
      </div>

      {isAdmin && (
        <>
          <ConfirmModal
            isOpen={showDeleteModal}
            title="Eliminar Encuestado"
            message={`¿Está seguro de eliminar a ${respondentToDelete?.name || 'este encuestado'}?`}
            confirmText="Eliminar"
            cancelText="Cancelar"
            onConfirm={handleDeleteConfirm}
            onClose={handleDeleteCancel}
            isLoading={isDeleting}
          />

          <SurveyDetailModal
            isOpen={showDetailModal}
            onClose={handleCloseDetailModal}
            survey={selectedSurvey}
            formatDate={formatDate}
          />
        </>
      )}
    </div>
  )
}

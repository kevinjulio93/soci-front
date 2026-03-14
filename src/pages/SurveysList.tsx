/**
 * SurveysList - Vista de encuestas
 * Métricas: visibles para todos los roles con acceso a admin
 * Tabla: visible solo para el rol admin
 */

import { useState, useCallback, useMemo } from 'react'
import { DashboardLayout, DataTable, ConfirmModal, SurveyDetailModal, MetricsCard, FileIcon } from '../components'
import type { MetricsData } from '../components/MetricsCard'
import { apiService } from '../services/api.service'
import { notificationService } from '../services/notification.service'
import { getSurveysTableColumns, MESSAGES } from '../constants'
import { RespondentData } from '../models/ApiResponses'
import { useAuth } from '../contexts/AuthContext'
import '../styles/Dashboard.scss'

export default function SurveysList() {
  const { user } = useAuth()
  const [surveys, setSurveys] = useState<RespondentData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [respondentToDelete, setRespondentToDelete] = useState<{ id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null)
  const [itemsPerPage, setItemsPerPage] = useState(50)
  const [refreshKey, setRefreshKey] = useState(0)

  const userRole = user?.role?.role?.toLowerCase() || ''
  const isAdmin = userRole === 'admin'

  const handleMetricsLoaded = useCallback((data: MetricsData) => {
    if (data.surveys) {
      setSurveys(data.surveys)
      setTotalPages(data.pagination?.totalPages || 1)
      setTotalRecords(data.pagination?.total || 0)
      setCurrentPage(data.pagination?.page || 1)
      setIsLoading(false)
    }
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setIsLoading(true)
    setCurrentPage(page)
  }, [])

  const handleItemsPerPageChange = useCallback((perPage: number) => {
    setIsLoading(true)
    setItemsPerPage(perPage)
    setCurrentPage(1)
  }, [])

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }, [])

  const handleDeleteClick = useCallback((id: string, name: string) => {
    setRespondentToDelete({ id, name })
    setShowDeleteModal(true)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!respondentToDelete) return

    try {
      setIsDeleting(true)
      await apiService.deleteRespondent(respondentToDelete.id)
      notificationService.success(MESSAGES.RESPONDENT_DELETE_SUCCESS)

      setRefreshKey(prev => prev + 1)

      setShowDeleteModal(false)
      setRespondentToDelete(null)
    } catch (error) {
      notificationService.handleApiError(error, MESSAGES.DELETE_ERROR)
    } finally {
      setIsDeleting(false)
    }
  }, [respondentToDelete])

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteModal(false)
    setRespondentToDelete(null)
  }, [])

  const handleViewDetails = useCallback((id: string) => {
    setSelectedSurveyId(id)
    setShowDetailModal(true)
  }, [])

  const handleCloseDetailModal = useCallback(() => {
    setShowDetailModal(false)
    setSelectedSurveyId(null)
  }, [])

  // Memoizar columnas (rerender-memo)
  const columns = useMemo(() =>
    getSurveysTableColumns(handleViewDetails, handleDeleteClick),
    [handleViewDetails, handleDeleteClick]
  )

  return (
    <DashboardLayout title="Encuestas">
      <div className="dashboard-layout__body">
        {/* Métricas - Visible para todos los roles */}
        <MetricsCard
          viewType={userRole as 'admin' | 'coordinador_zona' | 'coordinador_campo' | 'supervisor' | 'socializer'}
          showDailyView={false}
          autoLoad={true}
          onMetricsLoaded={handleMetricsLoaded}
          page={currentPage}
          perPage={itemsPerPage}
          refreshKey={refreshKey}
          onLoading={setIsLoading}
        />

        {/* Tabla - Solo visible para admin */}
        {isAdmin ? (
          <>
            <div className="dashboard__header-section">
              <div className="dashboard__header-text">
                <h2 className="dashboard__section-title">Todas las Encuestas</h2>
                <p className="dashboard__section-desc">
                  {totalRecords} encuesta{totalRecords !== 1 ? 's' : ''} listada{totalRecords !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <DataTable
              columns={columns}
              data={surveys}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalRecords}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              pageSizeOptions={[10, 25, 50, 100]}
              isLoading={isLoading}
              emptyStateIcon={
                <FileIcon size={80} strokeWidth={1.5} />
              }
              emptyStateTitle="No hay encuestas"
              emptyStateDescription="Aún no se han registrado encuestas en el sistema."
              getRowKey={(survey) => survey._id}
            />

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
              surveyId={selectedSurveyId}
              formatDate={formatDate}
            />
          </>
        ) : null}
      </div>
    </DashboardLayout>
  )
}

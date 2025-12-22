/**
 * SocializerManagement - Página para gestionar socializadores (CRUD completo)
 */

import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Sidebar, SocializerForm, DataTable, LocationModal, ConfirmModal } from '../components'
import { apiService } from '../services/api.service'
import { notificationService } from '../services/notification.service'
import { ROUTES, getSocializersTableColumns, MESSAGES } from '../constants'
import type { Socializer, SocializerFormData } from '../types'
import { useAuth } from '../contexts/AuthContext'
import '../styles/Dashboard.scss'

export function SocializerManagement() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams<{ id: string }>()
  
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [socializers, setSocializers] = useState<Socializer[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingSocializer, setEditingSocializer] = useState<Socializer | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [selectedSocializer, setSelectedSocializer] = useState<Socializer | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [socializerToDelete, setSocializerToDelete] = useState<{ id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Determinar si estamos en modo formulario
  const isNewMode = location.pathname === ROUTES.ADMIN_SOCIALIZERS_NEW
  const isEditMode = location.pathname.includes('/edit/')
  const showForm = isNewMode || isEditMode

  const itemsPerPage = 10

  // Cargar socializadores
  const loadSocializers = async (page: number = currentPage) => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiService.getSocializers(page, itemsPerPage)
      setSocializers(response.data)
      setTotalPages(response.totalPages)
      setTotalItems(response.totalItems)
      setCurrentPage(response.currentPage)
    } catch (err) {
      setError('Error al cargar los socializadores')
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar socializador para edición
  const loadSocializerForEdit = async (socializerId: string) => {
    try {
      setFormLoading(true)
      setFormError(null)
      const response = await apiService.getSocializer(socializerId)
      setEditingSocializer(response.data)
    } catch (err) {
      setFormError('Error al cargar los datos del socializador')
    } finally {
      setFormLoading(false)
    }
  }

  // Cargar al montar y cuando cambie la página
  useEffect(() => {
    if (!showForm) {
      loadSocializers(currentPage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, showForm])

  // Cargar socializador cuando estamos en modo edición
  useEffect(() => {
    if (isEditMode && id) {
      loadSocializerForEdit(id)
    } else if (isNewMode) {
      setEditingSocializer(null)
      setFormError(null)
    } else if (!showForm) {
      setEditingSocializer(null)
      setFormError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, location.pathname])

  // Manejar creación/edición
  const handleSubmit = async (data: SocializerFormData) => {
    try {
      setFormLoading(true)
      setFormError(null)

      if (editingSocializer) {
        // Editar
        const updateData = { ...data }
        // Si la contraseña está vacía en modo edición, no la enviamos
        const finalData: Partial<SocializerFormData> = { ...updateData }
        if (!finalData.password) {
          delete finalData.password
        }
        await apiService.updateSocializer(editingSocializer._id, finalData)
        notificationService.success(MESSAGES.USER_UPDATE_SUCCESS)
      } else {
        // Crear
        await apiService.createSocializer(data)
        notificationService.success(MESSAGES.USER_CREATE_SUCCESS)
      }

      // Navegar de vuelta a la lista
      navigate(ROUTES.ADMIN_SOCIALIZERS)
    } catch (err) {
      notificationService.handleApiError(err, MESSAGES.USER_SAVE_ERROR)
      const error = err as { response?: { data?: { message?: string } } }
      setFormError(
        error?.response?.data?.message || 
        MESSAGES.USER_SAVE_ERROR
      )
    } finally {
      setFormLoading(false)
    }
  }

  // Manejar eliminación - abrir modal
  const handleDelete = (id: string, name: string) => {
    setSocializerToDelete({ id, name })
    setDeleteModalOpen(true)
  }

  // Confirmar eliminación
  const handleConfirmDelete = async () => {
    if (!socializerToDelete) return

    try {
      setIsDeleting(true)
      await apiService.deleteSocializer(socializerToDelete.id)
      notificationService.success(MESSAGES.USER_DELETE_SUCCESS)
      await loadSocializers(currentPage)
      setDeleteModalOpen(false)
      setSocializerToDelete(null)
    } catch (err) {
      notificationService.handleApiError(err, MESSAGES.USER_DELETE_ERROR)
    } finally {
      setIsDeleting(false)
    }
  }

  // Cancelar eliminación
  const handleCancelDelete = () => {
    setDeleteModalOpen(false)
    setSocializerToDelete(null)
  }

  // Manejar edición
  const handleEdit = (socializer: Socializer) => {
    navigate(ROUTES.ADMIN_SOCIALIZERS_EDIT(socializer._id))
  }

  // Manejar visualización de ubicación
  const handleViewLocation = (socializer: Socializer) => {
    if (socializer.user?._id) {
      setSelectedSocializer(socializer)
      setLocationModalOpen(true)
    } else {
      notificationService.error(MESSAGES.LOCATION_UNAVAILABLE)
    }
  }

  const handleCloseLocationModal = () => {
    setLocationModalOpen(false)
    setSelectedSocializer(null)
  }

  // Manejar cambio de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Abrir formulario para nuevo socializador
  const handleNewSocializer = () => {
    navigate(ROUTES.ADMIN_SOCIALIZERS_NEW)
  }

  // Cancelar formulario
  const handleCancelForm = () => {
    navigate(ROUTES.ADMIN_SOCIALIZERS)
  }

  // Obtener datos iniciales del formulario
  const getInitialFormData = () => {
    if (!editingSocializer) return undefined
    
    // Obtener el roleId: puede ser un string o un objeto con _id
    const roleId = typeof editingSocializer.user?.role === 'string' 
      ? editingSocializer.user.role 
      : editingSocializer.user?.role?._id || ''
    
    // Obtener el coordinatorId: puede ser un string o un objeto con _id
    let coordinatorId = ''
    if (editingSocializer.coordinator) {
      if (typeof editingSocializer.coordinator === 'string') {
        coordinatorId = editingSocializer.coordinator
      } else if (editingSocializer.coordinator._id) {
        coordinatorId = editingSocializer.coordinator._id
      }
    }
    
    return {
      fullName: editingSocializer.fullName,
      idNumber: editingSocializer.idNumber,
      phone: editingSocializer.phone || '',
      email: editingSocializer.user?.email || '',
      password: '',
      roleId: roleId,
      coordinator: coordinatorId,
      location: editingSocializer.location,
      status: editingSocializer.status,
    }
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
          <h1 className="dashboard-layout__title">Gestión de Usuarios</h1>
        </div>

        <div className="dashboard-layout__body">
          {error && (
            <div className="alert alert--error">
              <p>{error}</p>
              <button onClick={() => loadSocializers()} className="btn btn--small">
                Reintentar
              </button>
            </div>
          )}

          {!showForm && user?.role?.role?.toLowerCase() !== 'readonly' && (
            <div className="dashboard-layout__actions">
              <button
                className="btn btn--primary"
                onClick={handleNewSocializer}
              >
                Nuevo Usuario
              </button>
            </div>
          )}

          {showForm && (
            <div className="dashboard-layout__form">
              <SocializerForm
                onSubmit={handleSubmit}
                isLoading={formLoading}
                error={formError}
                initialData={getInitialFormData()}
                isEditMode={isEditMode}
              />
              <button
                className="btn btn--secondary"
                onClick={handleCancelForm}
                disabled={formLoading}
                style={{ marginTop: '1rem' }}
              >
                Cancelar
              </button>
            </div>
          )}

          {!showForm && (
            <DataTable<Socializer>
              columns={getSocializersTableColumns(handleEdit, handleDelete, handleViewLocation, isLoading, user?.role?.role?.toLowerCase() === 'readonly')}
              data={socializers}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              onPageChange={handlePageChange}
              isLoading={isLoading}
              emptyStateIcon={
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              emptyStateTitle="No hay socializadores registrados"
              emptyStateDescription="Comienza creando el primer socializador para tu equipo"
              getRowKey={(socializer) => socializer._id}
            />
          )}
        </div>
      </div>

      {/* Modal de ubicación */}
      {selectedSocializer && (
        <LocationModal
          isOpen={locationModalOpen}
          onClose={handleCloseLocationModal}
          userId={selectedSocializer.user?._id || ''}
          socializerName={selectedSocializer.fullName}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Eliminar Usuario"
        message={`¿Está seguro de eliminar a ${socializerToDelete?.name || 'este usuario'}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isLoading={isDeleting}
        variant="danger"
      />

      {/* Floating Action Button - Mobile Only */}
      {!showForm && user?.role?.role?.toLowerCase() !== 'readonly' && (
        <button 
          className="fab" 
          onClick={handleNewSocializer}
          title="Nuevo Usuario"
        >
          <span>+</span>
        </button>
      )}
    </div>
  )
}

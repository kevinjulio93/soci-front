/**
 * SocializerManagement - Página para gestionar socializadores (CRUD completo)
 */

import { useState, useEffect } from 'react'
import { Sidebar, SocializerForm, SocializerTable } from '../components'
import { apiService } from '../services/api.service'
import type { Socializer, SocializerFormData } from '../types'
import '../styles/Dashboard.scss'

export function SocializerManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [socializers, setSocializers] = useState<Socializer[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingSocializer, setEditingSocializer] = useState<Socializer | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

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
      console.error('Error loading socializers:', err)
      setError('Error al cargar los socializadores')
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar al montar y cuando cambie la página
  useEffect(() => {
    loadSocializers(currentPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage])

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
      } else {
        // Crear
        await apiService.createSocializer(data)
      }

      // Recargar lista
      await loadSocializers(1)
      
      // Cerrar formulario
      setShowForm(false)
      setEditingSocializer(null)
    } catch (err) {
      console.error('Error saving socializer:', err)
      const error = err as { response?: { data?: { message?: string } } }
      setFormError(
        error?.response?.data?.message || 
        'Error al guardar el socializador'
      )
    } finally {
      setFormLoading(false)
    }
  }

  // Manejar eliminación
  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true)
      await apiService.deleteSocializer(id)
      await loadSocializers(currentPage)
    } catch (err) {
      console.error('Error deleting socializer:', err)
      alert('Error al eliminar el socializador')
    } finally {
      setIsLoading(false)
    }
  }

  // Manejar edición
  const handleEdit = (socializer: Socializer) => {
    setEditingSocializer(socializer)
    setFormError(null)
    setShowForm(true)
  }

  // Manejar cambio de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Abrir formulario para nuevo socializador
  const handleNewSocializer = () => {
    setEditingSocializer(null)
    setFormError(null)
    setShowForm(true)
  }

  // Cancelar formulario
  const handleCancelForm = () => {
    setShowForm(false)
    setEditingSocializer(null)
    setFormError(null)
  }

  // Obtener datos iniciales del formulario
  const getInitialFormData = () => {
    if (!editingSocializer) return undefined
    
    return {
      fullName: editingSocializer.fullName,
      idNumber: editingSocializer.idNumber,
      email: editingSocializer.user?.email || '',
      password: '',
      roleId: editingSocializer.user?.role?._id || '',
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
          <h1 className="dashboard-layout__title">Gestión de Socializadores</h1>
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

          {!showForm && (
            <div className="dashboard-layout__actions">
              <button
                className="btn btn--primary"
                onClick={handleNewSocializer}
              >
                Nuevo Socializador
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
                isEditMode={!!editingSocializer}
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
            <SocializerTable
              socializers={socializers}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              onPageChange={handlePageChange}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  )
}

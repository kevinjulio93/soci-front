/**
 * UserManagement - Página para gestionar usuarios del sistema (CRUD completo)
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Sidebar, SocializerForm, DataTable, LocationModal, ConfirmModal } from '../components'
import { apiService } from '../services/api.service'
import { notificationService } from '../services/notification.service'
import { ROUTES, getSocializersTableColumns, MESSAGES } from '../constants'
import type { Socializer, SocializerFormData } from '../types'
import { useAuth } from '../contexts/AuthContext'
import '../styles/Dashboard.scss'

// Interfaz para el usuario cuando se edita (respuesta de /users/:id)
interface EditUserData {
  _id: string // User ID
  email: string
  role:
    | {
        _id: string
        role: string
      }
    | string
  status: string
  profile: {
    _id: string
    fullName: string
    idNumber: string
    phone: string
    status: string
    profile?: {
      _id?: string
      zoneCoordinator?: string
      [key: string]: unknown
    }
    [key: string]: unknown
  }
  createdAt: string
  updatedAt: string
}

type ParentCoordinatorProfile = {
  _id?: string
  zoneCoordinator?: string
  fieldCoordinator?: string
  [key: string]: unknown
}

type UserRole = Socializer['user']['role']

type SocializerApi = {
  _id: string
  fullName: string
  idNumber: string
  phone: string
  status: string
  user: {
    _id: string
    email: string
    role: UserRole | unknown
  }
  email?: string
  role?: UserRole | unknown
  profile?: ParentCoordinatorProfile | unknown
  createdAt: string
  updatedAt: string
}

const PAGE_SIZE_OPTIONS = [20, 50, 100]

const getRoleName = (role: EditUserData['role'] | undefined): string => {
  if (!role) return ''
  return typeof role === 'string' ? role : role.role
}

const getRoleId = (role: EditUserData['role'] | undefined): string => {
  if (!role) return ''
  return typeof role === 'string' ? role : role._id
}

/**
 * Mapea el coordinador padre al campo correcto del formulario según el rol
 * Devuelve un objeto con el campo específico (assignedSupervisor, assignedFieldCoordinator, etc.)
 */
const mapParentCoordinatorToFormField = (roleName: string, parentProfile?: ParentCoordinatorProfile): Record<string, string> => {
  if (!parentProfile?._id) return {}

  const normalizedRole = roleName.toLowerCase()
  const parentId = parentProfile._id

  if (normalizedRole === 'socializer' || normalizedRole === 'socializador') {
    return { assignedSupervisor: parentId }
  }

  if (normalizedRole === 'supervisor') {
    return { assignedFieldCoordinator: parentId }
  }

  if (normalizedRole === 'fieldcoordinator' || normalizedRole === 'coordinador de campo') {
    return { assignedZoneCoordinator: parentId }
  }

  if (normalizedRole === 'zonecoordinator' || normalizedRole === 'coordinador de zona') {
    return { assignedAdmin: parentId }
  }

  return {}
}

const normalizeRole = (role: unknown): EditUserData['role'] => {
  if (typeof role === 'string') return role

  if (role && typeof role === 'object') {
    const candidate = role as { _id?: string; role?: string }
    if (candidate._id && candidate.role) {
      return { _id: candidate._id, role: candidate.role }
    }
  }

  return { _id: '', role: '' }
}

const mapToTableUser = (item: SocializerApi): Socializer => ({
  _id: item._id,
  fullName: item.fullName,
  idNumber: item.idNumber,
  phone: item.phone,
  status: (item.status as 'enabled' | 'disabled') || 'enabled',
  user: {
    _id: item.user._id,
    email: item.user.email,
    role: (item.user.role as UserRole) || '',
  },
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
})

const buildEditUserData = (userData: SocializerApi): EditUserData => ({
  _id: userData.user._id,
  email: userData.email || userData.user.email || '',
  role: normalizeRole(userData.role),
  status: userData.status,
  profile: {
    _id: userData._id,
    fullName: userData.fullName,
    idNumber: userData.idNumber,
    phone: userData.phone,
    status: userData.status,
    profile: userData.profile as ParentCoordinatorProfile | undefined,
  },
  createdAt: userData.createdAt,
  updatedAt: userData.updatedAt,
})

export function UserManagement() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams<{ id: string }>()
  
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [users, setUsers] = useState<Socializer[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<EditUserData | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Socializer | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [itemsPerPage, setItemsPerPage] = useState(PAGE_SIZE_OPTIONS[0])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // Determinar si estamos en modo formulario
  const isNewMode = location.pathname === ROUTES.ADMIN_SOCIALIZERS_NEW
  const isEditMode = location.pathname.includes('/edit/')
  const showForm = isNewMode || isEditMode

  const isReadOnly = useMemo(
    () => user?.role?.role?.toLowerCase() === 'readonly',
    [user?.role?.role]
  )

  // Cargar usuarios con jerarquía
  const loadUsers = useCallback(async (page: number, search?: string, perPage?: number) => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiService.getUsersHierarchy(page, perPage || itemsPerPage, search)
      
      // Transformar SocializerData[] a Socializer[] para que funcione con la tabla
      const transformedData: Socializer[] = response.data.map((item) => mapToTableUser(item))
      
      setUsers(transformedData)
      setTotalPages(response.totalPages)
      setTotalItems(response.totalItems)
      setCurrentPage(response.currentPage)
    } catch (err) {
      setError('Error al cargar los usuarios')
      console.error('Error loading users:', err)
    } finally {
      setIsLoading(false)
    }
  }, [itemsPerPage])

  // Cargar usuario para edición
  const loadUserForEdit = useCallback(async (userId: string) => {
    try {
      setFormLoading(true)
      setFormError(null)
      const response = await apiService.getUser(userId)
      const userData = response.data
      
      // SocializerData ya procesó la estructura:
      // _id: profileId
      // user: { _id: userId, email, role, ... }
      // profile: Coordinador padre (ya viene de profile.profile del API)
      const editData: EditUserData = buildEditUserData(userData)
      
      setEditingUser(editData)
    } catch (err) {
      setFormError('Error al cargar los datos del usuario')
      console.error('Error loading user for edit:', err)
    } finally {
      setFormLoading(false)
    }
  }, [])

  // Debounce de búsqueda
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchTerm])

  // Cargar al montar y cuando cambie la búsqueda o itemsPerPage
  useEffect(() => {
    if (!showForm) {
      setCurrentPage(1)
      loadUsers(1, debouncedSearch)
    }
  }, [debouncedSearch, itemsPerPage, showForm, loadUsers])

  // Cargar cuando cambie la página
  useEffect(() => {
    if (!showForm) {
      loadUsers(currentPage, debouncedSearch)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, showForm, loadUsers])

  // Cargar usuario cuando estamos en modo edición
  useEffect(() => {
    if (isEditMode && id) {
      // Siempre recargar datos frescos al entrar en modo edición
      setEditingUser(null)
      loadUserForEdit(id)
    } else if (!isEditMode) {
      // Limpiar datos de edición al salir del modo edición
      setEditingUser(null)
      setFormError(null)
    }
  }, [id, isEditMode, loadUserForEdit])

  // Manejar creación/edición
  const handleSubmit = async (data: SocializerFormData) => {
    try {
      setFormLoading(true)
      setFormError(null)

      if (editingUser) {
        // Editar - usar endpoint de users
        const updatePayload: {
          email?: string
          password?: string
          status?: string
          profileData?: {
            fullName?: string
            phone?: string
            idNumber?: string
          }
        } = {
          email: data.email,
          status: data.status,
          profileData: {
            fullName: data.fullName,
            phone: data.phone,
            idNumber: data.idNumber
          }
        }
        
        // Solo incluir contraseña si se proporcionó
        if (data.password && data.password.trim() !== '') {
          updatePayload.password = data.password
        }
        
        await apiService.updateUser(editingUser._id, updatePayload)
        notificationService.success(MESSAGES.USER_UPDATE_SUCCESS)
      } else {
        // Crear
        await apiService.createSocializer(data)
        notificationService.success(MESSAGES.USER_CREATE_SUCCESS)
      }

      // Navegar de vuelta a la lista
      navigate(ROUTES.ADMIN_SOCIALIZERS)
    } catch (err) {
      // Extraer mensaje del error de API (formato: { message, code })
      const apiErr = err as { message?: string; code?: string; response?: { data?: { message?: string } } }
      const errorMessage = 
        apiErr?.message ||
        apiErr?.response?.data?.message || 
        MESSAGES.USER_SAVE_ERROR
      
      // No duplicar notificación si ya tenemos mensaje específico del backend
      if (!apiErr?.message) {
        notificationService.handleApiError(err, MESSAGES.USER_SAVE_ERROR)
      }
      setFormError(errorMessage)
    } finally {
      setFormLoading(false)
    }
  }

  // Manejar eliminación - abrir modal
  const handleDelete = (_id: string, name: string) => {
    setUserToDelete({ id: _id, name })
    setDeleteModalOpen(true)
  }

  // Confirmar eliminación
  const handleConfirmDelete = async () => {
    if (!userToDelete) return

    try {
      setIsDeleting(true)
      await apiService.deleteSocializer(userToDelete.id)
      notificationService.success(MESSAGES.USER_DELETE_SUCCESS)
      await loadUsers(currentPage)
      setDeleteModalOpen(false)
      setUserToDelete(null)
    } catch (err) {
      notificationService.handleApiError(err, MESSAGES.USER_DELETE_ERROR)
    } finally {
      setIsDeleting(false)
    }
  }

  // Cancelar eliminación
  const handleCancelDelete = () => {
    setDeleteModalOpen(false)
    setUserToDelete(null)
  }

  // Manejar edición - usar user._id de la estructura de la lista
  const handleEdit = (_userData: Socializer) => {
    const userId = _userData.user?._id || _userData._id
    navigate(ROUTES.ADMIN_SOCIALIZERS_EDIT(userId))
  }

  // Manejar visualización de ubicación
  const handleViewLocation = (_userData: Socializer) => {
    if (_userData.user?._id) {
      setSelectedUser(_userData)
      setLocationModalOpen(true)
    } else {
      notificationService.error(MESSAGES.LOCATION_UNAVAILABLE)
    }
  }

  const handleCloseLocationModal = () => {
    setLocationModalOpen(false)
    setSelectedUser(null)
  }

  // Manejar cambio de página
  const handlePageChange = (_page: number) => {
    setCurrentPage(_page)
  }

  // Abrir formulario para nuevo usuario
  const handleNewUser = () => {
    navigate(ROUTES.ADMIN_SOCIALIZERS_NEW)
  }

  // Cancelar formulario
  const handleCancelForm = () => {
    navigate(ROUTES.ADMIN_SOCIALIZERS)
  }

  // Datos iniciales del formulario
  const initialFormData = useMemo<SocializerFormData | undefined>(() => {
    if (!editingUser) return undefined

    // editingUser.profile contiene los datos del perfil del usuario
    // editingUser.profile.profile contiene los datos del coordinador padre (si existe)
    const userProfile = editingUser.profile
    const parentCoordinatorProfile = userProfile.profile as ParentCoordinatorProfile | undefined
    const roleId = getRoleId(editingUser.role)
    const roleName = getRoleName(editingUser.role)
    
    // Mapear el coordinador padre al campo correcto del formulario según el rol
    const parentFormField = mapParentCoordinatorToFormField(roleName, parentCoordinatorProfile)

    return {
      fullName: userProfile.fullName || '',
      idNumber: userProfile.idNumber || '',
      phone: userProfile.phone || '',
      email: editingUser.email || '',
      password: '',
      roleId,
      status: (userProfile.status as 'enabled' | 'disabled') || (editingUser.status as 'enabled' | 'disabled') || 'enabled',
      ...parentFormField, // Incluir los campos del padre mapeados correctamente
    } as SocializerFormData
  }, [editingUser])

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="dashboard-layout__content">
        <div className="dashboard-layout__header">
          <button 
            className="dashboard-layout__menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
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
              <button onClick={() => loadUsers(currentPage, debouncedSearch)} className="btn btn--small">
                Reintentar
              </button>
            </div>
          )}

          {!showForm && !isReadOnly && (
            <div className="dashboard-layout__actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="dashboard-layout__search">
                <svg
                  width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar por nombre, email o identificación..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="dashboard-layout__search-input"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="dashboard-layout__search-clear"
                    title="Limpiar búsqueda"
                  >
                    ×
                  </button>
                )}
              </div>
              <button
                className="btn btn--primary"
                onClick={handleNewUser}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>Nuevo Usuario</span>
              </button>
            </div>
          )}

          {!showForm && isReadOnly && (
            <div className="dashboard-layout__actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="dashboard-layout__search">
                <svg
                  width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar por nombre, email o identificación..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="dashboard-layout__search-input"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="dashboard-layout__search-clear"
                    title="Limpiar búsqueda"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          )}

          {showForm && (
            <div className="dashboard-layout__form">
              {isEditMode && !editingUser ? (
                <div className="loading-state" style={{ padding: '2rem', textAlign: 'center' }}>
                  <p>{formError || 'Cargando datos del usuario...'}</p>
                  {formError && (
                    <button onClick={() => id && loadUserForEdit(id)} className="btn btn--small" style={{ marginTop: '0.5rem' }}>
                      Reintentar
                    </button>
                  )}
                </div>
              ) : (
                <SocializerForm
                  onSubmit={handleSubmit}
                  isLoading={formLoading}
                  error={formError}
                  initialData={initialFormData}
                  isEditMode={isEditMode}
                />
              )}
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
              columns={getSocializersTableColumns(handleEdit, handleDelete, handleViewLocation, isLoading, isReadOnly)}
              data={users}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={setItemsPerPage}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              isLoading={isLoading}
              emptyStateIcon={
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              emptyStateTitle="No hay usuarios registrados"
              emptyStateDescription="Comienza creando el primer usuario para tu equipo"
              getRowKey={(userData) => userData._id}
            />
          )}
        </div>
      </div>

      {/* Modal de ubicación */}
      {selectedUser && (
        <LocationModal
          isOpen={locationModalOpen}
          onClose={handleCloseLocationModal}
          userId={selectedUser.user?._id || ''}
          socializerName={selectedUser.fullName}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Eliminar Usuario"
        message={`¿Está seguro de eliminar a ${userToDelete?.name || 'este usuario'}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  )
}

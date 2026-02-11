/**
 * UserManagement - Página para gestionar usuarios del sistema (CRUD completo)
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
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

const ITEMS_PER_PAGE = 10

const getRoleName = (role: EditUserData['role'] | undefined): string => {
  if (!role) return ''
  return typeof role === 'string' ? role : role.role
}

const getRoleId = (role: EditUserData['role'] | undefined): string => {
  if (!role) return ''
  return typeof role === 'string' ? role : role._id
}

const getCoordinatorId = (roleName: string, parentProfile?: ParentCoordinatorProfile): string => {
  if (!parentProfile) return ''

  const normalizedRole = roleName.toLowerCase()

  if (normalizedRole === 'socializer' || normalizedRole === 'socializador') {
    return parentProfile._id || ''
  }

  if (normalizedRole === 'supervisor') {
    return parentProfile._id || ''
  }

  if (normalizedRole === 'fieldcoordinator') {
    return parentProfile.zoneCoordinator || parentProfile._id || ''
  }

  return ''
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
  
  // Determinar si estamos en modo formulario
  const isNewMode = location.pathname === ROUTES.ADMIN_SOCIALIZERS_NEW
  const isEditMode = location.pathname.includes('/edit/')
  const showForm = isNewMode || isEditMode

  const isReadOnly = useMemo(
    () => user?.role?.role?.toLowerCase() === 'readonly',
    [user?.role?.role]
  )

  // Cargar usuarios con jerarquía
  const loadUsers = useCallback(async (page: number) => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiService.getUsersHierarchy(page, ITEMS_PER_PAGE)
      
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
  }, [])

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

  // Cargar al montar y cuando cambie la página
  useEffect(() => {
    if (!showForm) {
      loadUsers(currentPage)
    }
  }, [currentPage, showForm, loadUsers])

  // Cargar usuario cuando estamos en modo edición
  useEffect(() => {
    if (isEditMode && id && id !== editingUser?._id) {
      loadUserForEdit(id)
    } else if (isNewMode && editingUser) {
      setEditingUser(null)
      setFormError(null)
    }
  }, [id, isEditMode, isNewMode, loadUserForEdit, editingUser])

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
    setUserToDelete({ id, name })
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
  const handleEdit = (userData: Socializer) => {
    const userId = userData.user?._id || userData._id
    navigate(ROUTES.ADMIN_SOCIALIZERS_EDIT(userId))
  }

  // Manejar visualización de ubicación
  const handleViewLocation = (userData: Socializer) => {
    if (userData.user?._id) {
      setSelectedUser(userData)
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
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
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
    const coordinator = getCoordinatorId(roleName, parentCoordinatorProfile)

    return {
      fullName: userProfile.fullName || '',
      idNumber: userProfile.idNumber || '',
      phone: userProfile.phone || '',
      email: editingUser.email || '',
      password: '',
      roleId,
      coordinator,
      status: (userProfile.status as 'enabled' | 'disabled') || (editingUser.status as 'enabled' | 'disabled') || 'enabled',
    }
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
              <button onClick={() => loadUsers(currentPage)} className="btn btn--small">
                Reintentar
              </button>
            </div>
          )}

          {!showForm && !isReadOnly && (
            <div className="dashboard-layout__actions">
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

          {showForm && (
            <div className="dashboard-layout__form">
              <SocializerForm
                onSubmit={handleSubmit}
                isLoading={formLoading}
                error={formError}
                initialData={initialFormData}
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
              columns={getSocializersTableColumns(handleEdit, handleDelete, handleViewLocation, isLoading, isReadOnly)}
              data={users}
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

/**
 * SocializerForm - Formulario para crear/editar socializadores
 */

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import type { RoleOption } from '../types'
import { SocializerFormData } from '../models/FormData'
import { apiService } from '../services/api.service'
import { useAuth } from '../contexts/AuthContext'
import type { SocializerFormProps } from './types'
import { Input } from './Input'
import { Select } from './Select'
import { SearchableSelect } from './SearchableSelect'
import { translateRole } from '../utils'
import { useSafeRegister } from '../hooks/useSafeRegister'
import { getHierarchyConfig, getVisibleFieldsForRole, getAutoSelectField, getEditHierarchyField, type HierarchyLevel } from '../constants/hierarchyConfig'
import '../styles/SurveyForm.scss'

interface CoordinatorData {
  _id: string
  fullName: string
  idNumber?: string
  phone?: string
  status?: string
  user?: {
    _id: string
    email?: string
    [key: string]: unknown
  }
  profile?: {
    _id: string
    fullName?: string
    [key: string]: unknown
  }
  email?: string
}

type FormPayload = ReturnType<SocializerFormData['toFormData']> & {
  supervisorId?: string
  fieldCoordinatorId?: string
  zoneCoordinatorId?: string
}

const ROLE_ORDER = [
  'Administrador',
  'Coordinador de Zona',
  'Coordinador de Campo',
  'Supervisor',
  'Socializador',
  'Solo Lectura',
]

const normalizeRoleValue = (roleValue: string): string => roleValue.toLowerCase()

export function SocializerForm({
  onSubmit,
  isLoading = false,
  error,
  initialData,
  isEditMode = false,
}: SocializerFormProps) {
  const { user } = useAuth()
  const userRole = user?.role?.role?.toLowerCase() || ''
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [loadingRoles, setLoadingRoles] = useState(true)
  const [coordinators, setCoordinators] = useState<CoordinatorData[]>([])
  const [fieldCoordinators, setFieldCoordinators] = useState<CoordinatorData[]>([])
  const [zoneCoordinators, setZoneCoordinators] = useState<CoordinatorData[]>([])
  const [loadingCoordinators, setLoadingCoordinators] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [editHierarchyField, setEditHierarchyField] = useState<HierarchyLevel | null>(null)
  const [editFormReady, setEditFormReady] = useState(!isEditMode)

  const {
    register: _register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ReturnType<SocializerFormData['toFormData']>>({
    mode: 'onBlur',
    defaultValues: initialData || new SocializerFormData().toFormData(),
  })
  const register = useSafeRegister(_register)

  // Helper para obtener email de la nueva estructura de API
  const getCoordinatorEmail = (item: CoordinatorData): string => {
    return item.user?.email || item.email || ''
  }

  // Helper para obtener fullName de la nueva estructura de API
  const getCoordinatorFullName = (item: CoordinatorData): string => {
    return (item.fullName || item.user?.fullName || '') as string
  }

  const loadHierarchyOptions = useCallback(async (role: string) => {
    try {
      const normalizedRole = normalizeRoleValue(role)
      
      // Si no hay usuario logueado, no cargar
      if (!user?.id) return

      setLoadingCoordinators(true)

      if (normalizedRole === 'socializer' || normalizedRole === 'socializador') {
        // Socializador -> cargar supervisores
        const supervisors = await apiService.getSupervisors()
        setCoordinators(supervisors)
        return
      }

      if (normalizedRole === 'supervisor') {
        // Supervisor -> cargar coordinadores de campo
        const fieldCoords = await apiService.getFieldCoordinators()
        setFieldCoordinators(fieldCoords)
        return
      }

      if (normalizedRole === 'fieldcoordinator' || normalizedRole === 'coordinador de campo') {
        // Coordinador de campo -> cargar coordinadores de zona
        const zoneCoords = await apiService.getZoneCoordinators()
        setZoneCoordinators(zoneCoords)
        return
      }

      // zonecoordinator y otros no necesitan dropdown de superior
      return
    } catch {
      // Error silencioso
    } finally {
      setLoadingCoordinators(false)
    }
  }, [user?.id])

  // Watch role changes to show/hide coordinator field
  const watchedRoleId = watch('roleId')

  const roleOptions = useMemo(() => roles.map((role) => ({
    value: role._id,
    label: role.role,
  })), [roles])

  const visibleHierarchyFields = useMemo(() => (
    getVisibleFieldsForRole(userRole, selectedRole)
  ), [userRole, selectedRole])

  const loadRoles = useCallback(async () => {
    try {
      const response = await apiService.getRoles()
      // Usar el método helper de la clase GetRolesResponse
      let activeRoles = response.getActiveRoles()
      
      // Filtrar roles según jerarquía usando la configuración
      const hierarchyConfig = getHierarchyConfig(userRole)
      
      // Usar creatableRoles de la configuración para filtrar
      if (hierarchyConfig.creatableRoles && hierarchyConfig.creatableRoles.length > 0) {
        activeRoles = activeRoles.filter(role => 
          hierarchyConfig.creatableRoles!.includes(role.role.toLowerCase())
        )
      }
      // Si no tiene creatableRoles definidos, no puede crear nada (como readonly)
      
      // Traducir roles sin filtrar ni limitar la cantidad
      const translatedRoles = activeRoles.map(role => ({
        _id: role._id,
        role: translateRole(role.role),
        originalRole: role.role,
        status: role.status
      }))
      
      // Ordenar roles en el orden requerido: Administrador, Supervisor, Socializador, Solo Lectura
      translatedRoles.sort((a, b) => {
        const indexA = ROLE_ORDER.indexOf(a.role)
        const indexB = ROLE_ORDER.indexOf(b.role)
        // Si no está en el orden, ponerlo al final
        if (indexA === -1) return 1
        if (indexB === -1) return -1
        return indexA - indexB
      })
      
      setRoles(translatedRoles)
    } catch {
      // Error silencioso
    } finally {
      setLoadingRoles(false)
    }
  }, [userRole])

  // Actualizar valores del formulario cuando cambien los datos iniciales
  useEffect(() => {
    if (!initialData) return

    if (isEditMode && initialData.roleId) {
      // Esperar a que los roles estén cargados para resolver el nombre del rol
      const role = roles.find(r => r._id === initialData.roleId)
      if (!role) return // Los roles aún no han cargado, el effect re-ejecutará cuando carguen

      const roleValue = role.originalRole || role.role || ''
      setSelectedRole(roleValue)

      const editField = getEditHierarchyField(roleValue)
      setEditHierarchyField(editField || null)

      if (editField) {
        // Cargar opciones del padre PRIMERO, luego inicializar el formulario
        setEditFormReady(false)
        loadHierarchyOptions(editField.loadHierarchyRole).then(() => {
          // Reset DESPUÉS de que las opciones estén cargadas para que el select
          // ya tenga las opciones cuando se establece el valor
          reset(initialData)
          setEditFormReady(true)
        })
      } else {
        reset(initialData)
        setEditFormReady(true)
      }
    } else {
      // Modo creación: reset inmediato
      reset(initialData)
    }
  }, [initialData, reset, isEditMode, roles, loadHierarchyOptions])

  // Auto-seleccionar coordinador cuando el usuario es supervisor o fieldcoordinator
  useEffect(() => {
    if (!isEditMode && !initialData) {
      if (userRole === 'fieldcoordinator' && user?.id) {
        setValue('assignedFieldCoordinator', user.id)
      }
    }
  }, [userRole, user?.id, isEditMode, initialData, setValue])

  // Auto-seleccionar el campo según la configuración del rol
  useEffect(() => {
    if (!isEditMode && !initialData && userRole && user?.profile?._id) {
      const autoSelectField = getAutoSelectField(userRole)
      
      if (autoSelectField === 'assignedZoneCoordinator') {
        setValue('assignedZoneCoordinator', user.profile._id)
      } else if (autoSelectField === 'assignedFieldCoordinator') {
        setValue('assignedFieldCoordinator', user.profile._id)
      } else if (autoSelectField === 'assignedSupervisor') {
        // Para supervisor, necesita encontrarse en la lista de supervisores
        if (coordinators.length > 0) {
          const currentSupervisor = coordinators.find(s => {
            const supervisorUserId = typeof s.user === 'string' ? s.user : s.user?._id
            return supervisorUserId === user.id
          })
          if (currentSupervisor) {
            setValue('assignedSupervisor', currentSupervisor._id)
          }
        }
      }
    }
  }, [userRole, user?.profile?._id, user?.id, isEditMode, initialData, setValue, coordinators])

  // Update selectedRole when roleId changes (solo en modo creación)
  useEffect(() => {
    if (!isEditMode && watchedRoleId) {
      const role = roles.find(r => r._id === watchedRoleId)
      const roleValue = role?.originalRole || role?.role || ''
      setSelectedRole(roleValue)
    }
  }, [watchedRoleId, roles, isEditMode])

  useEffect(() => {
    loadRoles()
  }, [loadRoles])

  // Auto-seleccionar rol según la configuración del usuario
  useEffect(() => {
    if (!isEditMode && !initialData && userRole === 'supervisor' && roles.length > 0) {
      // Supervisor solo puede crear socializadores
      const socializerRole = roles.find(r => 
        r.originalRole === 'socializer' || r.originalRole === 'socializador'
      )
      if (socializerRole) {
        setValue('roleId', socializerRole._id)
      }
    }
  }, [roles, userRole, isEditMode, initialData, setValue])


  // Cargar opciones de jerarquía cuando cambia el rol seleccionado (solo en modo creación)
  useEffect(() => {
    if (!isEditMode && selectedRole) {
      loadHierarchyOptions(selectedRole)
    }
  }, [selectedRole, loadHierarchyOptions, isEditMode])

  // Registrar validación para campos de jerarquía (SearchableSelect usa setValue, no register en JSX)
  useEffect(() => {
    const fields = isEditMode && editHierarchyField
      ? [editHierarchyField]
      : visibleHierarchyFields

    fields.forEach((field) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      _register(field.fieldKey as any, {
        required: `Debe seleccionar un ${field.label.toLowerCase()}`,
      })
    })
  }, [_register, isEditMode, editHierarchyField, visibleHierarchyFields])

  // Submit wrapper para transformar coordinatorId según jerarquía
  const handleFormSubmit = (formData: ReturnType<SocializerFormData['toFormData']>) => {
    const payload: FormPayload = { ...formData }
    const selectedRoleObj = roles.find(r => r._id === payload.roleId)
    const roleToCheck = normalizeRoleValue(
      selectedRoleObj?.originalRole || selectedRoleObj?.role || ''
    )
    
    // Agregar automáticamente el campo de coordinador según el rol del usuario logueado
    if (userRole === 'supervisor') {
      // El supervisor crea socializadores y debe asignarse automáticamente
      if (!payload.assignedSupervisor || payload.assignedSupervisor === '') {
        payload.assignedSupervisor = user?.profile?._id
      }
    } else if (userRole === 'fieldcoordinator') {
      // El coordinador de campo crea supervisores y debe asignarse automáticamente
      if (!payload.assignedFieldCoordinator || payload.assignedFieldCoordinator === '') {
        payload.assignedFieldCoordinator = user?.profile?._id
      }
    } else if (userRole === 'zonecoordinator') {
      // El coordinador de zona crea campos y debe asignarse automáticamente
      if (!payload.assignedZoneCoordinator || payload.assignedZoneCoordinator === '') {
        payload.assignedZoneCoordinator = user?.profile?._id
      }
    }
    
    // Mapear el campo de asignación según el rol
    if (roleToCheck === 'socializer' || roleToCheck === 'socializador') {
      // Socializador -> asignar supervisor
      if (payload.assignedSupervisor) {
        payload.supervisorId = payload.assignedSupervisor
        delete payload.assignedSupervisor
      }
    } else if (roleToCheck === 'supervisor') {
      // Supervisor -> asignar coordinador de campo
      if (payload.assignedFieldCoordinator) {
        payload.fieldCoordinatorId = payload.assignedFieldCoordinator
        delete payload.assignedFieldCoordinator
      }
    } else if (roleToCheck === 'fieldcoordinator') {
      // Coordinador de Campo -> asignar coordinador de zona
      if (payload.assignedZoneCoordinator) {
        payload.zoneCoordinatorId = payload.assignedZoneCoordinator
        delete payload.assignedZoneCoordinator
      }
    }
    
    // Eliminar campos no usados
    delete payload.coordinator
    delete payload.assignedFieldCoordinator
    delete payload.assignedSupervisor
    delete payload.assignedZoneCoordinator
    
    onSubmit(payload)
  }

  // En modo edición, mostrar cargando hasta que todo esté listo
  if (isEditMode && !editFormReady) {
    return (
      <div className="survey-form">
        <div className="survey-form__container">
          <div className="survey-form__header">
            <h2 className="survey-form__title">Editar Usuario</h2>
          </div>
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            <p>Cargando datos del formulario...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="survey-form">
      <div className="survey-form__container">
        <div className="survey-form__header">
          <h2 className="survey-form__title">
            {isEditMode ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
        </div>

        <form className="survey-form__form" onSubmit={handleSubmit(handleFormSubmit)}>
          {/* Nombre completo */}
          <Input
            id="fullName"
            type="text"
            label="Nombre Completo"
            placeholder="Ingrese el nombre completo"
            disabled={isLoading}
            required
            error={errors.fullName?.message}
            {...register('fullName', {
              required: 'El nombre es obligatorio',
              minLength: {
                value: 3,
                message: 'El nombre debe tener al menos 3 caracteres',
              },
              setValueAs: (value) => value?.toUpperCase() || '',
            })}
          />

          {/* Número de identificación */}
          <Input
            id="idNumber"
            type="text"
            label="Número de Identificación"
            placeholder="1234567890"
            disabled={isLoading}
            required
            error={errors.idNumber?.message}
            {...register('idNumber', {
              required: 'El número de identificación es obligatorio',
              pattern: {
                value: /^[0-9]+$/,
                message: 'Solo se permiten números',
              },
            })}
          />

          {/* Teléfono */}
          <Input
            id="phone"
            type="tel"
            label="Teléfono"
            placeholder="3001234567"
            disabled={isLoading}
            required
            error={errors.phone?.message}
            {...register('phone', {
              required: 'El teléfono es obligatorio',
              pattern: {
                value: /^[0-9]{10}$/,
                message: 'El teléfono debe tener 10 dígitos',
              },
            })}
          />

          {/* Email */}
          <Input
            id="email"
            type="email"
            label="Email"
            placeholder="correo@ejemplo.com"
            disabled={isLoading}
            required
            error={errors.email?.message}
            {...register('email', {
              required: 'El email es obligatorio',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Email inválido',
              },
            })}
          />

          {/* Contraseña */}
          <Input
            id="password"
            type="password"
            label={`Contraseña ${isEditMode ? '(dejar vacío para no cambiar)' : ''}`}
            placeholder="Ingrese contraseña"
            disabled={isLoading}
            required={!isEditMode}
            error={errors.password?.message}
            {...register('password', {
              required: isEditMode ? false : 'La contraseña es obligatoria',
              minLength: {
                value: 6,
                message: 'La contraseña debe tener al menos 6 caracteres',
              },
            })}
          />

          {/* Rol - Solo visible en modo creación */}
          {!isEditMode && (
            <>
              <Select
                id="roleId"
                label="Rol"
                placeholder="Seleccione un rol"
                options={roleOptions}
                disabled={isLoading || loadingRoles || (userRole === 'supervisor' && !isEditMode)}
                required
                error={errors.roleId?.message}
                {...register('roleId', {
                  required: 'Debe seleccionar un rol',
                })}
              />
              {userRole === 'supervisor' && !isEditMode && (
                <span className="form-group__hint">
                  El rol se asigna automáticamente como Socializador.
                </span>
              )}
            </>
          )}

          {/* Campos jerárquicos dinámicos según configuración */}
          {isEditMode && editHierarchyField ? (
            // En modo edición: mostrar solo el campo del padre directo
            <div>
              <SearchableSelect
                id={editHierarchyField.fieldKey}
                label={editHierarchyField.label}
                placeholder={`Seleccione un ${editHierarchyField.label.toLowerCase()}`}
                searchPlaceholder="Buscar por nombre o email..."
                options={
                  editHierarchyField.dataSourceField === 'zoneCoordinators'
                    ? zoneCoordinators.map((item) => ({
                        value: item._id,
                        label: `${getCoordinatorFullName(item)} - ${getCoordinatorEmail(item)}`,
                      }))
                    : editHierarchyField.dataSourceField === 'fieldCoordinators'
                    ? fieldCoordinators.map((item) => ({
                        value: item._id,
                        label: `${getCoordinatorFullName(item)} - ${getCoordinatorEmail(item)}`,
                      }))
                    : coordinators.map((item) => ({
                        value: item._id,
                        label: `${getCoordinatorFullName(item)} - ${getCoordinatorEmail(item)}`,
                      }))
                }
                disabled={isLoading}
                required
                name={editHierarchyField.fieldKey}
                value={watch(editHierarchyField.fieldKey as 'assignedSupervisor' | 'assignedFieldCoordinator' | 'assignedZoneCoordinator') || ''}
                onChange={(val) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  setValue(editHierarchyField.fieldKey as any, val, { shouldValidate: true })
                }}
                error={errors[editHierarchyField.fieldKey as keyof typeof errors]?.message}
              />
            </div>
          ) : !isEditMode ? (
            // En modo creación: mostrar campos según la configuración
            visibleHierarchyFields.map((hierarchyField) => {
              const isAutoSelected = getAutoSelectField(userRole) === hierarchyField.fieldKey
              const dataSource = hierarchyField.dataSourceField === 'zoneCoordinators' 
                ? zoneCoordinators 
                : hierarchyField.dataSourceField === 'fieldCoordinators' 
                ? fieldCoordinators 
                : coordinators

              return (
                <div key={hierarchyField.fieldKey}>
                  <SearchableSelect
                    id={hierarchyField.fieldKey}
                    label={hierarchyField.label}
                    placeholder={`Seleccione un ${hierarchyField.label.toLowerCase()}`}
                    searchPlaceholder="Buscar por nombre o email..."
                    options={dataSource.map((item) => ({
                      value: item._id,
                      label: `${getCoordinatorFullName(item)} - ${getCoordinatorEmail(item)}`,
                    }))}
                    disabled={isLoading || isAutoSelected}
                    required
                    name={hierarchyField.fieldKey}
                    value={watch(hierarchyField.fieldKey as 'assignedSupervisor' | 'assignedFieldCoordinator' | 'assignedZoneCoordinator') || ''}
                    onChange={(val) => {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      setValue(hierarchyField.fieldKey as any, val, { shouldValidate: true })
                    }}
                    error={errors[hierarchyField.fieldKey as keyof typeof errors]?.message}
                  />
                  {dataSource.length === 0 && !loadingCoordinators && (
                    <span className="form-group__hint">
                      No hay {hierarchyField.label.toLowerCase()}s disponibles. Por favor, cree uno primero.
                    </span>
                  )}
                  {isAutoSelected && (
                    <span className="form-group__hint">
                      Este campo se rellena automáticamente con tu {hierarchyField.label.toLowerCase()} actual.
                    </span>
                  )}
                </div>
              )
            })
          ) : null}

          {/* Estado */}
          <Select
            id="status"
            label="Estado"
            options={[
              { value: 'enabled', label: 'Habilitado' },
              { value: 'disabled', label: 'Deshabilitado' },
            ]}
            disabled={isLoading}
            {...register('status')}
          />

          {/* Error del servidor */}
          {error && (
            <div className="survey-form__submit-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Botones */}
          <div className="form-group form-group--actions">
            <button
              type="submit"
              className="btn btn--primary"
              disabled={isLoading || loadingRoles}
            >
              {isLoading ? 'Guardando...' : isEditMode ? 'Actualizar' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

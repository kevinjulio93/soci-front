/**
 * SocializerForm - Formulario para crear/editar socializadores
 */

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { RoleOption } from '../types'
import { SocializerFormData } from '../models/FormData'
import { apiService } from '../services/api.service'
import { useAuth } from '../contexts/AuthContext'
import type { SocializerFormProps } from './types'
import { Input, Select } from './index'
import '../styles/SurveyForm.scss'

export function SocializerForm({
  onSubmit,
  isLoading = false,
  error,
  initialData,
  isEditMode = false,
}: SocializerFormProps) {
  const { user } = useAuth()
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [loadingRoles, setLoadingRoles] = useState(true)
  const [coordinators, setCoordinators] = useState<Array<{ _id: string; fullName: string; email: string }>>([])
  const [loadingCoordinators, setLoadingCoordinators] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ReturnType<SocializerFormData['toFormData']>>({
    mode: 'onBlur',
    defaultValues: initialData || new SocializerFormData().toFormData(),
  })

  // Watch role changes to show/hide coordinator field
  const watchedRoleId = watch('roleId')

  // Actualizar valores del formulario cuando cambien los datos iniciales
  useEffect(() => {
    if (initialData) {
      reset(initialData)
    }
  }, [initialData, reset])

  // Update selectedRole when roleId changes
  useEffect(() => {
    if (watchedRoleId) {
      const role = roles.find(r => r._id === watchedRoleId)
      setSelectedRole(role?.originalRole || role?.role || '')
    }
  }, [watchedRoleId, roles])

  useEffect(() => {
    loadRoles()
    loadCoordinators()
  }, [])

  const loadCoordinators = async () => {
    try {
      setLoadingCoordinators(true)
      const response = await apiService.getCoordinators()
      setCoordinators(response)
    } catch (err) {
      // Error silencioso
    } finally {
      setLoadingCoordinators(false)
    }
  }

  const loadRoles = async () => {
    try {
      const response = await apiService.getRoles()
      // Usar el método helper de la clase GetRolesResponse
      let activeRoles = response.getActiveRoles()
      
      // Filtrar roles según jerarquía:
      // - admin/root pueden crear todos los roles
      // - coordinador NO puede crear usuarios admin
      const currentUserRole = user?.role?.role || ''
      
      if (currentUserRole === 'coordinador' || currentUserRole === 'coordinator') {
        // Coordinador solo puede crear socializadores
        activeRoles = activeRoles.filter(role => 
          role.role === 'socializer' || 
          role.role === 'socializador'
        )
      }
      
      // Función para traducir roles al español
      const translateRole = (role: string): string => {
        const roleMap: Record<string, string> = {
          'admin': 'Administrador',
          'coordinator': 'Supervisor',
          'coordinador': 'Supervisor',
          'supervisor': 'Supervisor',
          'socializer': 'Socializador',
          'socializador': 'Socializador',
          'readonly': 'Solo Lectura',
          'root': 'Root'
        }
        return roleMap[role.toLowerCase()] || role
      }
      
      // Traducir roles sin filtrar ni limitar la cantidad
      const translatedRoles = activeRoles.map(role => ({
        _id: role._id,
        role: translateRole(role.role),
        originalRole: role.role,
        status: role.status
      }))
      
      setRoles(translatedRoles)
    } catch (err) {
      // Error silencioso
    } finally {
      setLoadingRoles(false)
    }
  }

  // Submit wrapper para transformar coordinatorId si corresponde
  const handleFormSubmit = (formData: any) => {
    let payload = { ...formData }
    
    // Si el rol es socializer/socializador, enviar coordinatorId
    if (payload.roleId && payload.coordinator) {
      const selectedRoleObj = roles.find(r => r._id === payload.roleId)
      const roleToCheck = selectedRoleObj?.originalRole || selectedRoleObj?.role || ''
      
      if (
        roleToCheck.toLowerCase() === 'socializer' ||
        roleToCheck.toLowerCase() === 'socializador'
      ) {
        payload.coordinatorId = payload.coordinator
        delete payload.coordinator
      }
    }
    
    onSubmit(payload)
  }

  return (
    <div className="survey-form">
      <div className="survey-form__container">
        <div className="survey-form__header">
          <h2 className="survey-form__title">
            {isEditMode ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
        </div>

        {error && (
          <div className="survey-form__error">
            <p>{error}</p>
          </div>
        )}

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

          {/* Rol */}
          <Select
            id="roleId"
            label="Rol"
            placeholder="Seleccione un rol"
            options={roles.map((role) => ({
              value: role._id,
              label: role.role,
            }))}
            disabled={isLoading || loadingRoles}
            required
            error={errors.roleId?.message}
            {...register('roleId', {
              required: 'Debe seleccionar un rol',
            })}
          />

          {/* Supervisor - Solo visible cuando el rol es "socializer" */}
          {(selectedRole === 'socializer' || selectedRole === 'socializador') && (
            <>
              <Select
                id="coordinator"
                label="Supervisor"
                placeholder="Seleccione un coordinador"
                options={coordinators.map((coordinator) => ({
                  value: coordinator._id,
                  label: `${coordinator.fullName} - ${coordinator.email}`,
                }))}
                disabled={isLoading || loadingCoordinators}
                required
                error={errors.coordinator?.message}
                {...register('coordinator', {
                  required: (selectedRole === 'socializer' || selectedRole === 'socializador') ? 'Debe seleccionar un supervisor' : false,
                })}
              />
              {coordinators.length === 0 && !loadingCoordinators && (
                <span className="form-group__hint">
                  No hay coordinadores disponibles. Por favor, cree un coordinador primero.
                </span>
              )}
            </>
          )}

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

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
      setSelectedRole(role?.role || '')
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
      // admin y root pueden ver todos los roles (no filtrar)
      
      setRoles(activeRoles.map(role => ({
        _id: role._id,
        role: role.role,
        status: role.status
      })))
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
    if (
      payload.roleId &&
      payload.coordinator &&
      (
        roles.find(r => r._id === payload.roleId)?.role === 'socializer' ||
        roles.find(r => r._id === payload.roleId)?.role === 'socializador'
      )
    ) {
      payload.coordinatorId = payload.coordinator
      delete payload.coordinator
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
          <div className="form-group">
            <label htmlFor="fullName" className="form-group__label">
              Nombre Completo *
            </label>
            <input
              type="text"
              id="fullName"
              className={`form-group__input ${errors.fullName ? 'form-group__input--error' : ''}`}
              {...register('fullName', {
                required: 'El nombre es obligatorio',
                minLength: {
                  value: 3,
                  message: 'El nombre debe tener al menos 3 caracteres',
                },
                setValueAs: (value) => value?.toUpperCase() || '',
              })}
              placeholder="Ingrese el nombre completo"
              disabled={isLoading}
            />
            {errors.fullName && (
              <span className="form-group__error-text">{errors.fullName.message}</span>
            )}
          </div>

          {/* Número de identificación */}
          <div className="form-group">
            <label htmlFor="idNumber" className="form-group__label">
              Número de Identificación *
            </label>
            <input
              type="text"
              id="idNumber"
              className={`form-group__input ${errors.idNumber ? 'form-group__input--error' : ''}`}
              {...register('idNumber', {
                required: 'El número de identificación es obligatorio',
                pattern: {
                  value: /^[0-9]+$/,
                  message: 'Solo se permiten números',
                },
              })}
              placeholder="1234567890"
              disabled={isLoading}
            />
            {errors.idNumber && (
              <span className="form-group__error-text">{errors.idNumber.message}</span>
            )}
          </div>

          {/* Teléfono */}
          <div className="form-group">
            <label htmlFor="phone" className="form-group__label">
              Teléfono *
            </label>
            <input
              type="tel"
              id="phone"
              className={`form-group__input ${errors.phone ? 'form-group__input--error' : ''}`}
              {...register('phone', {
                required: 'El teléfono es obligatorio',
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: 'El teléfono debe tener 10 dígitos',
                },
              })}
              placeholder="3001234567"
              disabled={isLoading}
            />
            {errors.phone && (
              <span className="form-group__error-text">{errors.phone.message}</span>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email" className="form-group__label">
              Email *
            </label>
            <input
              type="email"
              id="email"
              className={`form-group__input ${errors.email ? 'form-group__input--error' : ''}`}
              {...register('email', {
                required: 'El email es obligatorio',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email inválido',
                },
              })}
              placeholder="correo@ejemplo.com"
              disabled={isLoading}
            />
            {errors.email && (
              <span className="form-group__error-text">{errors.email.message}</span>
            )}
          </div>

          {/* Contraseña */}
          <div className="form-group">
            <label htmlFor="password" className="form-group__label">
              Contraseña {isEditMode ? '(dejar vacío para no cambiar)' : '*'}
            </label>
            <input
              type="password"
              id="password"
              className={`form-group__input ${errors.password ? 'form-group__input--error' : ''}`}
              {...register('password', {
                required: isEditMode ? false : 'La contraseña es obligatoria',
                minLength: {
                  value: 6,
                  message: 'La contraseña debe tener al menos 6 caracteres',
                },
              })}
              placeholder="Ingrese contraseña"
              disabled={isLoading}
            />
            {errors.password && (
              <span className="form-group__error-text">{errors.password.message}</span>
            )}
          </div>

          {/* Rol */}
          <div className="form-group">
            <label htmlFor="roleId" className="form-group__label">
              Rol *
            </label>
            <select
              id="roleId"
              className={`form-group__input ${errors.roleId ? 'form-group__input--error' : ''}`}
              {...register('roleId', {
                required: 'Debe seleccionar un rol',
              })}
              disabled={isLoading || loadingRoles}
            >
              <option value="">Seleccione un rol</option>
              {roles.map((role) => (
                <option key={role._id} value={role._id}>
                  {role.role}
                </option>
              ))}
            </select>
            {errors.roleId && (
              <span className="form-group__error-text">{errors.roleId.message}</span>
            )}
          </div>

          {/* Coordinador - Solo visible cuando el rol es "socializer" */}
          {(selectedRole === 'socializer' || selectedRole === 'socializador') && (
            <div className="form-group">
              <label htmlFor="coordinator" className="form-group__label">
                Coordinador *
              </label>
              <select
                id="coordinator"
                className={`form-group__input ${errors.coordinator ? 'form-group__input--error' : ''}`}
                {...register('coordinator', {
                  required: (selectedRole === 'socializer' || selectedRole === 'socializador') ? 'Debe seleccionar un coordinador' : false,
                })}
                disabled={isLoading || loadingCoordinators}
              >
                <option value="">Seleccione un coordinador</option>
                {coordinators.map((coordinator) => (
                  <option key={coordinator._id} value={coordinator._id}>
                    {coordinator.fullName} - {coordinator.email}
                  </option>
                ))}
              </select>
              {errors.coordinator && (
                <span className="form-group__error-text">{errors.coordinator.message}</span>
              )}
              {coordinators.length === 0 && !loadingCoordinators && (
                <span className="form-group__hint">
                  No hay coordinadores disponibles. Por favor, cree un coordinador primero.
                </span>
              )}
            </div>
          )}

          {/* Estado */}
          <div className="form-group">
            <label htmlFor="status" className="form-group__label">
              Estado
            </label>
            <select
              id="status"
              className="form-group__input"
              {...register('status')}
              disabled={isLoading}
            >
              <option value="enabled">Habilitado</option>
              <option value="disabled">Deshabilitado</option>
            </select>
          </div>

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

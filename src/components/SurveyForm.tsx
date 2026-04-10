/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * SurveyForm - Componente presentacional para el formulario de encuesta
 * Principio: Single Responsibility (solo renderiza el formulario)
 * Utiliza React Hook Form para validaciones y manejo de estado
 */

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  ID_TYPE_OPTIONS,
  GENDER_OPTIONS,
  AGE_RANGE_OPTIONS,
  STRATUM_OPTIONS,
  NO_RESPONSE_REASONS,
} from '../constants'
import { Respondent } from '../models/Respondent'
import type { SurveyFormData, SurveyFormProps } from './types'
import { apiService, type ZoneDepartmentEntry, type ZoneMunicipalityItem } from '../services/api.service'
import { Input } from './Input'
import { Select } from './Select'
import { useSafeRegister } from '../hooks/useSafeRegister'
import { Button } from '@/components/ui/button'

export function SurveyForm({
  videoUrl,
  onSubmit,
  isLoading = false,
  error,
  initialData,
  onWillingToRespondChange,
}: SurveyFormProps) {
  const ACTIVE_ZONE = import.meta.env.VITE_ACTIVE_ZONE || 'zona1'
  const ZONE_ALIASES: Record<string, number> = { zonaf: 6 }
  const ZONE_NUMBER = ZONE_ALIASES[ACTIVE_ZONE] ?? (parseInt(ACTIVE_ZONE.replace('zona', ''), 10) || 1)
  const [zoneDepartments, setZoneDepartments] = useState<ZoneDepartmentEntry[]>([])
  const [cities, setCities] = useState<ZoneMunicipalityItem[]>([])
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null)
  const [loadingDepartments, setLoadingDepartments] = useState(false)

  const {
    register: _register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    reset,
  } = useForm<SurveyFormData>({
    mode: 'onChange',
    defaultValues: initialData || {
      ...new Respondent().toFormData(),
      willingToRespond: undefined as any, // Sin valor inicial para que el campo esté oculto
      audioRecordingConsent: undefined as any, // Sin valor inicial para que el campo esté oculto
    },
  })
  const register = useSafeRegister(_register)

  // Watch willingToRespond to show/hide noResponseReason field
  const willingToRespondValue = watch('willingToRespond')
  // Convert string to boolean for conditional rendering
  const willingToRespond = String(willingToRespondValue) === 'true'
  const showAudioRecordingConsent = willingToRespondValue !== undefined && String(willingToRespondValue) === 'true'
  // Solo mostrar noResponseReason si explícitamente se seleccionó "false"
  const showNoResponseReason = willingToRespondValue !== undefined && String(willingToRespondValue) === 'false'

  // Limpiar campos de encuesta exitosa cuando el usuario cambia a "No quiere responder"
  useEffect(() => {
    if (showNoResponseReason) {
      // Campos exclusivos de encuestas exitosas que deben limpiarse
      setValue('fullName', '')
      setValue('idType', '' as any)
      setValue('identification', '')
      setValue('email', '')
      setValue('phone', '')
      setValue('facebookUsername', '')
      setValue('address', '')
      setValue('gender', '' as any)
      setValue('stratum', '' as any)
      setValue('ageRange', '' as any)
      setValue('department', '')
      setValue('departmentId', '')
      setValue('city', '')
      setValue('municipioCode', '')
      setValue('neighborhood', '')
      setValue('defendorDePatria', false)
      setValue('isLinkedHouse', false)
      setValue('audioRecordingConsent', undefined as any)
    }
  }, [showNoResponseReason, setValue])


  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset(initialData)

      // Asegurarse de que noResponseReason se establezca correctamente
      if (!initialData.willingToRespond && initialData.noResponseReason) {
        setTimeout(() => {
          setValue('noResponseReason', initialData.noResponseReason, { shouldValidate: true })
        }, 0)
      }
    }
  }, [initialData, reset, setValue])

  // Cargar departamentos y municipios de la zona activa desde el backend
  useEffect(() => {
    const loadDepartments = async () => {
      setLoadingDepartments(true)
      try {
        const response = await apiService.getZoneDepartments(ZONE_NUMBER)
        setZoneDepartments(response.departments)

        // Auto-seleccionar si solo hay un departamento
        if (response.departments.length === 1) {
          const only = response.departments[0]
          setSelectedDepartmentId(only.department._id)
          setCities(only.municipalities)
          setValue('department', only.department.name)
          setValue('departmentId', only.department._id)
          // Auto-seleccionar si solo hay un municipio
          if (only.municipalities.length === 1) {
            const onlyMuni = only.municipalities[0]
            setValue('city', onlyMuni.name)
            setValue('municipioCode', onlyMuni._id)
          }
        }
      } catch {
        setZoneDepartments([])
      } finally {
        setLoadingDepartments(false)
      }
    }
    loadDepartments()
  }, [])

  // Restaurar selección de departamento en modo edición
  useEffect(() => {
    if (!initialData?.departmentId || zoneDepartments.length === 0) return
    const entry = zoneDepartments.find(e => e?.department?._id === initialData.departmentId)
    if (!entry?.department) return
    // setTimeout asegura que corre después del reset() del efecto de initialData
    setTimeout(() => {
      setSelectedDepartmentId(entry.department._id)
      setValue('department', entry.department.name)
      setValue('departmentId', entry.department._id)
    }, 0)
  }, [zoneDepartments, initialData?.departmentId])

  // Restaurar selección de municipio una vez que cities está poblado
  useEffect(() => {
    if (!initialData?.departmentId || cities.length === 0) return

    // Buscar municipio: primero por _id, luego por nombre como fallback
    let selectedMuni = undefined
    if (initialData.municipioCode) {
      selectedMuni = cities.find(m => m._id === initialData.municipioCode)
    }
    if (!selectedMuni && initialData.city) {
      // Fallback: buscar por nombre si no se encontró por ID
      selectedMuni = cities.find(m => m.name === initialData.city)
    }
    if (selectedMuni) {
      setValue('city', selectedMuni.name)
      setValue('municipioCode', selectedMuni._id)
    }
  }, [cities, initialData?.departmentId, initialData?.municipioCode, initialData?.city])

  // Actualizar ciudades cuando cambia el departamento seleccionado
  useEffect(() => {
    if (selectedDepartmentId) {
      const entry = zoneDepartments.find(e => e?.department?._id === selectedDepartmentId)
      setCities(entry?.municipalities || [])
    } else {
      setCities([])
    }
  }, [selectedDepartmentId, zoneDepartments])

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    if (!value) {
      setSelectedDepartmentId(null)
      setValue('departmentId', '')
      setValue('city', '')
      setValue('municipioCode', '')
      return
    }
    const entry = zoneDepartments.find(e => e.department?.name === value)
    if (!entry?.department) {
      console.warn('Department not found:', value)
      setSelectedDepartmentId(null)
      setValue('departmentId', '')
      setValue('city', '')
      setValue('municipioCode', '')
      return
    }
    setSelectedDepartmentId(entry.department._id)
    setValue('departmentId', entry.department._id)
    setValue('city', '')
    setValue('municipioCode', '')
  }

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    if (!value) {
      setValue('municipioCode', '')
      return
    }
    const muni = cities.find(c => c?.name === value)
    if (muni?._id) {
      setValue('municipioCode', muni._id)
    }
  }

  return (
    <div className="w-full">
      <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-6">
        {/* Video Section - Solo mostrar si está dispuesto a responder */}
        {videoUrl && willingToRespond && (
          <div className="rounded-lg overflow-hidden">
            <video
              className="w-full"
              src={videoUrl}
              controls
            />
          </div>
        )}

        {/* Form Title */}
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold">Datos del Participante</h1>
          <p className="text-sm text-muted-foreground">Complete la información para registrar la sesión</p>
        </div>

        {/* Error Message */}
        {error && <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit((data) => {
          onSubmit(data)
        })} className="flex flex-col gap-5">
          {/* Información Previa de la Encuesta */}
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-semibold border-b pb-2">Información de la Visita</h3>

            {/* Willing to Respond */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                ¿La persona está dispuesta a responder la encuesta?
              </label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    value="true"
                    disabled={isLoading}
                    {...register('willingToRespond', {
                      onChange: (e) => {
                        onWillingToRespondChange?.(e.target.value === 'true')
                      }
                    })}
                  />
                  <span>Sí</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    value="false"
                    disabled={isLoading}
                    {...register('willingToRespond', {
                      onChange: (e) => {
                        onWillingToRespondChange?.(e.target.value === 'true')
                      }
                    })}
                  />
                  <span>No</span>
                </label>
              </div>
            </div>

            {/* Audio Recording Consent - Mostrar solo si SÍ está dispuesto */}
            {showAudioRecordingConsent && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">
                  ¿Autoriza que grabemos el audio de esta entrevista para fines de control de calidad? *
                </label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      value="true"
                      disabled={isLoading}
                      {...register('audioRecordingConsent', {
                        required: showAudioRecordingConsent ? 'Por favor selecciona una opción' : false,
                        onChange: (e) => {
                          const consent = e.target.value === 'true'
                          onWillingToRespondChange?.(consent)
                        }
                      })}
                    />
                    <span>Sí, autorizo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      value="false"
                      disabled={isLoading}
                      {...register('audioRecordingConsent', {
                        required: showAudioRecordingConsent ? 'Por favor selecciona una opción' : false,
                        onChange: (e) => {
                          const consent = e.target.value === 'true'
                          onWillingToRespondChange?.(consent)
                        }
                      })}
                    />
                    <span>No, no autorizo</span>
                  </label>
                </div>
                {errors.audioRecordingConsent && (
                  <p className="text-sm text-destructive">{errors.audioRecordingConsent.message}</p>
                )}
              </div>
            )}

            {/* No Response Reason - Mostrar solo si NO está dispuesto */}
            {showNoResponseReason && (
              <Select
                id="noResponseReason"
                label="Razón de no respuesta"
                placeholder="Seleccione una razón"
                options={NO_RESPONSE_REASONS}
                disabled={isLoading}
                required
                error={errors.noResponseReason?.message}
                {...register('noResponseReason', {
                  required: showNoResponseReason ? 'Por favor selecciona una razón' : false,
                  setValueAs: (value) => {
                    const option = NO_RESPONSE_REASONS.find(opt => opt.value === value)
                    return option ? { value: option.value, label: option.label } : value
                  }
                })}
              />
            )}
          </div>

          {/* Datos del Respondente - Solo mostrar si está dispuesto */}
          {willingToRespond && (
            <div className="flex flex-col gap-4">
              <h3 className="text-base font-semibold border-b pb-2">Datos del Encuestado</h3>

              {/* Full Name */}
              <Input
                id="fullName"
                type="text"
                label="Nombre completo"
                placeholder="Nombre y Apellido"
                disabled={isLoading}
                required={willingToRespond}
                error={errors.fullName?.message}
                {...register('fullName', {
                  required: willingToRespond ? 'El nombre completo es requerido' : false,
                  minLength: willingToRespond ? {
                    value: 3,
                    message: 'El nombre debe tener al menos 3 caracteres',
                  } : undefined,
                  setValueAs: (value) => value?.toUpperCase() || '',
                })}
              />

              {/* ID Type and Identification - Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Select
                    id="idType"
                    label="Tipo de identificación"
                    placeholder="Seleccione tipo"
                    options={ID_TYPE_OPTIONS}
                    disabled={isLoading}
                    required={willingToRespond}
                    error={errors.idType?.message}
                    {...register('idType', {
                      required: willingToRespond ? 'Por favor selecciona un tipo de identificación' : false,
                    })}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Input
                    id="identification"
                    type="text"
                    label="Número de identificación"
                    placeholder="Ej: 1234567890"
                    disabled={isLoading}
                    required={willingToRespond}
                    maxLength={10}
                    error={errors.identification?.message}
                    {...register('identification', {
                      required: willingToRespond ? 'El número de identificación es requerido' : false,
                      maxLength: {
                        value: 10,
                        message: 'La identificación debe tener máximo 10 dígitos',
                      },
                      pattern: {
                        value: /^[0-9]+$/,
                        message: 'La identificación debe contener solo números',
                      },
                    })}
                    onInput={(e) => {
                      const target = e.target as HTMLInputElement
                      target.value = target.value.replace(/[^0-9]/g, '')
                    }}
                  />
                </div>
              </div>

              {/* Email and Phone - Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Input
                    id="email"
                    type="email"
                    label="Correo electrónico"
                    placeholder="correo@ejemplo.com"
                    disabled={isLoading}
                    error={errors.email?.message}
                    {...register('email', {
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Por favor ingresa un correo válido',
                      },
                    })}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Input
                    id="phone"
                    type="tel"
                    label="Teléfono"
                    placeholder="Ej: 3001234567"
                    disabled={isLoading}
                    error={errors.phone?.message}
                    {...register('phone', {
                      required: 'El teléfono es obligatorio',
                      minLength: {
                        value: 10,
                        message: 'El teléfono debe tener exactamente 10 dígitos',
                      },
                      maxLength: {
                        value: 10,
                        message: 'El teléfono debe tener exactamente 10 dígitos',
                      },
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: 'El teléfono debe contener solo números',
                      },
                    })}
                    onInput={(e) => {
                      const target = e.target as HTMLInputElement
                      target.value = target.value.replace(/[^0-9]/g, '')
                    }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Input
                    id="facebookUsername"
                    type="text"
                    label="Usuario de Facebook"
                    placeholder="Ej: nombre.apellido"
                    disabled={isLoading}
                    error={errors.facebookUsername?.message}
                    {...register('facebookUsername')}
                  />
                </div>
              </div>

              {/* Address */}
              <Input
                id="address"
                type="text"
                label="Dirección"
                placeholder="Calle # Carrera # Apartamento"
                disabled={isLoading}
                required={willingToRespond}
                error={errors.address?.message}
                {...register('address', {
                  required: willingToRespond ? 'La dirección es requerida' : false,
                })}
              />

              {/* Gender and Stratum - Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Select
                    id="gender"
                    label="Género"
                    placeholder="Seleccione género"
                    options={GENDER_OPTIONS}
                    disabled={isLoading}
                    required={willingToRespond}
                    error={errors.gender?.message}
                    {...register('gender', {
                      required: willingToRespond ? 'El género es requerido' : false,
                    })}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Select
                    id="stratum"
                    label="Estrato"
                    placeholder="Seleccione estrato"
                    options={STRATUM_OPTIONS}
                    disabled={isLoading}
                    required={willingToRespond}
                    error={errors.stratum?.message}
                    {...register('stratum', {
                      required: willingToRespond ? 'El estrato es requerido' : false,
                    })}
                  />
                </div>
              </div>

              {/* Age Range */}
              <Select
                id="ageRange"
                label="Rango de edad"
                placeholder="Seleccione rango"
                options={AGE_RANGE_OPTIONS}
                disabled={isLoading}
                error={errors.ageRange?.message}
                {...register('ageRange')}
              />

              {/* departmentId (hidden), municipioCode (hidden) */}
              <input type="hidden" {...register('departmentId')} />
              <input type="hidden" {...register('municipioCode')} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Select
                    id="department"
                    label="Departamento"
                    placeholder="Seleccione departamento"
                    options={zoneDepartments
                      .filter((entry) => entry?.department?._id)
                      .map((entry) => ({
                        value: entry.department.name,
                        label: entry.department.name,
                      }))}
                    disabled={isLoading || loadingDepartments || zoneDepartments.length === 0}
                    required={willingToRespond}
                    error={errors.department?.message}
                    {...register('department', {
                      required: willingToRespond ? 'El departamento es requerido' : false,
                      onChange: handleDepartmentChange,
                    })}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Select
                    id="city"
                    label="Municipio"
                    placeholder="Seleccione municipio"
                    options={cities
                      .filter((city) => city?._id)
                      .map((city) => ({
                        value: city.name,
                        label: city.name,
                      }))}
                    disabled={isLoading || !selectedDepartmentId || cities.length === 0}
                    required={willingToRespond}
                    error={errors.city?.message}
                    {...register('city', {
                      required: willingToRespond ? 'El municipio es requerido' : false,
                      onChange: handleCityChange,
                    })}
                  />
                </div>
              </div>

              {/* Neighborhood - Full Width */}
              <Input
                id="neighborhood"
                type="text"
                label="Barrio"
                placeholder="Ej: Prado, Villa Country"
                disabled={isLoading}
                required={willingToRespond}
                error={errors.neighborhood?.message}
                {...register('neighborhood', {
                  required: willingToRespond ? 'El barrio es requerido' : false,
                })}
              />
            </div>
          )}

          {/* Defensor de la Patria y Persona adicional en vivienda - Checkboxes lado a lado - Solo mostrar si está dispuesto */}
          {willingToRespond && (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <input
                    id="defendorDePatria"
                    type="checkbox"
                    className="w-4 h-4 rounded"
                    disabled={isLoading}
                    {...register('defendorDePatria')}
                  />
                  <label htmlFor="defendorDePatria" className="text-sm cursor-pointer">
                    Defensor de la Patria
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <input
                    id="isLinkedHouse"
                    type="checkbox"
                    className="w-4 h-4 rounded"
                    disabled={isLoading}
                    {...register('isLinkedHouse')}
                  />
                  <label htmlFor="isLinkedHouse" className="text-sm cursor-pointer">
                    Persona adicional en vivienda
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !isValid}
          >
            {isLoading ? 'Guardando visita...' : 'Guardar visita'}
          </Button>
        </form>
      </div>
    </div>
  )
}

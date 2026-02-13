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
import { colombiaApiService, type Department, type City } from '../services/colombia-api.service'
import { getDepartmentsByZone, getMunicipalitiesByZoneAndDepartment } from '../constants/zones'
import { Input } from './Input'
import { Select } from './Select'
import '../styles/SurveyForm.scss'

export function SurveyForm({
  videoUrl,
  onSubmit,
  isLoading = false,
  error,
  initialData,
  onWillingToRespondChange,
}: SurveyFormProps) {
  const ACTIVE_ZONE = import.meta.env.VITE_ACTIVE_ZONE || 'zona1'
  const [departments, setDepartments] = useState<Department[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null)
  const [loadingDepartments, setLoadingDepartments] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)

  const {
    register,
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

  // Watch willingToRespond to show/hide noResponseReason field
  const willingToRespondValue = watch('willingToRespond')
  // Convert string to boolean for conditional rendering
  const willingToRespond = String(willingToRespondValue) === 'true'
  const showAudioRecordingConsent = willingToRespondValue !== undefined && String(willingToRespondValue) === 'true'
  // Solo mostrar noResponseReason si explícitamente se seleccionó "false"
  const showNoResponseReason = willingToRespondValue !== undefined && String(willingToRespondValue) === 'false'



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

  // Cargar departamentos de la zona activa desde la API de Colombia
  useEffect(() => {
    const loadDepartments = async () => {
      setLoadingDepartments(true)
      const zoneDepts = getDepartmentsByZone(ACTIVE_ZONE)
      const allDepts = await colombiaApiService.getDepartments()
      const filtered = allDepts.filter(dept =>
        zoneDepts.some(zd => dept.name.toLowerCase() === zd.toLowerCase())
      )
      setDepartments(filtered)

      // Auto-seleccionar si solo hay un departamento
      if (filtered.length === 1) {
        setSelectedDepartment(filtered[0].id)
        setValue('department', filtered[0].name)
      }

      setLoadingDepartments(false)
    }
    loadDepartments()
  }, [])

  // Cargar ciudades filtradas por zona cuando se selecciona un departamento
  useEffect(() => {
    if (selectedDepartment) {
      const loadCities = async () => {
        setLoadingCities(true)
        const dept = departments.find(d => d.id === selectedDepartment)
        const deptName = dept?.name || ''
        const zoneMunicipalities = getMunicipalitiesByZoneAndDepartment(ACTIVE_ZONE, deptName)
        const allCities = await colombiaApiService.getCitiesByDepartment(selectedDepartment)
        const filtered = allCities.filter(city =>
          zoneMunicipalities.some(zm => city.name.toLowerCase() === zm.toLowerCase())
        )
        setCities(filtered)
        setLoadingCities(false)
      }
      loadCities()
    } else {
      setCities([])
    }
  }, [selectedDepartment])

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    const department = departments.find(d => d.name === value)
    setSelectedDepartment(department ? department.id : null)
    setValue('city', '')
  }

  return (
    <div className="survey-form">
      <div className="survey-form__container">
        {/* Video Section - Solo mostrar si está dispuesto a responder */}
        {videoUrl && willingToRespond && (
          <div className="survey-form__video-section">
              <video
              className="survey-form__video"
              src={videoUrl}
              controls
            />
          </div>
        )}

        {/* Form Title */}
        <div className="survey-form__header">
          <h1 className="survey-form__title">Datos del Participante</h1>
          <p className="survey-form__subtitle">Complete la información para registrar la sesión</p>
        </div>

        {/* Error Message */}
        {error && <div className="error-message">{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit((data) => {onSubmit(data)
        })} className="survey-form__form">
          {/* Información Previa de la Encuesta */}
          <div className="form-section">
            <h3 className="form-section__title">Información de la Visita</h3>
            
            {/* Willing to Respond */}
            <div className="form-group">
              <label className="form-group__label">
                ¿La persona está dispuesta a responder la encuesta?
              </label>
              <div className="radio-group">
                <label className="radio-option">
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
                <label className="radio-option">
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
              <div className="form-group">
                <label className="form-group__label">
                  ¿Autoriza que grabemos el audio de esta entrevista para fines de control de calidad? *
                </label>
                <div className="radio-group">
                  <label className="radio-option">
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
                  <label className="radio-option">
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
                  <p className="form-group__error">{errors.audioRecordingConsent.message}</p>
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
            <div className="form-section">
              <h3 className="form-section__title">Datos del Encuestado</h3>
            
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
              <div className="survey-form__row">
                <div className="survey-form__col">
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

                <div className="survey-form__col">
                  <Input
                    id="identification"
                    type="text"
                    label="Número de identificación"
                    placeholder="Ej: 1234567890"
                    disabled={isLoading}
                    required={willingToRespond}
                    error={errors.identification?.message}
                    {...register('identification', {
                      required: willingToRespond ? 'El número de identificación es requerido' : false,
                    })}
                  />
                </div>
              </div>

              {/* Email and Phone - Row */}
              <div className="survey-form__row">
                <div className="survey-form__col">
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

                <div className="survey-form__col">
                  <Input
                    id="phone"
                    type="tel"
                    label="Teléfono"
                    placeholder="Ej: 300 123 4567"
                    disabled={isLoading}
                    error={errors.phone?.message}
                    {...register('phone', {
                      pattern: {
                        value: /^[0-9\s-+()]*$/,
                        message: 'Por favor ingresa un teléfono válido',
                      },
                    })}
                  />
                </div>

                <div className="survey-form__col">
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
              <div className="survey-form__row">
                <div className="survey-form__col">
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

                <div className="survey-form__col">
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

              {/* Region (hidden) and Department */}
              <input type="hidden" {...register('region')} />
              
              <div className="survey-form__row">
                <div className="survey-form__col">
                  <Select
                    id="department"
                    label="Departamento"
                    placeholder="Seleccione departamento"
                    options={departments.map((dept) => ({
                      value: dept.name,
                      label: dept.name,
                    }))}
                    disabled={isLoading || loadingDepartments}
                    required={willingToRespond}
                    error={errors.department?.message}
                    {...register('department', {
                      required: willingToRespond ? 'El departamento es requerido' : false,
                    })}
                    onChange={handleDepartmentChange}
                  />
                </div>
                
                <div className="survey-form__col">
                  <Select
                    id="city"
                    label="Ciudad"
                    placeholder="Seleccione ciudad"
                    options={cities.map((city) => ({
                      value: city.name,
                      label: city.name,
                    }))}
                    disabled={isLoading || loadingCities || !selectedDepartment}
                    required={willingToRespond}
                    error={errors.city?.message}
                    {...register('city', {
                      required: willingToRespond ? 'La ciudad es requerida' : false,
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

          {/* Defensor de la Patria y Casa Vinculada - Checkboxes lado a lado - Solo mostrar si está dispuesto */}
          {willingToRespond && (
            <div className="survey-form__row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group">
                <div className="form-group__checkbox-wrapper">
                  <input
                    id="defendorDePatria"
                    type="checkbox"
                    className="form-group__checkbox"
                    disabled={isLoading}
                    {...register('defendorDePatria')}
                  />
                  <label htmlFor="defendorDePatria" className="form-group__checkbox-label">
                    Defensor de la Patria
                  </label>
                </div>
              </div>

              <div className="form-group">
                <div className="form-group__checkbox-wrapper">
                  <input
                    id="isLinkedHouse"
                    type="checkbox"
                    className="form-group__checkbox"
                    disabled={isLoading}
                    {...register('isLinkedHouse')}
                  />
                  <label htmlFor="isLinkedHouse" className="form-group__checkbox-label">
                    Casa Vinculada
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="survey-form__button"
            disabled={isLoading || !isValid}
          >
            {isLoading ? 'Guardando visita...' : 'Guardar visita'}
          </button>
        </form>
      </div>
    </div>
  )
}

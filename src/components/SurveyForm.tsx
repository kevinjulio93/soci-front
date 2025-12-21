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
  EXTERNAL_URLS,
} from '../constants'
import { Respondent } from '../models/Respondent'
import type { SurveyFormData, SurveyFormProps } from './types'
import { colombiaApiService, type Region, type Department, type City } from '../services/colombia-api.service'
import '../styles/SurveyForm.scss'

export function SurveyForm({
  videoUrl,
  onSubmit,
  isLoading = false,
  error,
  initialData,
  onWillingToRespondChange,
}: SurveyFormProps) {
  const [regions, setRegions] = useState<Region[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null)
  const [loadingRegions, setLoadingRegions] = useState(false)
  const [loadingDepartments, setLoadingDepartments] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<SurveyFormData>({
    mode: 'onBlur',
    defaultValues: initialData || new Respondent().toFormData(),
  })

  // Watch willingToRespond to show/hide noResponseReason field
  const willingToRespond = watch('willingToRespond')

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

  // Cargar regiones al montar el componente (solo Caribe)
  useEffect(() => {
    const loadRegions = async () => {
      setLoadingRegions(true)
      const data = await colombiaApiService.getRegions()
      // Filtrar solo la región Caribe
      const filteredRegions = data.filter(region => region.name.toLowerCase() === 'caribe')
      setRegions(filteredRegions)
      setLoadingRegions(false)
    }
    loadRegions()
  }, [])

  // Cargar departamentos cuando se selecciona una región (solo Atlántico)
  useEffect(() => {
    if (selectedRegion) {
      const loadDepartments = async () => {
        setLoadingDepartments(true)
        const data = await colombiaApiService.getDepartmentsByRegion(selectedRegion)
        // Filtrar solo el departamento de Atlántico
        const filteredDepartments = data.filter(dept => 
          dept.name.toLowerCase() === 'atlántico' || dept.name.toLowerCase() === 'atlantico'
        )
        setDepartments(filteredDepartments)
        setLoadingDepartments(false)
        setCities([]) // Limpiar ciudades
        setSelectedDepartment(null)
      }
      loadDepartments()
    } else {
      setDepartments([])
      setCities([])
    }
  }, [selectedRegion])

  // Cargar ciudades cuando se selecciona un departamento (solo Barranquilla y Soledad)
  useEffect(() => {
    if (selectedDepartment) {
      const loadCities = async () => {
        setLoadingCities(true)
        const data = await colombiaApiService.getCitiesByDepartment(selectedDepartment)
        // Filtrar solo Barranquilla y Soledad
        const filteredCities = data.filter(city => 
          city.name.toLowerCase() === 'barranquilla' || city.name.toLowerCase() === 'soledad'
        )
        setCities(filteredCities)
        setLoadingCities(false)
      }
      loadCities()
    } else {
      setCities([])
    }
  }, [selectedDepartment])

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    const region = regions.find(r => r.name === value)
    setSelectedRegion(region ? region.id : null)
    setValue('department', '')
    setValue('city', '')
  }

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
              src={EXTERNAL_URLS.VIDEO_INTRO}
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
        <form onSubmit={handleSubmit(onSubmit)} className="survey-form__form">
          {/* Información Previa de la Encuesta */}
          <div className="form-section">
            <h3 className="form-section__title">Información de la Visita</h3>
            
            {/* Willing to Respond */}
            <div className="form-group">
              <div className="form-group__checkbox-wrapper">
                <input
                  id="willingToRespond"
                  type="checkbox"
                  className="form-group__checkbox"
                  disabled={isLoading}
                  {...register('willingToRespond', {
                    onChange: (e) => {
                      onWillingToRespondChange?.(e.target.checked)
                    }
                  })}
                />
                <label htmlFor="willingToRespond" className="form-group__checkbox-label">
                  ¿La persona está dispuesta a responder la encuesta?
                </label>
              </div>
            </div>

            {/* No Response Reason - Mostrar solo si NO está dispuesto */}
            {!willingToRespond && (
              <div className="form-group">
                <label htmlFor="noResponseReason" className="form-group__label">
                  Razón de no respuesta <span className="form-group__required">*</span>
                </label>
                <select
                  id="noResponseReason"
                  className={`form-group__select ${errors.noResponseReason ? 'form-group__select--error' : ''}`}
                  disabled={isLoading}
                  {...register('noResponseReason', {
                    required: !willingToRespond ? 'Por favor selecciona una razón' : false,
                  })}
                >
                  <option value="">Seleccione una razón</option>
                  {NO_RESPONSE_REASONS.map(reason => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
                {errors.noResponseReason && (
                  <span className="form-group__error-text">{errors.noResponseReason.message}</span>
                )}
              </div>
            )}
          </div>

          {/* Datos del Respondente - Solo mostrar si está dispuesto */}
          {willingToRespond && (
            <div className="form-section">
              <h3 className="form-section__title">Datos del Encuestado</h3>
            
              {/* Full Name */}
              <div className="form-group">
                <label htmlFor="fullName" className="form-group__label">
                  Nombre completo <span className="form-group__required">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  className={`form-group__input ${errors.fullName ? 'form-group__input--error' : ''}`}
                  placeholder="Nombre y Apellido"
                  disabled={isLoading}
                  {...register('fullName', {
                    required: 'El nombre completo es requerido',
                    minLength: {
                      value: 3,
                      message: 'El nombre debe tener al menos 3 caracteres',
                    },
                    setValueAs: (value) => value?.toUpperCase() || '',
                  })}
                />
                {errors.fullName && (
                  <span className="form-group__error-text">{errors.fullName.message}</span>
                )}
              </div>

              {/* ID Type and Identification - Row */}
              <div className="survey-form__row">
                <div className="form-group survey-form__col">
                  <label htmlFor="idType" className="form-group__label">
                    Tipo de identificación <span className="form-group__required">*</span>
                  </label>
                  <select
                    id="idType"
                    className={`form-group__select ${errors.idType ? 'form-group__select--error' : ''}`}
                    disabled={isLoading}
                    {...register('idType', {
                      required: 'Por favor selecciona un tipo de identificación',
                    })}
                  >
                    <option value="">Seleccione tipo</option>
                    {ID_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.idType && (
                    <span className="form-group__error-text">{errors.idType.message}</span>
                  )}
                </div>

                <div className="form-group survey-form__col">
                  <label htmlFor="identification" className="form-group__label">
                    Número de identificación <span className="form-group__required">*</span>
                  </label>
                  <input
                    id="identification"
                    type="text"
                    className={`form-group__input ${errors.identification ? 'form-group__input--error' : ''}`}
                    placeholder="Ej: 1234567890"
                    disabled={isLoading}
                    {...register('identification', {
                      required: 'El número de identificación es requerido',
                    })}
                  />
                  {errors.identification && (
                    <span className="form-group__error-text">{errors.identification.message}</span>
                  )}
                </div>
              </div>

              {/* Email and Phone - Row */}
              <div className="survey-form__row">
                <div className="form-group survey-form__col">
                  <label htmlFor="email" className="form-group__label">
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={`form-group__input ${errors.email ? 'form-group__input--error' : ''}`}
                    placeholder="correo@ejemplo.com"
                    disabled={isLoading}
                    {...register('email', {
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Por favor ingresa un correo válido',
                      },
                    })}
                  />
                  {errors.email && (
                    <span className="form-group__error-text">{errors.email.message}</span>
                  )}
                </div>

                <div className="form-group survey-form__col">
                  <label htmlFor="phone" className="form-group__label">
                    Teléfono
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    className={`form-group__input ${errors.phone ? 'form-group__input--error' : ''}`}
                    placeholder="Ej: 300 123 4567"
                    disabled={isLoading}
                    {...register('phone', {
                      pattern: {
                        value: /^[0-9\s-+()]*$/,
                        message: 'Por favor ingresa un teléfono válido',
                      },
                    })}
                  />
                  {errors.phone && (
                    <span className="form-group__error-text">{errors.phone.message}</span>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="form-group">
                <label htmlFor="address" className="form-group__label">
                  Dirección
                </label>
                <input
                  id="address"
                  type="text"
                  className={`form-group__input ${errors.address ? 'form-group__input--error' : ''}`}
                  placeholder="Calle # Carrera # Apartamento"
                  disabled={isLoading}
                  {...register('address')}
                />
                {errors.address && (
                  <span className="form-group__error-text">{errors.address.message}</span>
                )}
              </div>

              {/* Gender and Stratum - Row */}
              <div className="survey-form__row">
                <div className="form-group survey-form__col">
                  <label htmlFor="gender" className="form-group__label">
                    Género
                  </label>
                  <select
                    id="gender"
                    className={`form-group__select ${errors.gender ? 'form-group__select--error' : ''}`}
                    disabled={isLoading}
                    {...register('gender')}
                  >
                    <option value="">Seleccione género</option>
                    {GENDER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.gender && (
                    <span className="form-group__error-text">{errors.gender.message}</span>
                  )}
                </div>

                <div className="form-group survey-form__col">
                  <label htmlFor="stratum" className="form-group__label">
                    Estrato
                  </label>
                  <select
                    id="stratum"
                    className={`form-group__select ${errors.stratum ? 'form-group__select--error' : ''}`}
                    disabled={isLoading}
                    {...register('stratum')}
                  >
                    <option value="">Seleccione estrato</option>
                    {STRATUM_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.stratum && (
                    <span className="form-group__error-text">{errors.stratum.message}</span>
                  )}
                </div>
              </div>

              {/* Age Range */}
              <div className="form-group">
                <label htmlFor="ageRange" className="form-group__label">
                  Rango de edad
                </label>
                <select
                  id="ageRange"
                  className={`form-group__select ${errors.ageRange ? 'form-group__select--error' : ''}`}
                  disabled={isLoading}
                  {...register('ageRange')}
                >
                  <option value="">Seleccione rango</option>
                  {AGE_RANGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.ageRange && (
                  <span className="form-group__error-text">{errors.ageRange.message}</span>
                )}
              </div>

              {/* Region and Department - Row */}
              <div className="survey-form__row">
                <div className="form-group survey-form__col">
                  <label htmlFor="region" className="form-group__label">
                    Región
                  </label>
                  <select
                    id="region"
                    className={`form-group__select ${errors.region ? 'form-group__select--error' : ''}`}
                    disabled={isLoading || loadingRegions}
                    {...register('region')}
                    onChange={handleRegionChange}
                  >
                    <option value="">Seleccione región</option>
                    {regions.map((region) => (
                      <option key={region.id} value={region.name}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                  {errors.region && (
                    <span className="form-group__error-text">{errors.region.message}</span>
                  )}
                </div>

                <div className="form-group survey-form__col">
                  <label htmlFor="department" className="form-group__label">
                    Departamento
                  </label>
                  <select
                    id="department"
                    className={`form-group__select ${errors.department ? 'form-group__select--error' : ''}`}
                    disabled={isLoading || loadingDepartments || !selectedRegion}
                    {...register('department')}
                    onChange={handleDepartmentChange}
                  >
                    <option value="">Seleccione departamento</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  {errors.department && (
                    <span className="form-group__error-text">{errors.department.message}</span>
                  )}
                </div>
              </div>

              {/* City and Neighborhood - Row */}
              <div className="survey-form__row">
                <div className="form-group survey-form__col">
                  <label htmlFor="city" className="form-group__label">
                    Ciudad
                  </label>
                  <select
                    id="city"
                    className={`form-group__select ${errors.city ? 'form-group__select--error' : ''}`}
                    disabled={isLoading || loadingCities || !selectedDepartment}
                    {...register('city')}
                  >
                    <option value="">Seleccione ciudad</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.name}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                  {errors.city && (
                    <span className="form-group__error-text">{errors.city.message}</span>
                  )}
                </div>

                <div className="form-group survey-form__col">
                  <label htmlFor="neighborhood" className="form-group__label">
                    Barrio
                  </label>
                  <input
                    id="neighborhood"
                    type="text"
                    className={`form-group__input ${errors.neighborhood ? 'form-group__input--error' : ''}`}
                    placeholder="Ej: Prado, Villa Country"
                    disabled={isLoading}
                    {...register('neighborhood')}
                  />
                  {errors.neighborhood && (
                    <span className="form-group__error-text">{errors.neighborhood.message}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Defensor de la Patria - Checkbox - Solo mostrar si está dispuesto */}
          {willingToRespond && (
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
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="survey-form__button"
            disabled={isLoading}
          >
            {isLoading ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      </div>
    </div>
  )
}

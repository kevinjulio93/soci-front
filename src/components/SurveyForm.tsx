/**
 * SurveyForm - Componente presentacional para el formulario de encuesta
 * Principio: Single Responsibility (solo renderiza el formulario)
 * Utiliza React Hook Form para validaciones y manejo de estado
 */

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  ID_TYPE_OPTIONS,
  GENDER_OPTIONS,
  AGE_RANGE_OPTIONS,
  STRATUM_OPTIONS,
} from '../constants/formOptions'
import '../styles/SurveyForm.scss'

interface SurveyFormData {
  fullName: string
  idType: 'CC' | 'TI' | 'CE' | 'PA' | 'RC' | 'NIT' | ''
  identification: string
  email: string
  phone: string
  address: string
  gender: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir' | ''
  ageRange: '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+' | ''
  region: string
  department: string
  city: string
  stratum: '1' | '2' | '3' | '4' | '5' | '6' | ''
  neighborhood: string
}

interface SurveyFormProps {
  videoUrl?: string
  onSubmit: (data: SurveyFormData) => Promise<void>
  isLoading?: boolean
  error?: string | null
  isRecording?: boolean
  initialData?: SurveyFormData | null
}

export function SurveyForm({
  videoUrl,
  onSubmit,
  isLoading = false,
  error,
  isRecording = false,
  initialData,
}: SurveyFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SurveyFormData>({
    mode: 'onBlur',
    values: initialData || {
      fullName: '',
      idType: '',
      identification: '',
      email: '',
      phone: '',
      address: '',
      gender: '',
      ageRange: '',
      region: '',
      department: '',
      city: '',
      stratum: '',
      neighborhood: '',
    },
  })

  return (
    <div className="survey-form">
      <div className="survey-form__container">
        {/* Video Section */}
        {videoUrl && (
          <div className="survey-form__video-section">
            <iframe
              className="survey-form__video"
              src={videoUrl}
              title="Survey Video"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
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
                <option value="">1 - 6</option>
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
              <input
                id="region"
                type="text"
                className={`form-group__input ${errors.region ? 'form-group__input--error' : ''}`}
                placeholder="Región geográfica"
                disabled={isLoading}
                {...register('region')}
              />
              {errors.region && (
                <span className="form-group__error-text">{errors.region.message}</span>
              )}
            </div>

            <div className="form-group survey-form__col">
              <label htmlFor="department" className="form-group__label">
                Departamento
              </label>
              <input
                id="department"
                type="text"
                className={`form-group__input ${errors.department ? 'form-group__input--error' : ''}`}
                placeholder="Departamento"
                disabled={isLoading}
                {...register('department')}
              />
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
              <input
                id="city"
                type="text"
                className={`form-group__input ${errors.city ? 'form-group__input--error' : ''}`}
                placeholder="Barranquilla"
                disabled={isLoading}
                {...register('city')}
              />
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

          {/* Submit Button */}
          <button
            type="submit"
            className="survey-form__button"
            disabled={isLoading}
          >
            {isLoading ? 'Guardando...' : '➤ Guardar y Continuar'}
          </button>
        </form>
      </div>
    </div>
  )
}

/**
 * Table Columns - Definiciones de columnas para las tablas
 * Configuraciones reutilizables de columnas para DataTable
 */

import type { TableColumn } from '../components'
import type { RespondentData } from '../models/ApiResponses'
import type { Survey, Socializer } from '../types'
import { getAvatarColor, getInitials, getFirstName, translateRole, getRejectionReasonLabel } from '../utils'

export const getSurveysTableColumns = (
  formatDate: (dateString: string) => string,
  handleViewDetails: (id: string) => void,
  onDelete?: (id: string, name: string) => void
): TableColumn<RespondentData>[] => [
  {
    key: 'name',
    header: 'ENCUESTADO',
    render: (survey) => {
      // Determinar si es una encuesta no respondida
      const isUnsuccessful = survey.surveyStatus === 'unsuccessful'
      const reason = getRejectionReasonLabel(survey.noResponseReason ?? survey.rejectionReason)
      const displayName = isUnsuccessful ? '' : getFirstName(survey.fullName)
      const tooltipText = isUnsuccessful ? reason : survey.fullName
      
      return (
        <div className="respondent" title={tooltipText}>
          <div
            className="respondent__avatar"
            style={{ backgroundColor: getAvatarColor(survey.fullName) }}
            title={tooltipText}
          >
            {getInitials(survey.fullName)}
          </div>
          <div className="respondent__details" title={tooltipText}>
            {isUnsuccessful ? (
              <span 
                className="respondent__reason" 
                style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 600, display: 'block' }}
                title={reason}
              >
                {reason}
              </span>
            ) : (
              <span className="respondent__name" title={tooltipText}>{displayName}</span>
            )}
          </div>
        </div>
      )
    },
    className: 'survey-table__td--respondent'
  },
  {
    key: 'author',
    header: 'AUTOR',
    render: (survey) => {
      const authorEmail = survey.autor?.email
      
      return (
        <div className="contact-info">
          <span className="contact-email">{authorEmail || <span className="text-muted">—</span>}</span>
        </div>
      )
    }
  },
  {
    key: 'idType',
    header: 'TIPO ID',
    render: (survey) => {
      const isUnsuccessful = survey.surveyStatus === 'unsuccessful'
      return (
        <span className="id-type">{survey.idType || <span className="badge badge-empty">{isUnsuccessful ? getRejectionReasonLabel(survey.noResponseReason ?? survey.rejectionReason) : '—'}</span>}</span>
      )
    }
  },
  {  key: 'identification',
    header: 'N° IDENTIFICACIÓN',
    render: (survey) => {
      const isUnsuccessful = survey.surveyStatus === 'unsuccessful'
      if (!survey.identification) {
        return <span className="badge badge-empty">{isUnsuccessful ? getRejectionReasonLabel(survey.noResponseReason ?? survey.rejectionReason) : '—'}</span>
      }
      return <span className="id-number">{survey.identification}</span>
    }
  },
  {
    key: 'contact',
    header: 'TELÉFONO',
    render: (survey) => {
      const isUnsuccessful = survey.surveyStatus === 'unsuccessful'
      return (
        <span className="contact-phone">{survey.phone || <span className="badge badge-empty">{isUnsuccessful ? getRejectionReasonLabel(survey.noResponseReason ?? survey.rejectionReason) : '—'}</span>}</span>
      )
    }
  },
  {
    key: 'gender',
    header: 'GÉNERO',
    render: (survey) => {
      const isUnsuccessful = survey.surveyStatus === 'unsuccessful'
      if (!survey.gender) return <span className="badge badge-empty">{isUnsuccessful ? getRejectionReasonLabel(survey.noResponseReason ?? survey.rejectionReason) : '—'}</span>
      const genderClass = survey.gender?.toLowerCase() === 'masculino' ? 'badge-blue' : 
                          survey.gender?.toLowerCase() === 'femenino' ? 'badge-pink' : 'badge-gray'
      return (
        <span className={`badge ${genderClass}`}>
          {survey.gender}
        </span>
      )
    }
  },
  {
    key: 'age',
    header: 'EDAD',
    render: (survey) => {
      const isUnsuccessful = survey.surveyStatus === 'unsuccessful'
      if (!survey.ageRange) return <span className="badge badge-empty">{isUnsuccessful ? getRejectionReasonLabel(survey.noResponseReason ?? survey.rejectionReason) : '—'}</span>
      const getAgeClass = (range: string) => {
        if (range?.includes('18-25')) return 'badge-green'
        if (range?.includes('26-35')) return 'badge-teal'
        if (range?.includes('36-45')) return 'badge-orange'
        if (range?.includes('46-60')) return 'badge-purple'
        if (range?.includes('60')) return 'badge-brown'
        return 'badge-gray'
      }
      return <span className={`badge ${getAgeClass(survey.ageRange)}`}>{survey.ageRange}</span>
    }
  },
  {
    key: 'stratum',
    header: 'ESTRATO',
    render: (survey) => {
      const isUnsuccessful = survey.surveyStatus === 'unsuccessful'
      if (!survey.stratum) return <span className="badge badge-empty">{isUnsuccessful ? getRejectionReasonLabel(survey.noResponseReason ?? survey.rejectionReason) : '—'}</span>
      const getStratumClass = (stratum: number) => {
        if (stratum <= 2) return 'badge-red'
        if (stratum <= 4) return 'badge-yellow'
        return 'badge-indigo'
      }
      return (
        <span className={`badge ${getStratumClass(survey.stratum)}`}>
          Estrato {survey.stratum}
        </span>
      )
    }
  },
  {
    key: 'date',
    header: 'FECHA',
    render: (survey) => formatDate(survey.createdAt),
    className: 'survey-table__td--date'
  },
  {
    key: 'actions' as const,
    header: 'ACCIONES',
    render: (survey: RespondentData) => (
      <div className="action-buttons">
        <span
          className="action-icon action-icon--view"
          onClick={() => handleViewDetails(survey._id)}
          title="Ver detalles"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#2d4a5f">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
          </svg>
        </span>
        {onDelete && (
          <span
            className="action-icon action-icon--delete"
            onClick={() => onDelete(survey._id, survey.fullName || 'Encuestado')}
            title="Eliminar encuestado"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#2d4a5f">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </span>
        )}
      </div>
    )
  }
]

// Columnas para tabla de encuestas en dashboard de socializador (con editar en lugar de ver detalles)
export const getSocializerSurveysTableColumns = (
  formatDate: (dateString: string) => string,
  handleEditSurvey: (id: string) => void
): TableColumn<RespondentData>[] => [
  {
    key: 'name',
    header: 'ENCUESTADO',
    render: (survey) => {
      // Determinar si es una encuesta no respondida
      const isUnsuccessful = survey.surveyStatus === 'unsuccessful'
      const reason = getRejectionReasonLabel(survey.noResponseReason ?? survey.rejectionReason)
      const displayName = isUnsuccessful ? '' : getFirstName(survey.fullName)
      const tooltipText = isUnsuccessful ? reason : survey.fullName
      
      return (
        <div className="respondent" title={tooltipText}>
          <div
            className="respondent__avatar"
            style={{ backgroundColor: getAvatarColor(survey.fullName) }}
            title={tooltipText}
          >
            {getInitials(survey.fullName)}
          </div>
          <div className="respondent__details" title={tooltipText}>
            {isUnsuccessful ? (
              <span 
                className="respondent__reason" 
                style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 600, display: 'block' }}
                title={reason}
              >
                {reason}
              </span>
            ) : (
              <span className="respondent__name" title={tooltipText}>{displayName}</span>
            )}
          </div>
        </div>
      )
    },
    className: 'survey-table__td--respondent'
  },
  {
    key: 'author',
    header: 'AUTOR',
    render: (survey) => {
      const authorEmail = survey.autor?.email
      
      return (
        <div className="contact-info">
          <span className="contact-email">{authorEmail || <span className="text-muted">—</span>}</span>
        </div>
      )
    }
  },
  {
    key: 'idType',
    header: 'TIPO ID',
    render: (survey) => {
      const isUnsuccessful = survey.surveyStatus === 'unsuccessful'
      return (
        <span className="id-type">{survey.idType || <span className="badge badge-empty">{isUnsuccessful ? getRejectionReasonLabel(survey.noResponseReason ?? survey.rejectionReason) : '—'}</span>}</span>
      )
    }
  },
  {  key: 'identification',
    header: 'N° IDENTIFICACIÓN',
    render: (survey) => {
      const isUnsuccessful = survey.surveyStatus === 'unsuccessful'
      if (!survey.identification) {
        return <span className="badge badge-empty">{isUnsuccessful ? getRejectionReasonLabel(survey.noResponseReason ?? survey.rejectionReason) : '—'}</span>
      }
      return <span className="id-number">{survey.identification}</span>
    }
  },
  {
    key: 'contact',
    header: 'TELÉFONO',
    render: (survey) => {
      const isUnsuccessful = survey.surveyStatus === 'unsuccessful'
      return (
        <span className="contact-phone">{survey.phone || <span className="badge badge-empty">{isUnsuccessful ? getRejectionReasonLabel(survey.noResponseReason ?? survey.rejectionReason) : '—'}</span>}</span>
      )
    }
  },
  {
    key: 'gender',
    header: 'GÉNERO',
    render: (survey) => {
      const isUnsuccessful = survey.surveyStatus === 'unsuccessful'
      if (!survey.gender) return <span className="badge badge-empty">{isUnsuccessful ? getRejectionReasonLabel(survey.noResponseReason ?? survey.rejectionReason) : '—'}</span>
      const genderClass = survey.gender?.toLowerCase() === 'masculino' ? 'badge-blue' : 
                          survey.gender?.toLowerCase() === 'femenino' ? 'badge-pink' : 'badge-gray'
      return (
        <span className={`badge ${genderClass}`}>
          {survey.gender}
        </span>
      )
    }
  },
  {
    key: 'age',
    header: 'EDAD',
    render: (survey) => {
      const isUnsuccessful = survey.surveyStatus === 'unsuccessful'
      if (!survey.ageRange) return <span className="badge badge-empty">{isUnsuccessful ? getRejectionReasonLabel(survey.noResponseReason ?? survey.rejectionReason) : '—'}</span>
      const getAgeClass = (range: string) => {
        if (range?.includes('18-25')) return 'badge-green'
        if (range?.includes('26-35')) return 'badge-teal'
        if (range?.includes('36-45')) return 'badge-orange'
        if (range?.includes('46-60')) return 'badge-purple'
        if (range?.includes('60')) return 'badge-brown'
        return 'badge-gray'
      }
      return <span className={`badge ${getAgeClass(survey.ageRange)}`}>{survey.ageRange}</span>
    }
  },
  {
    key: 'stratum',
    header: 'ESTRATO',
    render: (survey) => {
      const isUnsuccessful = survey.surveyStatus === 'unsuccessful'
      if (!survey.stratum) return <span className="badge badge-empty">{isUnsuccessful ? getRejectionReasonLabel(survey.noResponseReason ?? survey.rejectionReason) : '—'}</span>
      const getStratumClass = (stratum: number) => {
        if (stratum <= 2) return 'badge-red'
        if (stratum <= 4) return 'badge-yellow'
        return 'badge-indigo'
      }
      return (
        <span className={`badge ${getStratumClass(survey.stratum)}`}>
          Estrato {survey.stratum}
        </span>
      )
    }
  },
  {
    key: 'date',
    header: 'FECHA',
    render: (survey) => formatDate(survey.createdAt),
    className: 'survey-table__td--date'
  },
  {
    key: 'actions' as const,
    header: 'ACCIONES',
    render: (survey: RespondentData) => {
      const isUnsuccessful = survey.surveyStatus === 'unsuccessful'
      
      // Si es unsuccessful, no mostrar ninguna acción
      if (isUnsuccessful) {
        return <div className="action-buttons"></div>
      }
      
      return (
        <div className="action-buttons">
          <span
            className="action-icon action-icon--edit"
            onClick={() => handleEditSurvey(survey._id)}
            title="Editar encuesta"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#2d4a5f">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </span>
        </div>
      )
    }
  }
]

export const getSocializersTableColumns = (
  onEdit: (socializer: Socializer) => void,
  onDelete: (id: string, name: string) => void,
  onViewLocation: (socializer: Socializer) => void,
  isLoading: boolean,
  isReadOnly: boolean = false
): TableColumn<Socializer>[] => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return <span className="badge badge-empty">—</span>
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return [
    {
      key: 'name',
      header: 'USUARIO',
      render: (socializer) => (
        <div className="respondent">
          <div
            className="respondent__avatar"
            style={{ backgroundColor: getAvatarColor(socializer.fullName) }}
          >
            {getInitials(socializer.fullName)}
          </div>
          <div className="respondent__details">
            <span className="respondent__name">{getFirstName(socializer.fullName)}</span>
          </div>
        </div>
      ),
      className: 'survey-table__td--respondent'
    },
    {
      key: 'identification',
      header: 'IDENTIFICACIÓN',
      render: (socializer) => (
        <span className="id-number">{socializer.idNumber}</span>
      )
    },
    {
      key: 'contact',
      header: 'CONTACTO',
      render: (socializer) => (
        <span className="contact-phone">{socializer.user?.email || <span className="badge badge-empty">—</span>}</span>
      )
    },
    {
      key: 'role',
      header: 'ROL',
      render: (socializer) => {
        const role = typeof socializer.user?.role === 'object' ? socializer.user.role.role : ''
        if (!role) return <span className="badge badge-empty">—</span>
        const roleClass = role.toLowerCase() === 'admin' ? 'badge-purple' : 
                          role.toLowerCase() === 'socializer' || role.toLowerCase() === 'socializador' ? 'badge-blue' : 'badge-gray'
        return (
          <span className={`badge ${roleClass}`}>
            {translateRole(role)}
          </span>
        )
      }
    },
    {
      key: 'status',
      header: 'ESTADO',
      render: (socializer) => (
        <span
          className={`badge ${
            socializer.status === 'enabled' ? 'badge-success' : 'badge-danger'
          }`}
        >
          {socializer.status === 'enabled' ? 'Habilitado' : 'Deshabilitado'}
        </span>
      )
    },
    {
      key: 'date',
      header: 'FECHA REGISTRO',
      render: (socializer) => formatDate(socializer.createdAt),
      className: 'survey-table__td--date'
    },
    {
      key: 'actions',
      header: 'ACCIONES',
      render: (socializer) => {
        const roleStr = typeof socializer.user?.role === 'object' ? socializer.user.role.role : ''
        const isAdmin = roleStr === 'admin'
        const isCoordinator = roleStr === 'coordinador' || roleStr === 'coordinator'
        const cannotDelete = isAdmin || isCoordinator
        const cannotViewLocation = isAdmin || isCoordinator
        
        // Si es readOnly, solo mostrar ubicación
        if (isReadOnly) {
          return (
            <div className="action-buttons">
              {!cannotViewLocation && (
                <span
                  className="action-icon action-icon--location"
                  onClick={() => !isLoading && onViewLocation(socializer)}
                  title="Ver ubicación en tiempo real"
                  style={{ opacity: isLoading ? 0.5 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#2d4a5f">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </span>
              )}
            </div>
          )
        }
        
        return (
          <div className="action-buttons">
            {!cannotViewLocation && (
              <span
                className="action-icon action-icon--location"
                onClick={() => !isLoading && onViewLocation(socializer)}
                title="Ver ubicación en tiempo real"
                style={{ opacity: isLoading ? 0.5 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#2d4a5f">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </span>
            )}
            <span
              className="action-icon action-icon--edit"
              onClick={() => !isLoading && onEdit(socializer)}
              title="Editar usuario"
              style={{ opacity: isLoading ? 0.5 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#2d4a5f">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </span>
            {!cannotDelete && (
              <span
                className="action-icon action-icon--delete"
                onClick={() => !isLoading && onDelete(socializer._id, socializer.fullName)}
                title="Eliminar usuario"
                style={{ opacity: isLoading ? 0.5 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#2d4a5f">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
              </span>
            )}
          </div>
        )
      }
    }
  ]
}

export const getRespondentsTableColumns = (
  onViewDetails?: (surveyId: string) => void
): TableColumn<Survey>[] => [
  {
    key: 'name',
    header: 'ENCUESTADO',
    render: (survey) => (
      <div className="respondent">
        <div
          className="respondent__avatar"
          style={{ backgroundColor: getAvatarColor(survey.title) }}
        >
          {getInitials(survey.title)}
        </div>
        <div className="respondent__details">
          <span className="respondent__name">{ survey.title }</span>
        </div>
      </div>
    ),
    className: 'survey-table__td--respondent'
  },
  {
    key: 'idType',
    header: 'TIPO ID',
    render: (survey) => (
      <span className="id-type">{survey.idType || <span className="badge badge-empty">—</span>}</span>
    )
  },
  {
    key: 'identification',
    header: 'N° IDENTIFICACIÓN',
    render: (survey) => (
      <span className="id-number">{survey.identification || <span className="badge badge-empty">—</span>}</span>
    )
  },
  {
    key: 'contact',
    header: 'TELÉFONO',
    render: (survey) => (
      <span className="contact-phone">{survey.phone || <span className="badge badge-empty">—</span>}</span>
    )
  },
  {
    key: 'gender',
    header: 'GÉNERO',
    render: (survey) => {
      if (!survey.gender) return <span className="badge badge-empty">—</span>
      const genderClass = survey.gender?.toLowerCase() === 'masculino' ? 'badge-blue' : 
                          survey.gender?.toLowerCase() === 'femenino' ? 'badge-pink' : 'badge-gray'
      return <span className={`badge ${genderClass}`}>{survey.gender}</span>
    }
  },
  {
    key: 'age',
    header: 'EDAD',
    render: (survey) => {
      if (!survey.ageRange) return <span className="badge badge-empty">—</span>
      const getAgeClass = (range: string) => {
        if (range?.includes('18-25')) return 'badge-green'
        if (range?.includes('26-35')) return 'badge-teal'
        if (range?.includes('36-45')) return 'badge-orange'
        if (range?.includes('46-60')) return 'badge-purple'
        if (range?.includes('60')) return 'badge-brown'
        return 'badge-gray'
      }
      return <span className={`badge ${getAgeClass(survey.ageRange)}`}>{survey.ageRange}</span>
    }
  },
  {
    key: 'stratum',
    header: 'ESTRATO',
    render: (survey) => {
      if (!survey.stratum) return <span className="badge badge-empty">—</span>
      const getStratumClass = (stratum: number) => {
        if (stratum <= 2) return 'badge-red'
        if (stratum <= 4) return 'badge-yellow'
        return 'badge-indigo'
      }
      return (
        <span className={`badge ${getStratumClass(survey.stratum)}`}>
          Estrato {survey.stratum}
        </span>
      )
    }
  },
  {
    key: 'date',
    header: 'FECHA',
    render: (survey) => survey.date,
    className: 'survey-table__td--date'
  },
  {
    key: 'actions',
    header: 'ACCIONES',
    render: (survey) => (
      <div className="action-buttons">
        <span
          className="action-icon action-icon--edit"
          onClick={() => onViewDetails?.(survey.id)}
          title="Editar encuestado"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#2d4a5f">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
        </span>
      </div>
    )
  }
]

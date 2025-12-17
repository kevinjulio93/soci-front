/**
 * Table Columns - Definiciones de columnas para las tablas
 * Configuraciones reutilizables de columnas para DataTable
 */

import type { TableColumn } from '../components'
import type { RespondentData } from '../models/ApiResponses'
import type { Survey, Socializer } from '../types'
import { getAvatarColor, getInitials, getFirstName } from '../utils'

export const getSurveysTableColumns = (
  formatDate: (dateString: string) => string,
  handleViewDetails: (id: string) => void,
  onDelete?: (id: string, name: string) => void
): TableColumn<RespondentData>[] => [
  {
    key: 'name',
    header: 'ENCUESTADO',
    render: (survey) => (
      <div className="respondent">
        <div
          className="respondent__avatar"
          style={{ backgroundColor: getAvatarColor(survey.fullName) }}
        >
          {getInitials(survey.fullName)}
        </div>
        <div className="respondent__details">
          <span className="respondent__name">{getFirstName(survey.fullName)}</span>
        </div>
      </div>
    ),
    className: 'survey-table__td--respondent'
  },
  {
    key: 'author',
    header: 'AUTOR',
    render: (survey) => {
      const authorEmail = survey.autor?.email
      
      return (
        <div className="contact-info">
          <span className="contact-email">{authorEmail || 'N/A'}</span>
        </div>
      )
    }
  },
  {
    key: 'idType',
    header: 'TIPO ID',
    render: (survey) => (
      <span className="id-type">{survey.idType || 'N/A'}</span>
    )
  },
  {
    key: 'identification',
    header: 'N° IDENTIFICACIÓN',
    render: (survey) => (
      <span className="id-number">{survey.identification || 'N/A'}</span>
    )
  },
  {
    key: 'contact',
    header: 'TELÉFONO',
    render: (survey) => (
      <span className="contact-phone">{survey.phone || 'N/A'}</span>
    )
  },
  {
    key: 'gender',
    header: 'GÉNERO',
    render: (survey) => (
      <span className={`gender-badge gender-badge--${survey.gender?.toLowerCase()}`}>
        {survey.gender || 'N/A'}
      </span>
    )
  },
  {
    key: 'age',
    header: 'EDAD',
    render: (survey) => <span className="age-badge">{survey.ageRange || 'N/A'}</span>
  },
  {
    key: 'stratum',
    header: 'ESTRATO',
    render: (survey) => (
      <div className="stratum-info">
        {survey.stratum ? (
          <span className="stratum-badge">Estrato {survey.stratum}</span>
        ) : (
          <span>N/A</span>
        )}
      </div>
    )
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
            onClick={() => onDelete(survey._id, survey.fullName)}
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

export const getSocializersTableColumns = (
  onEdit: (socializer: Socializer) => void,
  onDelete: (id: string, name: string) => void,
  onViewLocation: (socializer: Socializer) => void,
  isLoading: boolean
): TableColumn<Socializer>[] => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
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
        <span className="contact-phone">{socializer.user?.email || 'N/A'}</span>
      )
    },
    {
      key: 'role',
      header: 'ROL',
      render: (socializer) => (
        <span className="gender-badge">
          {typeof socializer.user?.role === 'object' ? socializer.user.role.role : 'N/A'}
        </span>
      )
    },
    {
      key: 'status',
      header: 'ESTADO',
      render: (socializer) => (
        <span
          className={`age-badge ${
            socializer.status === 'enabled' ? 'age-badge--success' : 'age-badge--disabled'
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
        const isAdmin = typeof socializer.user?.role === 'object' && socializer.user.role.role === 'admin'
        
        return (
          <div className="action-buttons">
            {!isAdmin && (
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
            {!isAdmin && (
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
          <span className="respondent__name">{getFirstName(survey.title)}</span>
        </div>
      </div>
    ),
    className: 'survey-table__td--respondent'
  },
  {
    key: 'idType',
    header: 'TIPO ID',
    render: (survey) => (
      <span className="id-type">{survey.idType || 'N/A'}</span>
    )
  },
  {
    key: 'identification',
    header: 'N° IDENTIFICACIÓN',
    render: (survey) => (
      <span className="id-number">{survey.identification || 'N/A'}</span>
    )
  },
  {
    key: 'contact',
    header: 'TELÉFONO',
    render: (survey) => (
      <span className="contact-phone">{survey.phone || 'N/A'}</span>
    )
  },
  {
    key: 'gender',
    header: 'GÉNERO',
    render: (survey) => <span className="gender-badge">{survey.gender || 'N/A'}</span>
  },
  {
    key: 'age',
    header: 'EDAD',
    render: (survey) => <span className="age-badge">{survey.ageRange || 'N/A'}</span>
  },
  {
    key: 'stratum',
    header: 'ESTRATO',
    render: (survey) => (
      <div className="stratum-info">
        {survey.stratum ? (
          <span className="stratum-badge">Estrato {survey.stratum}</span>
        ) : (
          <span>N/A</span>
        )}
      </div>
    )
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

/**
 * Table Columns - Definiciones de columnas para las tablas
 * Configuraciones reutilizables de columnas para DataTable
 */

import type { TableColumn } from '../components'
import type { RespondentData } from '../models/ApiResponses'
import type { Survey, Socializer } from '../types'
import { getAvatarColor, getInitials } from '../utils'

export const getSurveysTableColumns = (
  formatDate: (dateString: string) => string,
  getAudioUrl: (audioPath: string) => string | null,
  handlePlayAudio: (id: string) => void,
  audioPlaying: string | null
): TableColumn<RespondentData>[] => [
  {
    key: 'name',
    header: 'NOMBRE',
    render: (survey) => (
      <div className="respondent">
        <div
          className="respondent__avatar"
          style={{ backgroundColor: getAvatarColor(survey.fullName) }}
        >
          {getInitials(survey.fullName)}
        </div>
        <div className="respondent__details">
          <span className="respondent__name">{survey.fullName}</span>
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
    key: 'document',
    header: 'DOCUMENTO',
    render: (survey) => (
      <div className="id-info">
        <span className="id-number">{survey.identification || 'N/A'}</span>
      </div>
    )
  },
  {
    key: 'age',
    header: 'RANGO DE EDAD',
    render: (survey) => survey.ageRange || 'N/A'
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
    key: 'city',
    header: 'CIUDAD',
    render: (survey) => survey.city || 'N/A'
  },
  {
    key: 'neighborhood',
    header: 'BARRIO',
    render: (survey) => survey.neighborhood || 'N/A'
  },
  {
    key: 'date',
    header: 'FECHA',
    render: (survey) => formatDate(survey.createdAt),
    className: 'survey-table__td--date'
  },
  {
    key: 'audio',
    header: 'AUDIO',
    render: (survey) => {
      const audioUrl = getAudioUrl(survey.audioPath || '')
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          {audioUrl ? (
            <>
              <button
                className="audio-btn"
                onClick={() => handlePlayAudio(survey._id)}
                title="Reproducir audio"
              >
                {audioPlaying === survey._id ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
              {audioPlaying === survey._id && (
                <div className="audio-player">
                  <audio
                    src={audioUrl}
                    controls
                    autoPlay
                    onEnded={() => handlePlayAudio(survey._id)}
                    className="audio-player__element"
                  />
                </div>
              )}
            </>
          ) : (
            <span className="no-audio">Sin audio</span>
          )}
        </div>
      )
    }
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
            <span className="respondent__name">{socializer.fullName}</span>
          </div>
        </div>
      ),
      className: 'survey-table__td--respondent'
    },
    {
      key: 'identification',
      header: 'IDENTIFICACIÓN',
      render: (socializer) => (
        <div className="id-info">
          <span className="id-number">{socializer.idNumber}</span>
        </div>
      )
    },
    {
      key: 'contact',
      header: 'CONTACTO',
      render: (socializer) => (
        <div className="contact-info">
          {socializer.user?.email && (
            <span className="contact-email">{socializer.user.email}</span>
          )}
          {!socializer.user?.email && <span>N/A</span>}
        </div>
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
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {!isAdmin && (
              <button
                className="action-btn action-btn--location"
                onClick={() => onViewLocation(socializer)}
                disabled={isLoading}
                title="Ver ubicación en tiempo real"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </button>
            )}
            <button
              className="action-btn action-btn--edit"
              onClick={() => onEdit(socializer)}
              disabled={isLoading}
              title="Editar usuario"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            {!isAdmin && (
              <button
                className="action-btn action-btn--delete"
                onClick={() => onDelete(socializer._id, socializer.fullName)}
                disabled={isLoading}
                title="Eliminar usuario"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
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
          <span className="respondent__name">{survey.title}</span>
        </div>
      </div>
    ),
    className: 'survey-table__td--respondent'
  },
  {
    key: 'identification',
    header: 'IDENTIFICACIÓN',
    render: (survey) => (
      <div className="id-info">
        <span className="id-type">{survey.idType || 'N/A'}</span>
        <span className="id-number">{survey.identification || 'N/A'}</span>
      </div>
    )
  },
  {
    key: 'contact',
    header: 'CONTACTO',
    render: (survey) => (
      <div className="contact-info">
        {survey.phone && <span className="contact-phone">📱 {survey.phone}</span>}
        {survey.email && <span className="contact-email">✉️ {survey.email}</span>}
        {!survey.phone && !survey.email && <span>N/A</span>}
      </div>
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
    key: 'location',
    header: 'UBICACIÓN',
    render: (survey) => (
      <div className="location-info">
        {survey.city && <span className="location-city">{survey.city}</span>}
        {survey.neighborhood && <span className="location-neighborhood">{survey.neighborhood}</span>}
        {survey.stratum && <span className="location-stratum">Estrato {survey.stratum}</span>}
        {!survey.city && !survey.neighborhood && <span>N/A</span>}
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
      <button
        className="action-btn action-btn--edit"
        onClick={() => onViewDetails?.(survey.id)}
        title="Editar encuestado"
      >
        Editar
      </button>
    )
  }
]

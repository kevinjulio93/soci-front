/**
 * SocializerTable - Tabla para mostrar la lista de socializadores
 * Usa el mismo estilo que SurveyTable
 */

import type { Socializer } from '../types'
import { Pagination } from './Pagination'
import { getAvatarColor, getInitials } from '../utils'
import '../styles/Dashboard.scss'

interface SocializerTableProps {
  socializers: Socializer[]
  currentPage: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
  onEdit: (socializer: Socializer) => void
  onDelete: (id: string) => void
  isLoading?: boolean
}

export function SocializerTable({
  socializers,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  onEdit,
  onDelete,
  isLoading = false,
}: SocializerTableProps) {
  const formatLocation = (location?: Socializer['location']) => {
    if (!location) return 'Sin ubicación'
    return `${location.lat.toFixed(4)}, ${location.long.toFixed(4)}`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="survey-table">
      <div className="survey-table__header">
        <div className="survey-table__search-row">
          <div className="survey-table__search-box">
            <input
              type="text"
              className="survey-table__search-input"
              placeholder="Buscar por nombre, identificación o email..."
            />
          </div>
        </div>
      </div>

      <div className="survey-table__wrapper">
        {!isLoading && socializers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="empty-state__title">No hay socializadores registrados</h3>
            <p className="empty-state__description">
              Comienza creando el primer socializador para tu equipo
            </p>
          </div>
        ) : (
          <table className="survey-table__table">
            <thead className="survey-table__thead">
              <tr>
                <th className="survey-table__th">SOCIALIZADOR</th>
                <th className="survey-table__th">IDENTIFICACIÓN</th>
                <th className="survey-table__th">CONTACTO</th>
                <th className="survey-table__th">ROL</th>
                <th className="survey-table__th">ESTADO</th>
                <th className="survey-table__th">UBICACIÓN</th>
                <th className="survey-table__th">FECHA REGISTRO</th>
                <th className="survey-table__th">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="survey-table__tbody">
              {isLoading ? (
                <tr className="survey-table__row">
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                    Cargando...
                  </td>
                </tr>
              ) : (
                socializers.map((socializer) => (
                  <tr key={socializer._id} className="survey-table__row">
                    <td className="survey-table__td survey-table__td--respondent">
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
                    </td>
                    <td className="survey-table__td">
                      <div className="id-info">
                        <span className="id-number">{socializer.idNumber}</span>
                      </div>
                    </td>
                    <td className="survey-table__td">
                      <div className="contact-info">
                        {socializer.user?.email && (
                          <span className="contact-email">{socializer.user.email}</span>
                        )}
                        {!socializer.user?.email && <span>N/A</span>}
                      </div>
                    </td>
                    <td className="survey-table__td">
                      <span className="gender-badge">{socializer.user?.role?.role || 'N/A'}</span>
                    </td>
                    <td className="survey-table__td">
                      <span
                        className={`age-badge ${
                          socializer.status === 'enabled' ? 'age-badge--success' : 'age-badge--disabled'
                        }`}
                      >
                        {socializer.status === 'enabled' ? 'Habilitado' : 'Deshabilitado'}
                      </span>
                    </td>
                    <td className="survey-table__td">
                      <div className="location-info">
                        <span className="location-city">{formatLocation(socializer.location)}</span>
                      </div>
                    </td>
                    <td className="survey-table__td survey-table__td--date">
                      {formatDate(socializer.createdAt)}
                    </td>
                    <td className="survey-table__td">
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          className="action-btn action-btn--edit"
                          onClick={() => onEdit(socializer)}
                          disabled={isLoading}
                          title="Editar socializador"
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          className="action-btn action-btn--delete"
                          onClick={() => {
                            if (
                              window.confirm(
                                `¿Está seguro de eliminar a ${socializer.fullName}?`
                              )
                            ) {
                              onDelete(socializer._id)
                            }
                          }}
                          disabled={isLoading}
                          title="Eliminar socializador"
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18" />
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {!isLoading && socializers.length > 0 && (
        <div className="survey-table__footer">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={10}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  )
}

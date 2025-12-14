/**
 * SurveyTable - Componente reutilizable para mostrar encuestas
 * Principio: Single Responsibility (solo renderiza tabla)
 * Props: surveys, onViewDetails
 */

import { useState } from 'react'
import type { Survey } from '../types'
import { Pagination } from './Pagination'
import { getAvatarColor, getInitials } from '../utils'
import '../styles/Dashboard.scss'

interface SurveyTableProps {
  surveys: Survey[]
  onViewDetails?: (surveyId: string) => void
  currentPage?: number
  totalPages?: number
  totalItems?: number
  itemsPerPage?: number
  onPageChange?: (page: number) => void
}

export function SurveyTable({ 
  surveys, 
  onViewDetails,
  currentPage: externalCurrentPage,
  totalPages: externalTotalPages,
  totalItems: externalTotalItems,
  itemsPerPage = 10,
  onPageChange: externalOnPageChange
}: SurveyTableProps) {
  const [internalCurrentPage, setInternalCurrentPage] = useState(1)

  // Usar paginación externa (del backend) si está disponible, sino usar paginación local
  const isExternalPagination = externalCurrentPage !== undefined && externalTotalPages !== undefined
  const currentPage = isExternalPagination ? externalCurrentPage : internalCurrentPage
  const totalPages = isExternalPagination ? externalTotalPages! : Math.ceil(surveys.length / itemsPerPage)
  const totalItems = isExternalPagination ? (externalTotalItems ?? surveys.length) : surveys.length

  // Solo calcular slice si es paginación local
  const currentSurveys = isExternalPagination ? surveys : surveys.slice((internalCurrentPage - 1) * itemsPerPage, internalCurrentPage * itemsPerPage)

  const handlePageChange = (page: number) => {
    if (isExternalPagination && externalOnPageChange) {
      externalOnPageChange(page)
    } else {
      setInternalCurrentPage(page)
    }
  }

  return (
    <div className="survey-table">
      <div className="survey-table__header">
        <div className="survey-table__search-row">
          <div className="survey-table__search-box">
            <input
              type="text"
              className="survey-table__search-input"
              placeholder="Buscar por nombre, fecha o barrio..."
            />
          </div>
        </div>
      </div>

      <div className="survey-table__wrapper">
        <table className="survey-table__table">
        <thead className="survey-table__thead">
          <tr>
            <th className="survey-table__th">ENCUESTADO</th>
            <th className="survey-table__th">IDENTIFICACIÓN</th>
            <th className="survey-table__th">CONTACTO</th>
            <th className="survey-table__th">GÉNERO</th>
            <th className="survey-table__th">EDAD</th>
            <th className="survey-table__th">UBICACIÓN</th>
            <th className="survey-table__th">FECHA</th>
            <th className="survey-table__th">ACCIONES</th>
          </tr>
        </thead>
        <tbody className="survey-table__tbody">
          {currentSurveys.map((survey) => (
            <tr key={survey.id} className="survey-table__row">
              <td className="survey-table__td survey-table__td--respondent">
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
              </td>
              <td className="survey-table__td">
                <div className="id-info">
                  <span className="id-type">{survey.idType || 'N/A'}</span>
                  <span className="id-number">{survey.identification || 'N/A'}</span>
                </div>
              </td>
              <td className="survey-table__td">
                <div className="contact-info">
                  {survey.phone && <span className="contact-phone">📱 {survey.phone}</span>}
                  {survey.email && <span className="contact-email">✉️ {survey.email}</span>}
                  {!survey.phone && !survey.email && <span>N/A</span>}
                </div>
              </td>
              <td className="survey-table__td">
                <span className="gender-badge">{survey.gender || 'N/A'}</span>
              </td>
              <td className="survey-table__td">
                <span className="age-badge">{survey.ageRange || 'N/A'}</span>
              </td>
              <td className="survey-table__td">
                <div className="location-info">
                  {survey.city && <span className="location-city">📍 {survey.city}</span>}
                  {survey.neighborhood && <span className="location-neighborhood">{survey.neighborhood}</span>}
                  {survey.stratum && <span className="location-stratum">Estrato {survey.stratum}</span>}
                  {!survey.city && !survey.neighborhood && <span>N/A</span>}
                </div>
              </td>
              <td className="survey-table__td survey-table__td--date">{survey.date}</td>
              <td className="survey-table__td">
                <button
                  className="action-btn action-btn--edit"
                  onClick={() => onViewDetails?.(survey.id)}
                  title="Editar encuestado"
                >
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <div className="survey-table__footer">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  )
}

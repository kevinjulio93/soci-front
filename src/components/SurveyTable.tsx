/**
 * SurveyTable - Componente reutilizable para mostrar encuestas
 * Principio: Single Responsibility (solo renderiza tabla)
 * Props: surveys, onViewDetails
 */

import { useState } from 'react'
import type { Survey } from '../types'
import { Pagination } from './Pagination'
import { getAvatarColor, getInitials, selectFromArrayByHash } from '../utils'
import '../styles/Dashboard.scss'

interface SurveyTableProps {
  surveys: Survey[]
  onViewDetails?: (surveyId: string) => void
  itemsPerPage?: number
}

export function SurveyTable({ 
  surveys, 
  onViewDetails,
  itemsPerPage = 10 
}: SurveyTableProps) {
  const [currentPage, setCurrentPage] = useState(1)

  // Calcular paginación
  const totalPages = Math.ceil(surveys.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentSurveys = surveys.slice(startIndex, endIndex)

  const areas = ['centro', 'norte', 'sur', 'este', 'oeste']
  const getAreaLabel = (name: string): string => selectFromArrayByHash(name, areas)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
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

      <table className="survey-table__table">
        <thead className="survey-table__thead">
          <tr>
            <th className="survey-table__th">NOMBRE DEL ENCUESTADO</th>
            <th className="survey-table__th">FECHA</th>
            <th className="survey-table__th">BARRIO</th>
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
              <td className="survey-table__td survey-table__td--date">{survey.date}</td>
              <td className="survey-table__td">
                <span className={`area-badge area-badge--${getAreaLabel(survey.title)}`}>
                  {getAreaLabel(survey.title)}
                </span>
              </td>
              <td className="survey-table__td">
                <button
                  className="action-btn"
                  onClick={() => onViewDetails?.(survey.id)}
                >
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="survey-table__footer">
        <span className="survey-table__records-info">
          Mostrando {startIndex + 1}-{Math.min(endIndex, surveys.length)} de {surveys.length} registros
        </span>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  )
}

/**
 * SurveysList - Lista de todas las encuestas con audios
 * Vista para administradores que muestra todas las encuestas realizadas
 */

import { useState, useEffect } from 'react'
import { Sidebar, DataTable } from '../components'
import { apiService } from '../services/api.service'
import { getSurveysTableColumns } from '../constants'
import type { RespondentData } from '../models/ApiResponses'
import '../styles/Dashboard.scss'

export default function SurveysList() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [surveys, setSurveys] = useState<RespondentData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null)

  const loadSurveys = async (page: number) => {
    try {
      setIsLoading(true)
      const response = await apiService.getRespondents(page, 10)
      setSurveys(response.data || [])
      setTotalPages(response.totalPages || 1)
      setTotalRecords(response.totalItems || 0)
      setCurrentPage(page)
    } catch (error) {
      console.error('Error loading surveys:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadData = async () => {
    await loadSurveys(1)
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePageChange = async (page: number) => {
    await loadSurveys(page)
  }

  const handlePlayAudio = (audioUrl: string) => {
    if (audioPlaying === audioUrl) {
      setAudioPlaying(null)
    } else {
      setAudioPlaying(audioUrl)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getAudioUrl = (audioPath: string) => {
    if (!audioPath) return null
    // Si ya es una URL completa, retornarla
    if (audioPath.startsWith('http')) return audioPath
    // Si es una ruta relativa, construir la URL completa
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://82f60cf02a72.ngrok-free.app/api/v1'
    return `${baseUrl.replace('/api/v1', '')}${audioPath}`
  }

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="dashboard-layout__content">
        <div className="dashboard-layout__header">
          <button 
            className="dashboard-layout__menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="dashboard-layout__title">Encuestas</h1>
        </div>

        <div className="dashboard-layout__body">
          <div className="dashboard__header-section">
            <div className="dashboard__header-text">
              <h2 className="dashboard__section-title">Todas las Encuestas</h2>
              <p className="dashboard__section-desc">
                {totalRecords} encuesta{totalRecords !== 1 ? 's' : ''} registrada{totalRecords !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <DataTable
            columns={getSurveysTableColumns(formatDate, getAudioUrl, handlePlayAudio, audioPlaying)}
            data={surveys}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalRecords}
            itemsPerPage={10}
            onPageChange={handlePageChange}
            isLoading={isLoading}
            emptyStateIcon={
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            emptyStateTitle="No hay encuestas"
            emptyStateDescription="Aún no se han registrado encuestas en el sistema."
            getRowKey={(survey) => survey._id}
          />
        </div>
      </div>
    </div>
  )
}

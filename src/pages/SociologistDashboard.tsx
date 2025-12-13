/**
 * SociologistDashboard - Dashboard del sociólogo
 * Principio: Single Responsibility (coordina el dashboard)
 * Utiliza componentes presentacionales (DashboardHeader, SurveyTable)
 */

import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { DashboardHeader, SurveyTable, PageHeader } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api.service'
import type { Survey } from '../types'
import '../styles/Dashboard.scss'

export default function SociologistDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRespondents = async () => {
      try {
        setIsLoading(true)
        const response = await apiService.getRespondents()
        
        // Transformar datos de respondents a formato de surveys
        const surveysData: Survey[] = response.data.map(respondent => ({
          id: respondent._id,
          title: respondent.fullName,
          status: respondent.status === 'enabled' ? 'completed' as const : 'pending' as const,
          participants: 1,
          date: new Date(respondent.createdAt).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }),
        }))
        
        setSurveys(surveysData)
      } catch (err) {
        // Error al cargar encuestados
        setSurveys([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchRespondents()
  }, [])

  const handleLogout = async () => {
    try {
      // await logout()
      navigate('/login')
    } catch (err) {
      // Error al cerrar sesión
    }
  }

  const handleViewSurveyDetails = (respondentId: string) => {
    // Navegar al formulario en modo edición
    navigate(`/survey/${respondentId}/participant`, { 
      state: { 
        startRecording: false,
        editMode: true,
        respondentId: respondentId
      } 
    })
  }

  const handleNewSurvey = () => {
    // Navegar a la página de nueva encuesta, la grabación iniciará allí
    navigate('/survey/4092/participant', { 
      state: { 
        startRecording: true,
        editMode: false
      } 
    })
  }

  return (
    <div className="dashboard">
      <DashboardHeader
        title="Dashboard Socializador"
        user={user}
        onLogout={handleLogout}
      />

      <main className="dashboard__main">
        <PageHeader
          title="Lista de Encuestas"
          description="Gestione los registros y comience nuevas sesiones de recolección de datos."
        >
          <button className="btn btn--primary" onClick={handleNewSurvey}>
            <span className="btn__icon">+</span> Nueva Encuesta
          </button>
        </PageHeader>

        <section className="dashboard__content">
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              Cargando encuestados...
            </div>
          ) : (
            <SurveyTable surveys={surveys} onViewDetails={handleViewSurveyDetails} />
          )}
        </section>
      </main>
    </div>
  )
}

/**
 * SurveyParticipant - Página para recolectar datos del participante
 * Principio: Single Responsibility (coordina el formulario de encuesta)
 * Utiliza componentes presentacionales (SurveyForm)
 */

import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { SurveyForm, DashboardHeader, PageHeader } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { useAudioRecorderContext } from '../contexts/AudioRecorderContext'
import { apiService } from '../services/api.service'
import type { Survey } from '../types'
import '../styles/SurveyForm.scss'
import '../styles/Dashboard.scss'

// Mock survey data - En producción vendría del backend
const MOCK_SURVEYS: Record<string, Survey> = {
  '4092': {
    id: '4092',
    title: 'Encuesta #4092',
    status: 'in_progress',
    participants: 45,
    date: '12 Oct 2023',
  },
}

interface SurveyParticipantData {
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

export default function SurveyParticipant() {
  const { surveyId = '4092' } = useParams<{ surveyId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const survey = MOCK_SURVEYS[surveyId]
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [initialData, setInitialData] = useState<SurveyParticipantData | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(false)

  const editMode = location.state?.editMode || false
  const respondentId = location.state?.respondentId

  const {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
    error: recordingError,
  } = useAudioRecorderContext()

  // Cargar datos del respondent si está en modo edición
  useEffect(() => {
    const loadRespondentData = async () => {
      if (editMode && respondentId) {
        try {
          setIsLoadingData(true)
          const response = await apiService.getRespondentById(respondentId)
          const respondent = response.data
          
          const formData: SurveyParticipantData = {
            fullName: respondent.fullName,
            idType: respondent.idType as any,
            identification: respondent.identification,
            email: respondent.email || '',
            phone: respondent.phone || '',
            address: respondent.address || '',
            gender: (respondent.gender || '') as any,
            ageRange: (respondent.ageRange || '') as any,
            region: respondent.region || '',
            department: respondent.department || '',
            city: respondent.city || '',
            stratum: (respondent.stratum?.toString() || '') as any,
            neighborhood: respondent.neighborhood || '',
          }
          
          setInitialData(formData)
        } catch (err) {
            console.log(err);
        } finally {
          setIsLoadingData(false)
        }
      } else {
        setIsLoadingData(false)
      }
    }

    loadRespondentData()
  }, [editMode, respondentId])

  // Iniciar grabación cuando se llega desde "Nueva Encuesta"
  useEffect(() => {
    const shouldStartRecording = location.state?.startRecording
    if (shouldStartRecording && !editMode) {
      startRecording()
    }
  }, [location.state, startRecording, editMode])

  const handleLogout = async () => {
    try {
      // Detener grabación si está activa
      if (isRecording) {
        await stopRecording()
      }
      navigate('/login')
    } catch (err) {
      // Error al cerrar sesión
    }
  }

  const handleBackToDashboard = async () => {
    // Detener grabación si está activa
    if (isRecording) {
      await stopRecording()
    }
    navigate('/sociologist/dashboard')
  }

  const handleDownloadAudio = () => {
    if (audioUrl) {
      const a = document.createElement('a')
      a.href = audioUrl
      a.download = `encuesta-${surveyId}-${Date.now()}.webm`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const handleStopRecording = async () => {
    await stopRecording()
  }

  const handleSubmit = async (data: SurveyParticipantData) => {
    try {
      setIsSubmitting(true)

      // Detener grabación si está activa y no está en modo edición, y obtener el blob
      let recordedBlob: Blob | null = null
      if (isRecording && !editMode) {
        recordedBlob = await stopRecording()
      }

      // Preparar datos para enviar al backend
      const respondentData = {
        fullName: data.fullName,
        idType: data.idType,
        identification: data.identification,
        email: data.email || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
        gender: data.gender || undefined,
        ageRange: data.ageRange || undefined,
        region: data.region || undefined,
        department: data.department || undefined,
        city: data.city || undefined,
        stratum: data.stratum || undefined,
        neighborhood: data.neighborhood || undefined,
      }

      let createdRespondentId: string | null = null

      // Enviar datos al backend (crear o actualizar)
      if (editMode && respondentId) {
        await apiService.updateRespondent(respondentId, respondentData)
        alert('Encuestado actualizado exitosamente')
      } else {
        // Crear nuevo respondent
        const response = await apiService.createRespondent(respondentData)
        createdRespondentId = response.data._id
        alert('Encuestado creado exitosamente')
      }

      // Subir audio si hay uno y es modo creación
      if (recordedBlob && !editMode && createdRespondentId) {
        try {
          await apiService.uploadAudio(createdRespondentId, recordedBlob)
          alert('Audio subido exitosamente')
        } catch (audioErr) {
          const audioErrorMessage = audioErr instanceof Error ? audioErr.message : 'Error al subir el audio'
          alert(`Advertencia: El encuestado fue creado pero el audio no se pudo subir: ${audioErrorMessage}`)
        } finally {
          // Limpiar audio de memoria después de intentar subirlo
          clearRecording()
        }
      }

      // Retornar al dashboard después de guardar exitosamente
      navigate('/sociologist/dashboard')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar los datos'
      alert(`Error: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // En modo edición, no verificar si existe el survey en MOCK_SURVEYS
  if (!editMode && !survey) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Encuesta no encontrada</h1>
        <button onClick={() => navigate('/sociologist/dashboard')}>
          Volver al Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <DashboardHeader
        title={editMode ? "Editar Encuesta" : "Nueva Encuesta"}
        user={user}
        onLogout={handleLogout}
      />

      <main className="dashboard__main">
        <PageHeader
          title={editMode ? `Editar Encuestado` : `Nueva Encuesta`}
          description={editMode ? "Modifique los datos del participante y guarde los cambios." : "Complete los datos del participante para iniciar la sesión de recolección de datos."}
        >
          {isRecording && !audioUrl && (
            <div className="recording-indicator">
              <span className="recording-indicator__dot"></span>
              <span className="recording-indicator__text">
                Grabando {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}
          <button className="btn btn--secondary" onClick={handleBackToDashboard}>
            ← Volver al Dashboard
          </button>
        </PageHeader>

        {recordingError && (
          <div className="error-message" style={{ marginBottom: '1rem' }}>
            Error de grabación: {recordingError}
          </div>
        )}

        {/* Reproductor de audio */}
        {audioUrl && (
          <div className="audio-player-container">
            <h3 className="audio-player-container__title">Audio Grabado ✓</h3>
            <audio 
              controls 
              src={audioUrl} 
              className="audio-player-container__player"
            >
              Tu navegador no soporta el elemento de audio.
            </audio>
            <div className="audio-player-container__footer">
              <button 
                className="btn btn--primary"
                onClick={handleDownloadAudio}
                type="button"
              >
                ⬇ Descargar Audio
              </button>
            </div>
          </div>
        )}

        {/* Controles de grabación */}
        {isRecording && !audioUrl && (
          <div className="recording-controls">
            {isPaused ? (
              <button 
                className="btn btn--primary" 
                onClick={resumeRecording}
              >
                ▶ Reanudar Grabación
              </button>
            ) : (
              <button 
                className="btn btn--warning" 
                onClick={pauseRecording}
              >
                ⏸ Pausar Grabación
              </button>
            )}
            <button 
              className="btn btn--danger" 
              onClick={handleStopRecording}
            >
              ⏹ Finalizar Grabación
            </button>
          </div>
        )}

        <section className="dashboard__content">
          {isLoadingData ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              Cargando datos del encuestado...
            </div>
          ) : (editMode && !initialData) ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              No se pudieron cargar los datos del encuestado
            </div>
          ) : (
            <SurveyForm
              videoUrl="https://www.youtube.com/embed/vVy9Lgpg1m8?si=0Jr7F2YQh58n9JMF"
              onSubmit={handleSubmit}
              isLoading={isSubmitting}
              isRecording={isRecording && !audioUrl}
              onStopRecording={handleStopRecording}
              initialData={initialData}
            />
          )}
        </section>
      </main>
    </div>
  )
}

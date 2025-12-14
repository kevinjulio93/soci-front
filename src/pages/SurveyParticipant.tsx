/**
 * SurveyParticipant - Página para recolectar datos del participante
 * Principio: Single Responsibility (coordina el formulario de encuesta)
 * Utiliza componentes presentacionales (SurveyForm)
 */

import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { SurveyForm, DashboardHeader, PageHeader } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { useAudioRecorderContext } from '../contexts/AudioRecorderContext'
import { apiService } from '../services/api.service'
import { indexedDBService } from '../services/indexedDB.service'
import { Respondent } from '../models/Respondent'
import { useOnlineStatus } from '../hooks'
import { MESSAGES, TITLES, DESCRIPTIONS, ROUTES, EXTERNAL_URLS } from '../constants'
import '../styles/SurveyForm.scss'
import '../styles/Dashboard.scss'

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
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const isOnline = useOnlineStatus()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [initialData, setInitialData] = useState<SurveyParticipantData | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(false)

  const editMode = location.state?.editMode || false
  const respondentId = location.state?.respondentId

  const {
    isRecording,
    startRecording,
    stopRecording,
    clearRecording,
    error: recordingError,
  } = useAudioRecorderContext()

  // Inicializar IndexedDB
  useEffect(() => {
    indexedDBService.init().catch(err => {
      console.error('Error al inicializar IndexedDB:', err)
    })
  }, [])

  // Cargar datos del respondent si está en modo edición
  useEffect(() => {
    const loadRespondentData = async () => {
      if (editMode && respondentId) {
        try {
          setIsLoadingData(true)
          const response = await apiService.getRespondentById(respondentId)
          
          // Usar clase Respondent para transformar datos
          const respondent = Respondent.fromDTO(response.data)
          setInitialData(respondent.toFormData())
        } catch (err) {
          console.log(err)
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

    // Cleanup: detener grabación y liberar micrófono cuando se desmonte el componente
    return () => {
      if (isRecording) {
        stopRecording()
      }
    }
  }, [location.state, startRecording, editMode, isRecording, stopRecording])

  const handleLogout = async () => {
    try {
      // Detener grabación si está activa
      if (isRecording) {
        await stopRecording()
      }
      navigate(ROUTES.LOGIN)
    } catch {
      // Error al cerrar sesión
    }
  }

  const handleBackToDashboard = async () => {
    // Detener grabación si está activa
    if (isRecording) {
      await stopRecording()
    }
    navigate(ROUTES.DASHBOARD)
  }

  const handleSubmit = async (data: SurveyParticipantData) => {
    try {
      setIsSubmitting(true)

      // Detener grabación si está activa y no está en modo edición, y obtener el blob
      let recordedBlob: Blob | null = null
      if (isRecording && !editMode) {
        recordedBlob = await stopRecording()
      }

      // Crear instancia de Respondent usando POO
      const respondent = Respondent.fromFormData(data)
      
      // Validar datos básicos
      if (!respondent.isValid()) {
        console.log(MESSAGES.VALIDATION_ERROR)
        return
      }

      // Convertir a DTO para enviar al backend
      const respondentDTO = respondent.toDTO()

      // Si está offline, guardar localmente
      if (!isOnline) {
        console.log('📴 Sin conexión - Guardando encuesta localmente...')
        const pendingId = await indexedDBService.savePendingRespondent(
          respondentDTO,
          recordedBlob ?? undefined
        )
        console.log(`✅ Encuesta guardada localmente con ID: ${pendingId}`)
        console.log('🔄 Se sincronizará automáticamente cuando recuperes la conexión')
        
        // Limpiar audio de memoria
        clearRecording()
        
        // Retornar al dashboard
        navigate(ROUTES.DASHBOARD)
        return
      }

      // Si está online, proceder normalmente
      let createdRespondentId: string | null = null

      // Enviar datos al backend (crear o actualizar)
      if (editMode && respondentId) {
        await apiService.updateRespondent(respondentId, respondentDTO)
        console.log(MESSAGES.UPDATE_SUCCESS)
      } else {
        // Crear nuevo respondent
        const response = await apiService.createRespondent(respondentDTO)
        createdRespondentId = response.data._id
        console.log(MESSAGES.CREATE_SUCCESS, response.data)
      }

      // Subir audio si hay uno y es modo creación
      if (recordedBlob && !editMode && createdRespondentId) {
        try {
          await apiService.uploadAudio(createdRespondentId, recordedBlob)
          console.log(MESSAGES.AUDIO_SUCCESS)
        } catch (audioErr) {
          const audioErrorMessage = audioErr instanceof Error ? audioErr.message : MESSAGES.AUDIO_UPLOAD_ERROR
          console.error(`${MESSAGES.AUDIO_ERROR}: ${audioErrorMessage}`, audioErr)
        } finally {
          // Limpiar audio de memoria después de intentar subirlo
          clearRecording()
        }
      }

      // Retornar al dashboard después de guardar exitosamente
      navigate(ROUTES.DASHBOARD)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : MESSAGES.SAVE_ERROR
      console.error('Error:', errorMessage, err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="dashboard">
      <DashboardHeader
        title={editMode ? TITLES.EDIT_SURVEY : TITLES.NEW_SURVEY}
        user={user}
        onLogout={handleLogout}
      />

      <main className="dashboard__main">
        <PageHeader
          title={editMode ? TITLES.EDIT_RESPONDENT : TITLES.NEW_SURVEY}
          description={editMode ? DESCRIPTIONS.EDIT_MODE : DESCRIPTIONS.CREATE_MODE}
        >
          {isRecording && (
            <div className="recording-indicator">
              <span className="recording-indicator__dot"></span>
            </div>
          )}
          <button className="btn btn--secondary" onClick={handleBackToDashboard}>
            {TITLES.BACK_TO_DASHBOARD}
          </button>
        </PageHeader>

        {recordingError && (
          <div className="error-message" style={{ marginBottom: '1rem' }}>
            {MESSAGES.RECORDING_ERROR}: {recordingError}
          </div>
        )}

        <section className="dashboard__content">
          {isLoadingData ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              {MESSAGES.LOADING_DATA}
            </div>
          ) : (editMode && !initialData) ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              {MESSAGES.LOAD_ERROR}
            </div>
          ) : (
            <SurveyForm
              videoUrl={EXTERNAL_URLS.VIDEO_TUTORIAL}
              onSubmit={handleSubmit}
              isLoading={isSubmitting}
              isRecording={isRecording}
              initialData={initialData}
            />
          )}
        </section>
      </main>
    </div>
  )
}

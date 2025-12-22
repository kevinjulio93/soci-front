/**
 * SurveyParticipant - Página para recolectar datos del participante
 * Principio: Single Responsibility (coordina el formulario de encuesta)
 * Utiliza componentes presentacionales (SurveyForm)
 */

import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { SurveyForm, DashboardHeader, PageHeader, SuccessModal } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { useAudioRecorderContext } from '../contexts/AudioRecorderContext'
import { apiService } from '../services/api.service'
import { notificationService } from '../services/notification.service'
import { indexedDBService } from '../services/indexedDB.service'
import { Respondent } from '../models/Respondent'
import { useOnlineStatus } from '../hooks'
import { MESSAGES, TITLES, DESCRIPTIONS, ROUTES, EXTERNAL_URLS } from '../constants'
import '../styles/SurveyForm.scss'
import '../styles/Dashboard.scss'

interface SurveyParticipantData {
  willingToRespond: boolean
  visitAddress: string
  surveyStatus: 'successful' | 'unsuccessful' | ''
  noResponseReason: 'no_interest' | 'no_time' | 'not_home' | 'privacy_concerns' | 'other' | ''
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
  defendorDePatria: boolean
}

export default function SurveyParticipant() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const isOnline = useOnlineStatus()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [initialData, setInitialData] = useState<SurveyParticipantData | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showWhatsAppQR, setShowWhatsAppQR] = useState(false)

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
    indexedDBService.init().catch(() => {
      // Error silencioso
    })
  }, [])

  // Cargar datos del respondent si está en modo edición
  const loadRespondentData = async () => {
    if (!editMode || !respondentId) {
      setIsLoadingData(false)
      return
    }

    try {
      setIsLoadingData(true)
      const response = await apiService.getRespondentById(respondentId)
      
      // Usar directamente response.data (debería tener todas las propiedades)
      const respondent = Respondent.fromDTO(response.data)
      setInitialData(respondent.toFormData())
    } catch (err) {
      notificationService.handleApiError(err, MESSAGES.RESPONDENT_LOAD_ERROR)
    } finally {
      setIsLoadingData(false)
    }
  }

  useEffect(() => {
    loadRespondentData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode, respondentId])

  // Iniciar grabación solo si viene desde "Nueva Encuesta" y se marca como dispuesto
  const handleWillingToRespondChange = (willing: boolean) => {
    if (willing && !editMode && !isRecording) {
      startRecording()
    } else if (!willing && isRecording) {
      stopRecording()
    }
  }

  // Cleanup: detener grabación y liberar micrófono cuando se desmonte el componente
  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording()
      }
    }
  }, [isRecording, stopRecording])

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
      console.log('🚀 SurveyParticipant handleSubmit:', data)
      setIsSubmitting(true)

      // Detener grabación si está activa y no está en modo edición, y obtener el blob
      let recordedBlob: Blob | null = null
      if (isRecording && !editMode) {
        recordedBlob = await stopRecording()
      }

      // Obtener ubicación actual
      let latitude = 0
      let longitude = 0
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          })
        })
        latitude = position.coords.latitude
        longitude = position.coords.longitude
        console.log('📍 Location obtained:', { latitude, longitude })
      } catch {
        console.log('⚠️ Geolocation failed, using 0,0')
      }

      // Convertir willingToRespond de string a boolean si es necesario
      const willingToRespond = String(data.willingToRespond) === 'true'
      console.log('🔄 Converting willingToRespond:', data.willingToRespond, '→', willingToRespond)

      // Crear instancia de Respondent usando POO con ubicación
      const respondent = Respondent.fromFormData({
        ...data,
        willingToRespond,
        latitude,
        longitude,
        // Si no está dispuesto, establecer valores predeterminados para campos no capturados
        ...(!willingToRespond ? {
          visitAddress: `Ubicación GPS: ${latitude}, ${longitude}`,
          surveyStatus: 'unsuccessful' as const,
          fullName: 'No proporcionado',
          identification: 'N/A',
          idType: 'CC' as const,
          email: '',
          phone: '',
          address: '',
          gender: '' as const,
          ageRange: '' as const,
          region: 'Caribe',
          department: 'Atlántico',
          city: '',
          stratum: '' as const,
          neighborhood: '',
          defendorDePatria: false,
        } : {})
      })
      
      console.log('📋 Respondent created:', respondent)
      
      // Validar datos básicos solo si está dispuesto a responder
      if (willingToRespond && !respondent.isValid()) {
        console.log('❌ Validation failed for willing respondent')
        return
      }

      console.log('✅ Validation passed, proceeding...')

      // Convertir a DTO para enviar al backend
      const respondentDTO = respondent.toDTO()

      // Si está offline, guardar localmente
      if (!isOnline) {
        await indexedDBService.savePendingRespondent(
          respondentDTO,
          recordedBlob ?? undefined
        )
        
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
        notificationService.success(MESSAGES.RESPONDENT_UPDATE_SUCCESS)
      } else {
        // Crear nuevo respondent
        const response = await apiService.createRespondent(respondentDTO)
        createdRespondentId = response.data._id
        notificationService.success(MESSAGES.RESPONDENT_CREATE_SUCCESS)
      }

      // Subir audio si hay uno y es modo creación
      if (recordedBlob && !editMode && createdRespondentId) {
        try {
          await apiService.uploadAudio(createdRespondentId, recordedBlob)
        } catch {
          // Error silencioso en la subida de audio
        } finally {
          // Limpiar audio de memoria después de intentar subirlo
          clearRecording()
        }
      }

      // Mostrar modal de éxito y QR si es defensor de la patria
      if (data.defendorDePatria && !editMode) {
        setShowWhatsAppQR(true)
        setShowSuccessModal(true)
      } else {
        // Retornar al dashboard si no es defensor de la patria
        navigate(ROUTES.DASHBOARD)
      }
    } catch (err) {
      notificationService.handleApiError(err, MESSAGES.RESPONDENT_SAVE_ERROR)
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
              initialData={initialData}
              onWillingToRespondChange={handleWillingToRespondChange}
            />
          )}
        </section>
      </main>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false)
          setShowWhatsAppQR(false)
          navigate(ROUTES.DASHBOARD)
        }}
        showQR={showWhatsAppQR}
        qrImageUrl={EXTERNAL_URLS.WHATSAPP_QR_CODE}
      />
    </div>
  )
}

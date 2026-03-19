/**
 * SurveyParticipant - Página para recolectar datos del participante
 * Principio: Single Responsibility (coordina el formulario de encuesta)
 * Utiliza componentes presentacionales (SurveyForm)
 */

import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState, useCallback } from 'react'
import { SurveyForm, DashboardHeader, PageHeader, SuccessModal } from '../components'
import OTPModal from '../components/OTPModal'
import { useAuth } from '../contexts/AuthContext'
import { useAudioRecorderContext } from '../contexts/AudioRecorderContext'
import { apiService } from '../services/api.service'
import { notificationService } from '../services/notification.service'
import { indexedDBService } from '../services/indexedDB.service'
import { Respondent } from '../models/Respondent'
import { useOnlineStatus, useLogout } from '../hooks'
import { MESSAGES, TITLES, DESCRIPTIONS, ROUTES, EXTERNAL_URLS } from '../constants'
import { OTP_CONFIG } from '../constants/config'
import '../styles/SurveyForm.scss'
import '../styles/Dashboard.scss'

interface SurveyParticipantData {
  willingToRespond: boolean
  audioRecordingConsent: boolean
  visitAddress: string
  surveyStatus: 'successful' | 'unsuccessful' | ''
  noResponseReason: 'no_interest' | 'no_time' | 'not_home' | 'privacy_concerns' | 'other' | ''
  fullName: string
  idType: 'CC' | 'TI' | 'CE' | 'PA' | 'RC' | 'NIT' | ''
  identification: string
  email: string
  phone: string
  facebookUsername: string
  address: string
  gender: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir' | ''
  ageRange: '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+' | ''
  department: string
  departmentId: string
  city: string
  municipioCode: string
  stratum: '1' | '2' | '3' | '4' | '5' | '6' | ''
  neighborhood: string
  defendorDePatria: boolean
  isLinkedHouse: boolean
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
  const [showOTPModal, setShowOTPModal] = useState(false)
  const [otpPhoneNumber, setOtpPhoneNumber] = useState('')
  const [otpRespondentId, setOtpRespondentId] = useState('')
  const [isDefensorDePatria, setIsDefensorDePatria] = useState(false)
  const [whatsappQRLink, setWhatsappQRLink] = useState<string>(EXTERNAL_URLS.WHATSAPP_QR_CODE)
  const [locationCoords, setLocationCoords] = useState<{ lat: number, lng: number } | null>(null)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const stoppedForNoConsentRef = useRef(false)
  const handleSubmitAudioRef = useRef<{ audioConsent: boolean, recordedWithoutConsent: boolean, respondentId: string } | null>(null)

  const editMode = location.state?.editMode || false
  const respondentId = location.state?.respondentId

  const {
    isRecording,
    audioBlob,
    startRecording,
    stopRecording,
    clearRecording,
    error: recordingError,
  } = useAudioRecorderContext()

  // Hook centralizado para logout con limpieza de grabación
  const handleLogout = useLogout({
    onBeforeLogout: useCallback(async () => {
      if (isRecording) {
        await stopRecording()
      }
    }, [isRecording, stopRecording])
  })

  // Inicializar IndexedDB
  useEffect(() => {
    indexedDBService.init().catch(() => {
      // Error silencioso
    })
  }, [])

  // Cargar datos del respondent si está en modo edición
  const loadRespondentData = useCallback(async () => {
    if (!editMode || !respondentId) {
      setIsLoadingData(false)
      return
    }

    try {
      setIsLoadingData(true)
      const response = await apiService.getRespondentById(respondentId)

      // Usar directamente response.data (debería tener todas las propiedades)
      const respondent = Respondent.fromDTO(response.data)
      const formData = respondent.toFormData()

      // El backend puede devolver department/municipality como ID string o como objeto poblado
      const extractId = (val: unknown): string => {
        if (!val) return ''
        if (typeof val === 'string') return val
        if (typeof val === 'object' && val !== null && '_id' in val) return (val as { _id: string })._id
        return ''
      }

      setInitialData({
        ...formData,
        // Restaurar IDs de MongoDB para department y municipality
        departmentId: extractId(response.data.department),
        municipioCode: extractId(response.data.municipality),
        // Mantener los nombres originales del city como fallback para búsqueda
        // (en SurveyForm se restaurarán correctamente, estos aquí son de respaldo)
      } as unknown as SurveyParticipantData)
    } catch (err) {
      notificationService.handleApiError(err, MESSAGES.RESPONDENT_LOAD_ERROR)
    } finally {
      setIsLoadingData(false)
    }
  }, [editMode, respondentId])

  useEffect(() => {
    loadRespondentData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode, respondentId])

  // Iniciar grabación y tomar ubicación de inmediato
  useEffect(() => {
    if (!editMode) {
      clearRecording()
      stoppedForNoConsentRef.current = false
      startRecording()

      // Solicitar ubicación al iniciar la encuesta
      navigator.geolocation.getCurrentPosition(
        (position) => setLocationCoords({ lat: position.coords.latitude, lng: position.coords.longitude }),
        (error) => console.warn('No se pudo obtener la ubicación GPS inicial:', error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    }
  }, [editMode, clearRecording, startRecording])

  // Detener grabación cuando el usuario NO autoriza
  const handleWillingToRespondChange = useCallback((audioConsent: boolean) => {
    if (!audioConsent) {
      stoppedForNoConsentRef.current = true
      if (isRecording) {
        stopRecording()
      }
    }
  }, [isRecording, stopRecording])

  // Cleanup: detener grabación y liberar micrófono cuando se desmonte el componente
  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording()
      }
    }
  }, [isRecording, stopRecording])

  const handleBackToDashboard = useCallback(async () => {
    // Detener grabación si está activa
    if (isRecording) {
      await stopRecording()
    }
    navigate(ROUTES.DASHBOARD)
  }, [isRecording, stopRecording, navigate])

  const finalizeAudioAndNavigate = useCallback(async (isDefensor: boolean) => {
    setIsFinalizing(true)
    const audioData = handleSubmitAudioRef.current

    if (isDefensor) {
      setShowOTPModal(false)
      setShowWhatsAppQR(true)
      setShowSuccessModal(true)
    }

    if (audioData && audioData.respondentId && !editMode) {
      let recordedBlob: Blob | null = null
      if (isRecording) {
        recordedBlob = await stopRecording()
      } else if (audioBlob) {
        recordedBlob = audioBlob
      }

      if (recordedBlob && (audioData.audioConsent || audioData.recordedWithoutConsent)) {
        try {
          await apiService.uploadAudio(audioData.respondentId, recordedBlob)
          if (audioData.recordedWithoutConsent) {
            notificationService.info('Grabación guardada como evidencia de rechazo')
          }
        } catch { }
      }
      clearRecording()
    }

    handleSubmitAudioRef.current = null
    setIsFinalizing(false)

    if (!isDefensor) {
      setShowOTPModal(false)
      navigate(ROUTES.DASHBOARD)
    }
  }, [editMode, isRecording, audioBlob, stopRecording, clearRecording, navigate])

  const handleSubmit = useCallback(async (data: SurveyParticipantData) => {
    try {
      setIsSubmitting(true)

      const audioConsent = String(data.audioRecordingConsent) === 'true'
      const recordedWithoutConsent = !editMode && (!audioConsent || stoppedForNoConsentRef.current)

      // Preparar datos para procesar el audio más tarde
      handleSubmitAudioRef.current = {
        audioConsent,
        recordedWithoutConsent,
        respondentId: '' // Se actualizará al tener el ID
      }



      // Obtener ubicación actual, usando los datos precargados si las hay o intentando de nuevo
      let latitude = locationCoords?.lat || 0
      let longitude = locationCoords?.lng || 0

      if (latitude === 0 && longitude === 0) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            })
          })
          latitude = position.coords.latitude
          longitude = position.coords.longitude
        } catch (error) {
          console.warn('No se pudo obtener la ubicación GPS en el envío:', error)
          notificationService.warning('No se pudo obtener la ubicación GPS. La encuesta se guardará sin coordenadas.')
        }
      }

      // Convertir willingToRespond de string a boolean si es necesario
      const willingToRespond = String(data.willingToRespond) === 'true'

      // Obtener la razón de no respuesta para usar en los campos vacíos
      const getNoResponseReasonLabel = () => {
        const reason = data.noResponseReason as unknown as { label?: string, value?: string }
        if (reason && typeof reason === 'object' && reason.label) {
          return reason.label
        }
        if (typeof data.noResponseReason === 'string') {
          return data.noResponseReason
        }
        return 'No proporcionado'
      }
      const reasonLabel = getNoResponseReasonLabel()

      // Formatear teléfono con código de Colombia
      const formatPhone = (phone: string): string => {
        const cleaned = phone.replace(/[\s\-()]/g, '')
        if (cleaned.startsWith('+57')) return cleaned
        if (cleaned.startsWith('57') && cleaned.length > 10) return `+${cleaned}`
        return `+57${cleaned}`
      }

      // Crear instancia de Respondent usando POO con ubicación
      const respondent = Respondent.fromFormData({
        ...data,
        phone: data.phone ? formatPhone(data.phone) : '',
        willingToRespond,
        latitude,
        longitude,
        // Si no está dispuesto, establecer valores predeterminados para campos no capturados
        ...(!willingToRespond ? {
          visitAddress: `Ubicación GPS: ${latitude}, ${longitude}`,
          surveyStatus: 'unsuccessful' as const,
          fullName: reasonLabel,
          identification: '',
          idType: 'CC' as const,
          email: '',
          phone: '',
          address: '',
          gender: '' as const,
          ageRange: '' as const,
          department: 'Atlántico',
          city: '',
          stratum: '' as const,
          neighborhood: '',
          defendorDePatria: false,
        } : {})
      })

      // Validar datos básicos solo si está dispuesto a responder
      if (willingToRespond && !respondent.isValid()) {
        setIsSubmitting(false)
        return
      }

      // Convertir a DTO para enviar al backend
      const respondentDTO = {
        ...respondent.toDTO(),
        department: data.departmentId || undefined,
        municipality: data.municipioCode || undefined,
      }

      // Si está offline, guardar localmente
      if (!isOnline) {
        let recordedBlob: Blob | null = null
        if (!editMode) {
          if (isRecording) {
            recordedBlob = await stopRecording()
          } else if (audioBlob) {
            recordedBlob = audioBlob
          }
        }

        await indexedDBService.savePendingRespondent(
          respondentDTO,
          recordedBlob ?? undefined
        )

        clearRecording()
        setIsSubmitting(false)
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
        // Actualizar ref con el ID guardado
        if (handleSubmitAudioRef.current) {
          handleSubmitAudioRef.current.respondentId = createdRespondentId
        }
      }

      // Guardar si es defensor para usarlo después del OTP
      const esDefensor = data.defendorDePatria && !editMode
      setIsDefensorDePatria(esDefensor)

      // Determinar la zona y su link de WhatsApp
      // Primero revisamos la variable de entorno que define la compilación de la zona actual
      const activeZone = (import.meta.env.VITE_ACTIVE_ZONE || '').toLowerCase()
      console.log('activeZone', activeZone)
      let groupLink = EXTERNAL_URLS.WHATSAPP_GROUP_LINKS[activeZone]

      // Si no hay zona definida en .env o no está en la lista de links, intentamos extraerla del usuario
      if (!groupLink) {
        const userDataStr = JSON.stringify(user || {}).toLowerCase()
        if (userDataStr.includes('zona1') || userDataStr.includes('zona 1')) {
          groupLink = EXTERNAL_URLS.WHATSAPP_GROUP_LINKS['zona1']
        } else if (userDataStr.includes('zona3') || userDataStr.includes('zona 3')) {
          groupLink = EXTERNAL_URLS.WHATSAPP_GROUP_LINKS['zona3']
        } else if (userDataStr.includes('zona4') || userDataStr.includes('zona 4')) {
          groupLink = EXTERNAL_URLS.WHATSAPP_GROUP_LINKS['zona4']
        } else if (userDataStr.includes('zona5') || userDataStr.includes('zona 5')) {
          groupLink = EXTERNAL_URLS.WHATSAPP_GROUP_LINKS['zona5']
        } else {
          groupLink = EXTERNAL_URLS.WHATSAPP_GROUP_LINKS.default
        }
      }

      setWhatsappQRLink(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(groupLink)}`)

      // Si tiene teléfono y se creó el respondent, mostrar OTP para verificar
      if (data.phone && !editMode && createdRespondentId) {
        setOtpRespondentId(createdRespondentId)
        setOtpPhoneNumber(data.phone)
        setShowOTPModal(true)
        // La detención de la grabación ocurrirá en los callbacks del OTPModal
      } else {
        // Ejecutar finalización de audio y redirección síncrona
        await finalizeAudioAndNavigate(esDefensor)
      }
    } catch (err) {
      notificationService.handleApiError(err, MESSAGES.RESPONDENT_SAVE_ERROR)
      setIsSubmitting(false)
    }
  }, [editMode, respondentId, locationCoords, isRecording, audioBlob, stopRecording, clearRecording, isOnline, navigate, finalizeAudioAndNavigate])

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
          <button className="btn btn--secondary" onClick={handleBackToDashboard} disabled={isSubmitting}>
            {TITLES.BACK_TO_DASHBOARD}
          </button>
        </PageHeader>

        {recordingError ? (
          <div className="error-message" style={{ marginBottom: '1rem' }}>
            {MESSAGES.RECORDING_ERROR}: {recordingError}
          </div>
        ) : null}

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

      {/* OTP Modal - se muestra inmediatamente al guardar */}
      <OTPModal
        isOpen={showOTPModal}
        respondentId={otpRespondentId}
        phoneNumber={otpPhoneNumber}
        allowSkip={OTP_CONFIG.ALLOW_SKIP}
        isFinalizing={isFinalizing}
        onVerified={useCallback(() => {
          notificationService.success('Teléfono verificado correctamente.')
          finalizeAudioAndNavigate(isDefensorDePatria)
        }, [isDefensorDePatria, finalizeAudioAndNavigate])}
        onClose={useCallback(() => {
          finalizeAudioAndNavigate(isDefensorDePatria)
        }, [isDefensorDePatria, finalizeAudioAndNavigate])}
      />

      {/* QR Modal - se muestra si es defensor de la patria */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={useCallback(() => {
          if (isFinalizing) return
          setShowSuccessModal(false)
          setShowWhatsAppQR(false)
          navigate(ROUTES.DASHBOARD)
        }, [navigate, isFinalizing])}
        showQR={showWhatsAppQR}
        qrImageUrl={whatsappQRLink}
        isFinalizing={isFinalizing}
      />
    </div>
  )
}

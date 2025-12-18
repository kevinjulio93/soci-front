/**
 * useAudioRecorder - Hook para grabar audio
 * Maneja la grabación de audio usando MediaRecorder API
 */

import { useState, useRef, useCallback } from 'react'
import { convertToMp3 } from '../utils/audioConverter'

interface UseAudioRecorderReturn {
  isRecording: boolean
  isPaused: boolean
  recordingTime: number
  audioBlob: Blob | null
  audioUrl: string | null
  startRecording: () => Promise<void>
  stopRecording: () => Promise<Blob | null>
  pauseRecording: () => void
  resumeRecording: () => void
  clearRecording: () => void
  error: string | null
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      
      // Solicitar permiso para acceder al micrófono
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Intentar usar MP3 si está disponible, sino usar webm
      let mimeType = 'audio/webm;codecs=opus'
      if (MediaRecorder.isTypeSupported('audio/mpeg')) {
        mimeType = 'audio/mpeg'
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4'
      }

      // Crear MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      // Manejar datos disponibles
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      // Manejar fin de grabación
      mediaRecorder.onstop = async () => {
        // Crear el blob con el formato grabado
        const originalBlob = new Blob(chunksRef.current, { type: mimeType })
        
        // Convertir a MP3
        const mp3Blob = await convertToMp3(originalBlob)
        
        setAudioBlob(mp3Blob)
        setAudioUrl(URL.createObjectURL(mp3Blob))
        
        // Detener el stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
        }
      }

      // Iniciar grabación
      mediaRecorder.start()
      setIsRecording(true)

      // Iniciar timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar grabación'
      setError(message)
    }
  }, [])

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && isRecording) {
        // Detener timer primero para preservar el tiempo final
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }

        // Guardar el handler original y el mimeType
        const originalOnStop = mediaRecorderRef.current.onstop
        const mimeType = mediaRecorderRef.current.mimeType
        
        // Sobrescribir onstop para resolver la Promise con el blob
        mediaRecorderRef.current.onstop = async () => {
          // Crear el blob con el formato grabado
          const originalBlob = new Blob(chunksRef.current, { type: mimeType })
          
          // Convertir a MP3
          const mp3Blob = await convertToMp3(originalBlob)
          
          setAudioBlob(mp3Blob)
          setAudioUrl(URL.createObjectURL(mp3Blob))
          
          // Detener el stream
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
          }
          
          // Llamar al handler original si existía
          if (originalOnStop && typeof originalOnStop === 'function' && mediaRecorderRef.current) {
            originalOnStop.call(mediaRecorderRef.current, new Event('stop'))
          }
          
          resolve(mp3Blob)
        }

        mediaRecorderRef.current.stop()
        setIsRecording(false)
        setIsPaused(false)
      } else {
        resolve(null)
      }
    })
  }, [isRecording])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause()
      setIsPaused(true)

      // Pausar timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isRecording, isPaused])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume()
      setIsPaused(false)

      // Reanudar timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    }
  }, [isRecording, isPaused])

  const clearRecording = useCallback(() => {
    setAudioBlob(null)
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioUrl(null)
    setRecordingTime(0)
    chunksRef.current = []
  }, [audioUrl])

  return {
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
    error,
  }
}

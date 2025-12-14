/* eslint-disable react-refresh/only-export-components */
/**
 * AudioRecorderContext - Contexto global para manejo de grabación de audio
 * Proporciona estado y funciones de grabación accesibles desde cualquier componente
 */

import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { useAudioRecorder } from '../hooks'

interface AudioRecorderContextType {
  isRecording: boolean
  isPaused: boolean
  recordingTime: number
  audioBlob: Blob | null
  audioUrl: string | null
  error: string | null
  startRecording: () => Promise<void>
  stopRecording: () => Promise<Blob | null>
  pauseRecording: () => void
  resumeRecording: () => void
  clearRecording: () => void
}

const AudioRecorderContext = createContext<AudioRecorderContextType | undefined>(undefined)

interface AudioRecorderProviderProps {
  children: ReactNode
}

export function AudioRecorderProvider({ children }: AudioRecorderProviderProps) {
  const audioRecorder = useAudioRecorder()

  return (
    <AudioRecorderContext.Provider value={audioRecorder}>
      {children}
    </AudioRecorderContext.Provider>
  )
}

export function useAudioRecorderContext() {
  const context = useContext(AudioRecorderContext)
  if (context === undefined) {
    throw new Error('useAudioRecorderContext must be used within AudioRecorderProvider')
  }
  return context
}

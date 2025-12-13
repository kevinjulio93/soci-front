/**
 * DashboardHeader - Componente presentacional para el encabezado
 * Principio: Single Responsibility (solo renderiza el header)
 * Props: user, onLogout
 */

import { useAudioRecorderContext } from '../contexts/AudioRecorderContext'
import type { User } from '../types'
import '../styles/Dashboard.scss'

interface DashboardHeaderProps {
  title: string
  user: User | null
  onLogout: () => void
}

export function DashboardHeader({ title, user, onLogout }: DashboardHeaderProps) {
  const { isRecording, recordingTime, audioUrl } = useAudioRecorderContext()

  return (
    <header className="dashboard__header">
      <div className="dashboard__header-content">
        <div className="dashboard__header-left">
          <h1 className="dashboard__title">{title}</h1>
          {isRecording && !audioUrl && (
            <div className="recording-indicator recording-indicator--header">
              <span className="recording-indicator__dot"></span>
              <span className="recording-indicator__text">
                Grabando {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}
        </div>
        <div className="dashboard__user-info">
          <span>Bienvenido, {user?.email}</span>
          <button onClick={onLogout} className="dashboard__logout-btn">
            Cerrar Sesión
          </button>
        </div>
      </div>
    </header>
  )
}

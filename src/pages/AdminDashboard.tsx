/**
 * AdminDashboard - Dashboard del administrador
 * Principio: Single Responsibility (coordina el dashboard)
 * Utiliza componentes presentacionales (DashboardHeader, FeatureCard)
 */

import { useNavigate } from 'react-router-dom'
import { DashboardHeader, FeatureCard, PageHeader } from '../components'
import { useAuth } from '../contexts/AuthContext'
import '../styles/Dashboard.scss'

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      // Error al cerrar sesión
    }
  }

  const handleManageUsers = () => {
    // TODO: Implementar gestión de usuarios
  }

  const handleViewReports = () => {
    // TODO: Implementar vista de reportes
  }

  const handleConfiguration = () => {
    // TODO: Implementar configuración del sistema
  }

  const handleMonitoring = () => {
    // TODO: Implementar monitoreo
  }

  return (
    <div className="dashboard">
      <DashboardHeader
        title="Dashboard Administrador"
        user={user}
        onLogout={handleLogout}
      />

      <main className="dashboard__main">
        <PageHeader
          title="Panel de Control Administrativo"
          description="Gestiona usuarios, estadísticas generales y configuración del sistema."
        />

        <section className="dashboard__content">
          <div className="features-grid">
            <FeatureCard
              title="Gestionar Usuarios"
              description="Crea, edita y elimina usuarios del sistema"
              buttonLabel="Ir a Usuarios"
              onButtonClick={handleManageUsers}
              variant="admin"
            />

            <FeatureCard
              title="Reportes"
              description="Visualiza reportes detallados del sistema"
              buttonLabel="Ver Reportes"
              onButtonClick={handleViewReports}
              variant="admin"
            />

            <FeatureCard
              title="Configuración"
              description="Configura parámetros generales del sistema"
              buttonLabel="Ir a Configuración"
              onButtonClick={handleConfiguration}
              variant="admin"
            />

            <FeatureCard
              title="Monitoreo"
              description="Monitorea la actividad general del sistema"
              buttonLabel="Ver Monitoreo"
              onButtonClick={handleMonitoring}
              variant="admin"
            />
          </div>
        </section>
      </main>
    </div>
  )
}

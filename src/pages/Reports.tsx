/**
 * Reports - Reportes y estadísticas
 * Página principal con submenú para reportes
 */

import { Link, useLocation } from 'react-router-dom'
import { DashboardLayout, MapIcon, FileIcon, UsersIcon, ChartIcon, InfoIcon, PlusIcon } from '../components'
import { ROUTES } from '../constants'
import '../styles/Dashboard.scss'

export default function Reports() {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <DashboardLayout title="Reportes y Estadísticas">
      <div className="dashboard-layout__body">
        <div className="reports-menu">
          <div className="reports-menu__grid">
            <Link
              to={ROUTES.ADMIN_REPORTS_REALTIME}
              className={`reports-menu__card ${isActive(ROUTES.ADMIN_REPORTS_REALTIME) ? 'reports-menu__card--active' : ''}`}
            >
              <div className="reports-menu__icon">
                <MapIcon size={48} strokeWidth={1.5} />
              </div>
              <h3 className="reports-menu__title">Ubicaciones en Tiempo Real</h3>
              <p className="reports-menu__description">
                Visualiza la ubicación actual de todos los socializadores activos en el sistema
              </p>
              <div className="reports-menu__badge">
                <span className="live-dot" />
                En vivo
              </div>
            </Link>

            <Link
              to={ROUTES.ADMIN_REPORTS_MAP}
              className={`reports-menu__card ${isActive(ROUTES.ADMIN_REPORTS_MAP) ? 'reports-menu__card--active' : ''}`}
            >
              <div className="reports-menu__icon">
                <MapIcon size={48} strokeWidth={1.5} />
              </div>
              <h3 className="reports-menu__title">Mapa de Encuestas</h3>
              <p className="reports-menu__description">
                Visualiza todas las encuestas en un mapa, diferenciando exitosas (azul) de rechazadas (rojo)
              </p>
              <div className="reports-menu__badge reports-menu__badge--info">
                <MapIcon size={16} strokeWidth={2} />
                Geográfico
              </div>
            </Link>

            <Link
              to={ROUTES.ADMIN_REPORTS_GENERATE}
              className={`reports-menu__card ${isActive(ROUTES.ADMIN_REPORTS_GENERATE) ? 'reports-menu__card--active' : ''}`}
            >
              <div className="reports-menu__icon">
                <FileIcon size={48} strokeWidth={1.5} />
              </div>
              <h3 className="reports-menu__title">Generar Reporte Tabular</h3>
              <p className="reports-menu__description">
                Crea reportes personalizados por rango de fechas y socializador, exporta en Excel
              </p>
              <div className="reports-menu__badge reports-menu__badge--secondary">
                <PlusIcon size={16} strokeWidth={2} />
                Exportable
              </div>
            </Link>

            <Link
              to={ROUTES.ADMIN_REPORTS_SOCIALIZERS}
              className={`reports-menu__card ${isActive(ROUTES.ADMIN_REPORTS_SOCIALIZERS) ? 'reports-menu__card--active' : ''}`}
            >
              <div className="reports-menu__icon">
                <UsersIcon size={48} strokeWidth={1.5} />
              </div>
              <h3 className="reports-menu__title">Reporte por Rol</h3>
              <p className="reports-menu__description">
                Resumen de intervenciones y métricas agrupadas por rol y usuario seleccionado
              </p>
              <div className="reports-menu__badge reports-menu__badge--secondary">
                <ChartIcon size={16} strokeWidth={2} />
                Agrupado
              </div>
            </Link>
          </div>

          <div className="reports-menu__info">
            <div className="info-card">
              <InfoIcon size={24} className="info-card__icon" />
              <div className="info-card__content">
                <h4 className="info-card__title">Acerca de los Reportes</h4>
                <p className="info-card__text">
                  Los reportes te permiten monitorear la actividad de los socializadores y generar análisis detallados del trabajo de campo.
                  Los datos se actualizan en tiempo real y puedes exportarlos para análisis externos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

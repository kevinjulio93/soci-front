/**
 * FeatureCard - Componente reutilizable para tarjetas de características
 * Principio: DRY (Don't Repeat Yourself)
 * Usado en ambos dashboards
 */

import '../styles/Dashboard.scss'

interface FeatureCardProps {
  title: string
  description: string
  buttonLabel: string
  onButtonClick?: () => void
  variant?: 'default' | 'admin'
}

export function FeatureCard({
  title,
  description,
  buttonLabel,
  onButtonClick,
  variant = 'default',
}: FeatureCardProps) {
  return (
    <div className={`feature-card ${variant === 'admin' ? 'feature-card--admin' : ''}`}>
      <h3 className="feature-card__title">{title}</h3>
      <p className="feature-card__description">{description}</p>
      <button className="feature-card__button" onClick={onButtonClick}>
        {buttonLabel}
      </button>
    </div>
  )
}

/**
 * Card - Componente reutilizable para tarjetas informativas
 */

import { ReactNode } from 'react'

export interface CardProps {
  icon: ReactNode
  title: string
  description: string
  onClick?: () => void
  clickable?: boolean
}

export function Card({
  icon,
  title,
  description,
  onClick,
  clickable = false,
}: CardProps) {
  return (
    <div 
      className="hint-card" 
      onClick={onClick}
      style={clickable || onClick ? { cursor: 'pointer' } : undefined}
    >
      <div className="hint-card__icon">
        {icon}
      </div>
      <h3 className="hint-card__title">{title}</h3>
      <p className="hint-card__text">{description}</p>
    </div>
  )
}

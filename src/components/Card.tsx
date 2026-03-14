import { type ReactNode } from 'react'

interface CardProps {
    children: ReactNode
    title?: ReactNode
    icon?: ReactNode
    actions?: ReactNode
    className?: string
    footer?: ReactNode
}

/**
 * Card - Componente de contenedor genérico para secciones del dashboard
 */
export function Card({
    children,
    title,
    icon,
    actions,
    className = '',
    footer,
}: CardProps) {
    return (
        <div className={`card ${className}`.trim()}>
            {(title || icon || actions) && (
                <div className="card__header">
                    <div className="card__title-wrapper">
                        {icon && <span className="card__icon">{icon}</span>}
                        {title && <h3 className="card__title">{title}</h3>}
                    </div>
                    {actions && <div className="card__actions">{actions}</div>}
                </div>
            )}
            <div className="card__body">
                {children}
            </div>
            {footer && <div className="card__footer">{footer}</div>}
        </div>
    )
}

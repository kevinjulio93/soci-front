import { type ReactNode } from 'react'
import {
    Card as ShadCard,
    CardHeader,
    CardTitle,
    CardAction,
    CardContent,
    CardFooter,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

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
        <ShadCard className={cn(className)}>
            {(title || icon || actions) && (
                <CardHeader>
                    <div className="flex items-center gap-2">
                        {icon && <span className="text-muted-foreground">{icon}</span>}
                        {title && <CardTitle>{title}</CardTitle>}
                    </div>
                    {actions && <CardAction>{actions}</CardAction>}
                </CardHeader>
            )}
            <CardContent>
                {children}
            </CardContent>
            {footer && <CardFooter>{footer}</CardFooter>}
        </ShadCard>
    )
}

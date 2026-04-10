import { useState, useCallback, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { MenuIcon, BackIcon } from './Icons'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
    children: ReactNode
    title: string
    onBack?: () => void
}

/**
 * DashboardLayout - Componente de diseño base para páginas del dashboard
 * Centraliza Sidebar, Header responsivo y el contenedor de contenido principal.
 */
export function DashboardLayout({ children, title, onBack }: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const toggleSidebar = useCallback(() => {
        setSidebarOpen(prev => !prev)
    }, [])

    const closeSidebar = useCallback(() => {
        setSidebarOpen(false)
    }, [])

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Top bar */}
                <div className="flex items-center gap-3 border-b bg-card px-4 py-3">
                    <button
                        className="rounded-md p-1.5 transition-colors hover:bg-accent"
                        onClick={toggleSidebar}
                        aria-label="Abrir menú"
                    >
                        <MenuIcon size={22} />
                    </button>
                    {onBack && (
                        <button
                            className="rounded-md p-1.5 transition-colors hover:bg-accent"
                            onClick={onBack}
                            aria-label="Volver"
                        >
                            <BackIcon size={18} />
                        </button>
                    )}
                    <h1 className={cn('text-base font-semibold flex-1')}>{title}</h1>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    {children}
                </div>
            </div>
        </div>
    )
}

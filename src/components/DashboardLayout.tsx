import { useState, useCallback, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { MenuIcon, BackIcon } from './Icons'

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
        <div className="dashboard-layout">
            <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

            <div className="dashboard-layout__content">
                <div className="dashboard-layout__header">
                    <button
                        className="dashboard-layout__menu-btn"
                        onClick={toggleSidebar}
                        aria-label="Abrir menú"
                    >
                        <MenuIcon size={24} />
                    </button>
                    {onBack ? (
                        <button className="btn-back" onClick={onBack} aria-label="Volver">
                            <BackIcon size={20} />
                        </button>
                    ) : null}
                    <h1 className="dashboard-layout__title">{title}</h1>
                </div>

                <div className="dashboard-layout__body">
                    {children}
                </div>
            </div>
        </div>
    )
}

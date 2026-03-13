/**
 * UnsuccessfulToggleContext - Estado global para mostrar/ocultar encuestas no exitosas
 * Comparte el estado entre todos los componentes que lo necesitan
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'

interface UnsuccessfulToggleContextType {
    showUnsuccessful: boolean
    toggleUnsuccessful: () => void
    setShowUnsuccessful: (value: boolean) => void
}

const UnsuccessfulToggleContext = createContext<UnsuccessfulToggleContextType | undefined>(undefined)

export function UnsuccessfulToggleProvider({ children }: { children: ReactNode }) {
    const [showUnsuccessful, setShowUnsuccessful] = useState(() => {
        const saved = localStorage.getItem('soci_show_unsuccessful')
        return saved !== null ? saved === 'true' : true
    })

    useEffect(() => {
        localStorage.setItem('soci_show_unsuccessful', String(showUnsuccessful))
    }, [showUnsuccessful])

    const toggleUnsuccessful = useCallback(() => {
        setShowUnsuccessful((prev) => !prev)
    }, [])

    return (
        <UnsuccessfulToggleContext.Provider value={{ showUnsuccessful, toggleUnsuccessful, setShowUnsuccessful }}>
            {children}
        </UnsuccessfulToggleContext.Provider>
    )
}

export function useUnsuccessfulToggle(): UnsuccessfulToggleContextType {
    const context = useContext(UnsuccessfulToggleContext)
    if (!context) {
        throw new Error('useUnsuccessfulToggle debe usarse dentro de un UnsuccessfulToggleProvider')
    }
    return context
}

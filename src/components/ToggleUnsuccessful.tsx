import React from 'react'
import { useUnsuccessfulToggle } from '../hooks/useUnsuccessfulToggle'

export const ToggleUnsuccessful: React.FC = () => {
    const { showUnsuccessful, toggleUnsuccessful } = useUnsuccessfulToggle()

    return (
        <div className="toggle-unsuccessful-container" style={{ display: 'flex', alignItems: 'center', marginTop: '1rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #eaeaea' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px', fontSize: '14px', color: '#444', fontWeight: 500, margin: 0 }}>
                <input
                    type="checkbox"
                    checked={showUnsuccessful}
                    onChange={toggleUnsuccessful}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#0066cc' }}
                />
                Mostrar datos de encuestas no exitosas
            </label>
        </div>
    )
}

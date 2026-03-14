import React from 'react'
import { useUnsuccessfulToggle } from '../hooks/useUnsuccessfulToggle'

export const ToggleUnsuccessful: React.FC = () => {
    const { showUnsuccessful, toggleUnsuccessful } = useUnsuccessfulToggle()

    return (
        <div className="toggle-switch-container">
            <label className="toggle-switch" htmlFor="toggle-unsuccessful">
                <input
                    id="toggle-unsuccessful"
                    type="checkbox"
                    className="toggle-switch__input"
                    checked={showUnsuccessful}
                    onChange={toggleUnsuccessful}
                />
                <span className="toggle-switch__slider" />
            </label>
            <span className="toggle-switch-container__label">
                Mostrar encuestas no exitosas
            </span>
        </div>
    )
}

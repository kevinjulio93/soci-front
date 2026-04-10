import React from 'react'
import { useUnsuccessfulToggle } from '../hooks/useUnsuccessfulToggle'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export const ToggleUnsuccessful: React.FC = () => {
    const { showUnsuccessful, toggleUnsuccessful } = useUnsuccessfulToggle()

    return (
        <div className="flex items-center gap-2">
            <Switch
                id="toggle-unsuccessful"
                checked={showUnsuccessful}
                onCheckedChange={toggleUnsuccessful}
            />
            <Label htmlFor="toggle-unsuccessful" className="cursor-pointer text-sm">
                Mostrar encuestas no exitosas
            </Label>
        </div>
    )
}

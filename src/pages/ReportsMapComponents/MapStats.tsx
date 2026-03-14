import { StatCard, StatsGrid, ChartIcon, XIcon, StarIcon, CheckIcon, HomeIcon, PlusIcon, WifiIcon, VerifiedIcon } from '../../components'

interface MapStatsProps {
    stats: {
        total: number
        successful: number
        unsuccessful: number
        defensores: number
        isVerified: number
        linkedHomes: number
        isLinkedHouse: number
        isOffline: number
    }
    filter: string
    onFilterChange: (filter: string) => void
    canViewUnsuccessful: boolean
    showUnsuccessful: boolean
}

/**
 * MapStats - Grid de estadísticas filtrables para el mapa
 */
export function MapStats({
    stats,
    filter,
    onFilterChange,
    canViewUnsuccessful,
    showUnsuccessful
}: MapStatsProps) {

    const handleToggleFilter = (newFilter: string) => {
        onFilterChange(filter === newFilter ? 'all' : newFilter)
    }

    return (
        <StatsGrid className="reports-stats" style={{ marginBottom: '1.5rem' }}>
            <StatCard
                icon={<ChartIcon size={24} />}
                value={stats.total}
                label="Total de Intervenciones"
                variant="primary"
                className={filter === 'all' ? 'stat-card--active' : ''}
                onClick={() => onFilterChange('all')}
                style={{ cursor: 'pointer' }}
            />

            <StatCard
                icon={<CheckIcon size={24} />}
                value={stats.successful}
                label="Exitosas"
                variant="success"
                className={filter === 'successful' ? 'stat-card--active' : ''}
                onClick={() => handleToggleFilter('successful')}
                style={{ cursor: 'pointer' }}
            />

            {canViewUnsuccessful && showUnsuccessful && (
                <StatCard
                    icon={<XIcon size={24} />}
                    value={stats.unsuccessful}
                    label="No Exitosas"
                    variant="danger"
                    className={filter === 'unsuccessful' ? 'stat-card--active' : ''}
                    onClick={() => handleToggleFilter('unsuccessful')}
                    style={{ cursor: 'pointer' }}
                />
            )}

            <StatCard
                icon={<StarIcon size={24} />}
                value={stats.defensores}
                label="Defensores de la Patria"
                variant="warning"
                className={filter === 'defensores' ? 'stat-card--active' : ''}
                onClick={() => handleToggleFilter('defensores')}
                style={{ cursor: 'pointer' }}
            />

            <StatCard
                icon={<VerifiedIcon size={24} />}
                value={stats.isVerified}
                label="Verificadas"
                variant="info"
                className={filter === 'isVerified' ? 'stat-card--active' : ''}
                onClick={() => handleToggleFilter('isVerified')}
                style={{ cursor: 'pointer' }}
            />

            <StatCard
                icon={<HomeIcon size={24} />}
                value={stats.linkedHomes}
                label="Hogares Vinculados"
                variant="success"
                className={filter === 'linkedHomes' ? 'stat-card--active' : ''}
                onClick={() => handleToggleFilter('linkedHomes')}
                style={{ cursor: 'pointer' }}
            />

            <StatCard
                icon={<PlusIcon size={24} />}
                value={stats.isLinkedHouse}
                label="Vinculaciones Extras"
                variant="purple"
                className={filter === 'isLinkedHouse' ? 'stat-card--active' : ''}
                onClick={() => handleToggleFilter('isLinkedHouse')}
                style={{ cursor: 'pointer' }}
            />

            <StatCard
                icon={<WifiIcon size={24} />}
                value={stats.isOffline}
                label="Registro Sin Conexión"
                variant="darkblue"
                className={filter === 'isOffline' ? 'stat-card--active' : ''}
                onClick={() => handleToggleFilter('isOffline')}
                style={{ cursor: 'pointer' }}
            />
        </StatsGrid>
    )
}

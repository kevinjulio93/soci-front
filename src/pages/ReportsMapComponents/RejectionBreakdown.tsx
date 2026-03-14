import { ChartIcon } from '../../components'

interface RejectionStat {
    key: string
    label: string
    count: number
}

interface RejectionBreakdownProps {
    stats: { unsuccessful: number }
    rejectionStats: RejectionStat[]
    visible: boolean
}

/**
 * RejectionBreakdown - Desglose de motivos de rechazo
 */
export function RejectionBreakdown({ stats, rejectionStats, visible }: RejectionBreakdownProps) {
    if (!visible || stats.unsuccessful === 0 || rejectionStats.length === 0) return null

    const getIcon = (key: string) => {
        if (key === 'noEstaInteresado' || key === 'no_interest') return '🚫'
        if (key === 'noSeEncuentraEnCasa' || key === 'not_home') return '🏠'
        if (key === 'noTieneTiempo' || key === 'no_time') return '⏳'
        if (key === 'preocupacionesDePrivacidad' || key === 'privacy_concerns') return '🔒'
        if (key === 'otraRazon' || key === 'other') return '📝'
        if (key === 'no_specified') return '🤷'
        return '❓'
    }

    return (
        <div className="dashboard__section rejection-breakdown-section" style={{ margin: '2rem 0' }}>
            <div className="dashboard__header-section" style={{ marginBottom: '1.5rem', padding: 0 }}>
                <h3 className="dashboard__section-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ChartIcon size={20} />
                    Motivos de Rechazo
                </h3>
                <p className="dashboard__section-desc"> Desglose detallado de las {stats.unsuccessful} encuestas no exitosas</p>
            </div>

            <div className="rejection-breakdown__grid">
                {rejectionStats.map((stat, index) => (
                    <div key={index} className="rejection-breakdown__item">
                        <div className="rejection-breakdown__icon-wrapper">
                            {getIcon(stat.key)}
                        </div>
                        <div className="rejection-breakdown__info">
                            <div className="rejection-breakdown__count">
                                {stat.count}
                            </div>
                            <div className="rejection-breakdown__label">
                                {stat.label}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

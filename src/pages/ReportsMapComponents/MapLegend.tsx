import { InfoIcon } from '../../components'

/**
 * MapLegend - Leyenda del mapa con clusters y pines
 */
export function MapLegend({ isMobile = false }: { isMobile?: boolean }) {
    const containerClass = isMobile ? "map-legend map-legend--mobile" : "map-legend map-legend--overlay"
    const title = isMobile ? "Leyenda del Mapa" : "Leyenda"

    const content = (
        <>
            <div className="map-legend__section">
                <span className="map-legend__section-label">Agrupaciones</span>
                <div className="map-legend__item">
                    <span className="map-legend__dot" style={{ background: 'rgba(59, 130, 246, 0.85)' }}></span>
                    <span>1 – 10</span>
                </div>
                <div className="map-legend__item">
                    <span className="map-legend__dot" style={{ background: 'rgba(234, 179, 8, 0.85)' }}></span>
                    <span>11 – 50</span>
                </div>
                <div className="map-legend__item">
                    <span className="map-legend__dot" style={{ background: 'rgba(239, 68, 68, 0.85)' }}></span>
                    <span>51 – 200</span>
                </div>
                <div className="map-legend__item">
                    <span className="map-legend__dot" style={{ background: 'rgba(139, 92, 246, 0.85)' }}></span>
                    <span>200+</span>
                </div>
            </div>
            <div className="map-legend__section">
                <span className="map-legend__section-label">Encuestas</span>
                <div className="map-legend__item">
                    <span className="map-legend__pin" style={{ background: '#3b82f6' }}>✓</span>
                    <span>Exitosa</span>
                </div>
                <div className="map-legend__item">
                    <span className="map-legend__pin" style={{ background: '#ef4444' }}>✗</span>
                    <span>No exitosa</span>
                </div>
            </div>
        </>
    )

    if (isMobile) {
        return (
            <div className={containerClass}>
                <div className="map-legend__title">
                    <InfoIcon size={14} />
                    {title}
                </div>
                <div className="map-legend__row">
                    {content}
                </div>
            </div>
        )
    }

    return (
        <div className={containerClass}>
            <div className="map-legend__title">
                <InfoIcon size={14} />
                {title}
            </div>
            {content}
        </div>
    )
}

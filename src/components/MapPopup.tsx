/**
 * MapPopup - Componente reutilizable para popups de mapas
 * Principio: Single Responsibility
 */

export interface MapPopupField {
  label: string
  value: string | number | null | undefined
  color?: string
}

export interface MapPopupProps {
  title: string
  fields: MapPopupField[]
  minWidth?: string
}

export function MapPopup({ title, fields, minWidth = '200px' }: MapPopupProps) {
  return (
    <div style={{ minWidth }}>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
        {title}
      </h4>
      {fields.map((field, index) => (
        <div
          key={index}
          style={{
            fontSize: '12px',
            color: '#6b7280',
            marginBottom: index < fields.length - 1 ? '4px' : '0',
          }}
        >
          <strong>{field.label}:</strong>{' '}
          <span style={field.color ? { color: field.color } : undefined}>
            {field.value || '—'}
          </span>
        </div>
      ))}
    </div>
  )
}

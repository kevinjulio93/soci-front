import 'leaflet'

declare module 'leaflet' {
  function markerClusterGroup(options?: {
    chunkedLoading?: boolean
    removeOutsideVisibleBounds?: boolean
    showCoverageOnHover?: boolean
    maxClusterRadius?: number
  }): LayerGroup
}

import { Circle, MapContainer, Marker, TileLayer } from 'react-leaflet'
import { createClusterIcon } from './mapIcons'

const tiles = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const bangalore: [number, number] = [12.9716, 77.5946]

interface MapBackdropProps {
  opacity?: number
  blur?: number
  tint?: string
  className?: string
}

/* Apple-Maps-style light map image, non-interactive, layered behind glass cards */
function MapBackdrop({ opacity = 0.6, blur = 1, tint = '', className = '' }: MapBackdropProps) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className="absolute inset-0" style={{ opacity }}>
        <MapContainer
          center={bangalore}
          zoom={11}
          attributionControl={false}
          zoomControl={false}
          dragging={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          boxZoom={false}
          keyboard={false}
          touchZoom={false}
          className="h-full w-full"
          style={{ pointerEvents: 'none', filter: `blur(${blur}px) saturate(1.1) brightness(1.08)` }}
        >
          <TileLayer url={tiles} attribution="" />
          <Circle
            center={bangalore}
            radius={5000}
            pathOptions={{ color: '#22d3ee', weight: 2, dashArray: '4 8', fillColor: '#22d3ee', fillOpacity: 0.05 }}
          />
          <Marker position={[12.976, 77.5946]} icon={createClusterIcon('LOW', 3)} />
          <Marker position={[12.9716, 77.606]} icon={createClusterIcon('HIGH', 9)} />
          <Marker position={[12.953, 77.589]} icon={createClusterIcon('MEDIUM', 5)} />
        </MapContainer>
      </div>
      {tint && <div className={`absolute inset-0 ${tint}`} />}
    </div>
  )
}

export default MapBackdrop
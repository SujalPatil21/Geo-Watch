import { Fragment, useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import 'leaflet.heat'
import { Circle, CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { Locate, Maximize2, Minimize2, Minus, Plus, Search, Layers, Flame, MapPin, Eye, Compass, X } from 'lucide-react'
import { createClusterIcon, cyanPinIcon } from '../mapIcons'
import type { Cluster } from '../../types/cluster'
import type { Event } from '../../types/event'
import RiskBadge from './RiskBadge'

const MAP_TILES = {
  cartoDark: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  imageryDark: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
  },
}

const heatGradient: Record<string, string> = {
  0.2: '#0e7490',
  0.4: '#0ea5e9',
  0.6: '#fb923c',
  0.8: '#f87171',
  1.0: '#ef4444',
}

type UserLocation = { lat: number; lng: number; accuracy: number }

interface MapPanelProps {
  eventData: Event
  clusters: Cluster[]
  selectedIndex: number | null
  onSelectCluster: (index: number | null) => void
  mapCenter: [number, number]
  userLocation: UserLocation | null
  locating: boolean
  locationError: string
  onLocate: () => void
  setMapRef: (map: L.Map | null) => void
}

type HeatPoint = [number, number, number]

type SearchResult = {
  display_name: string
  lat: string
  lon: string
}

function HeatmapOverlay({ points, show }: { points: HeatPoint[]; show: boolean }) {
  const map = useMap()

  useEffect(() => {
    if (!show || points.length === 0) return

    const heatLayer = (L as unknown as { heatLayer: (value: HeatPoint[], options: Record<string, unknown>) => L.Layer }).heatLayer(
      points,
      { radius: 28, blur: 18, maxZoom: 17, gradient: heatGradient, minOpacity: 0.35 },
    )

    heatLayer.addTo(map)
    return () => {
      map.removeLayer(heatLayer)
    }
  }, [map, points, show])

  return null
}

function FocusSelected({ center }: { center: [number, number] | null }) {
  const map = useMap()

  useEffect(() => {
    if (center) {
      map.flyTo(center, 16, { duration: 0.8, easeLinearity: 0.25 })
    }
  }, [center, map])

  return null
}

function MapEventsHandler({ onMouseMove, onMapClick }: { onMouseMove: (coords: { lat: number; lng: number }) => void; onMapClick: () => void }) {
  useMapEvents({
    mousemove(e) {
      onMouseMove({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
    click() {
      onMapClick()
    },
  })
  return null
}

function ZoomControls({ isFullscreen, onToggleFullscreen, onResetView }: { isFullscreen: boolean; onToggleFullscreen: () => void; onResetView: () => void }) {
  const map = useMap()

  return (
    <div className="absolute bottom-5 right-4 z-[500] flex flex-col overflow-hidden rounded-xl border border-mid/50 bg-[#06141b]/90 shadow-2xl backdrop-blur-2xl">
      <button
        type="button"
        title="Zoom in"
        onClick={() => map.zoomIn()}
        className="flex h-9 w-9 items-center justify-center text-[#ccd0cf] transition hover:bg-deep hover:text-white"
      >
        <Plus className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Zoom out"
        onClick={() => map.zoomOut()}
        className="flex h-9 w-9 items-center justify-center border-t border-mid/40 text-[#ccd0cf] transition hover:bg-deep hover:text-white"
      >
        <Minus className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Recenter Map"
        onClick={onResetView}
        className="flex h-9 w-9 items-center justify-center border-t border-mid/40 text-cyan-400 transition hover:bg-deep hover:text-cyan-300"
      >
        <Compass className="h-4 w-4" />
      </button>
      <button
        type="button"
        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
        onClick={onToggleFullscreen}
        className="flex h-9 w-9 items-center justify-center border-t border-mid/40 text-[#ccd0cf] transition hover:bg-deep hover:text-white"
      >
        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </button>
    </div>
  )
}

function MapPanel({
  eventData,
  clusters,
  selectedIndex,
  onSelectCluster,
  mapCenter,
  userLocation,
  locating,
  locationError,
  onLocate,
  setMapRef,
}: MapPanelProps) {
  const [internalMap, setInternalMap] = useState<L.Map | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [tileKey, setTileKey] = useState<'cartoDark' | 'imageryDark'>('cartoDark')
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [showClusters, setShowClusters] = useState(true)
  const [showGeofence, setShowGeofence] = useState(true)
  const [showLayerMenu, setShowLayerMenu] = useState(false)
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null)

  // Search autocomplete state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [searchPin, setSearchPin] = useState<[number, number] | null>(null)

  const selectedCluster = selectedIndex !== null ? clusters[selectedIndex] : null

  const heatmapPoints = useMemo<HeatPoint[]>(
    () => clusters.map((cluster) => [cluster.centerLat, cluster.centerLng, Math.max(1, cluster.incidentCount)]),
    [clusters],
  )

  const selectedCenter: [number, number] | null = useMemo(
    () => (selectedCluster ? [selectedCluster.centerLat, selectedCluster.centerLng] : null),
    [selectedCluster],
  )

  const handleMapInit = (mapInstance: L.Map) => {
    setInternalMap(mapInstance)
    setMapRef(mapInstance)
  }

  const handleResetView = () => {
    if (internalMap) {
      internalMap.flyTo(mapCenter, 15, { duration: 0.8 })
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev)
    setTimeout(() => {
      internalMap?.invalidateSize()
    }, 150)
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (!query.trim() || query.length < 3) {
      setSearchResults([])
      return
    }

    setSearching(true)
    setSearchError('')
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`)
      const data = (await res.json()) as SearchResult[]
      setSearchResults(data || [])
    } catch {
      setSearchError('Search failed')
    } finally {
      setSearching(false)
    }
  }

  const selectSearchResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    setSearchPin([lat, lng])
    setSearchResults([])
    setSearchQuery(result.display_name.split(',')[0])
    if (internalMap) {
      internalMap.flyTo([lat, lng], 16, { duration: 1 })
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setSearchPin(null)
  }

  return (
    <section
      className={`relative overflow-hidden border border-mid/40 bg-[#06141b] shadow-[0_12px_40px_rgba(0,0,0,0.5)] transition-all duration-300 backdrop-blur-2xl ${
        isFullscreen ? 'fixed inset-4 z-[9999] h-[calc(100vh-2rem)] rounded-3xl' : 'min-h-[540px] rounded-2xl'
      }`}
    >
      {/* Floating Nominatim Search & Bar */}
      <div className="absolute left-3 top-3 z-[500] flex max-w-[340px] flex-col gap-2">
        <div className="relative flex items-center rounded-xl border border-mid/60 bg-[#06141b]/85 px-3 py-2 text-xs text-[#ccd0cf] shadow-xl backdrop-blur-xl">
          <Search className="mr-2 h-4 w-4 shrink-0 text-cyan-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => void handleSearch(e.target.value)}
            placeholder="Search address or location..."
            className="w-full bg-transparent text-xs text-[#ccd0cf] outline-none placeholder:text-muted"
          />
          {searching && <span className="h-3 w-3 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />}
          {searchQuery && !searching && (
            <button type="button" onClick={clearSearch} className="text-muted hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Autocomplete Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="max-h-56 overflow-y-auto rounded-xl border border-mid/60 bg-[#0b1d28]/95 p-1.5 shadow-2xl backdrop-blur-2xl">
            {searchResults.map((result, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectSearchResult(result)}
                className="flex w-full items-start gap-2 rounded-lg p-2 text-left text-xs text-[#ccd0cf] transition hover:bg-surface"
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" />
                <span className="line-clamp-2 leading-tight">{result.display_name}</span>
              </button>
            ))}
          </div>
        )}

        {searchError && (
          <div className="rounded-lg border border-rose-400/30 bg-rose-500/20 px-2.5 py-1 text-[10px] text-rose-300 backdrop-blur-xl shadow-lg">
            {searchError}
          </div>
        )}
      </div>

      {/* Layer Toggle Menu Trigger */}
      <div className="absolute right-3 top-3 z-[500] flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLayerMenu((prev) => !prev)}
            title="Layer Settings"
            className="flex h-9 items-center gap-2 rounded-xl border border-mid/50 bg-[#06141b]/90 px-3 text-xs font-semibold text-[#ccd0cf] shadow-lg backdrop-blur-xl transition hover:bg-surface"
          >
            <Layers className="h-4 w-4 text-cyan-400" />
            <span className="hidden sm:inline">Layers</span>
          </button>

          {showLayerMenu && (
            <div className="absolute right-0 top-11 z-[500] w-48 rounded-2xl border border-mid/50 bg-[#081722]/95 p-3 shadow-2xl backdrop-blur-2xl space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Map Layers</p>

              <label className="flex items-center justify-between text-xs text-[#ccd0cf] cursor-pointer hover:text-white">
                <span className="flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-rose-400" />
                  Heatmap Overlay
                </span>
                <input
                  type="checkbox"
                  checked={showHeatmap}
                  onChange={(e) => setShowHeatmap(e.target.checked)}
                  className="rounded border-mid text-cyan-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-[#ccd0cf] cursor-pointer hover:text-white">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-amber-400" />
                  Risk Clusters
                </span>
                <input
                  type="checkbox"
                  checked={showClusters}
                  onChange={(e) => setShowClusters(e.target.checked)}
                  className="rounded border-mid text-cyan-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-[#ccd0cf] cursor-pointer hover:text-white">
                <span className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-cyan-400" />
                  Geofence Boundary
                </span>
                <input
                  type="checkbox"
                  checked={showGeofence}
                  onChange={(e) => setShowGeofence(e.target.checked)}
                  className="rounded border-mid text-cyan-500 focus:ring-0"
                />
              </label>

              <hr className="border-mid/40" />

              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Base Map Style</p>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setTileKey('cartoDark')}
                  className={`rounded-lg border px-2 py-1 transition ${
                    tileKey === 'cartoDark'
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 font-semibold'
                      : 'border-mid/40 bg-surface/50 text-muted hover:text-white'
                  }`}
                >
                  Dark Vector
                </button>
                <button
                  type="button"
                  onClick={() => setTileKey('imageryDark')}
                  className={`rounded-lg border px-2 py-1 transition ${
                    tileKey === 'imageryDark'
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 font-semibold'
                      : 'border-mid/40 bg-surface/50 text-muted hover:text-white'
                  }`}
                >
                  Satellite
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <MapContainer
        center={mapCenter}
        zoom={15}
        className="h-full min-h-[540px] w-full"
        zoomControl={false}
        ref={handleMapInit}
        attributionControl={false}
      >
        <TileLayer attribution={MAP_TILES[tileKey].attribution} url={MAP_TILES[tileKey].url} />
        <HeatmapOverlay points={heatmapPoints} show={showHeatmap} />
        <FocusSelected center={selectedCenter} />
        <MapEventsHandler onMouseMove={setCursorCoords} onMapClick={() => setShowLayerMenu(false)} />

        {/* User Geolocation Marker */}
        {userLocation && (
          <>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={userLocation.accuracy}
              pathOptions={{ color: '#22d3ee', fillColor: '#22d3ee', fillOpacity: 0.14, stroke: false }}
            />
            <CircleMarker
              center={[userLocation.lat, userLocation.lng]}
              radius={8}
              pathOptions={{ color: '#ffffff', weight: 2.5, fillColor: '#06b6d4', fillOpacity: 1 }}
            >
              <Popup>
                <div className="text-xs text-[#ccd0cf]">
                  <p className="font-semibold text-cyan-300">Your Current Location</p>
                  <p className="text-[10px] text-muted">Accuracy: ±{Math.round(userLocation.accuracy)}m</p>
                </div>
              </Popup>
            </CircleMarker>
          </>
        )}

        {/* Search dropped pin */}
        {searchPin && <Marker position={searchPin} icon={cyanPinIcon} />}

        {/* Event Geofence Ring */}
        {showGeofence && (
          <>
            <Circle
              center={mapCenter}
              radius={eventData.radius}
              pathOptions={{ color: '#22d3ee', fillColor: '#22d3ee', fillOpacity: 0.04, dashArray: '8 6', weight: 2 }}
            />
            <CircleMarker
              center={mapCenter}
              radius={6}
              pathOptions={{ color: '#22d3ee', weight: 2, fillColor: '#0891b2', fillOpacity: 1 }}
            >
              <Popup>
                <div className="text-xs text-[#ccd0cf]">
                  <p className="font-bold text-cyan-300">{eventData.name}</p>
                  <p className="text-[10px] text-muted">Event Center • Radius: {eventData.radius}m</p>
                </div>
              </Popup>
            </CircleMarker>
          </>
        )}

        {/* Cluster Markers */}
        {showClusters &&
          clusters.map((cluster, index) => {
            const center: [number, number] = [cluster.centerLat, cluster.centerLng]
            return (
              <Fragment key={`cluster-${index}`}>
                <Marker
                  position={center}
                  icon={createClusterIcon(cluster.riskLevel, cluster.incidentCount)}
                  eventHandlers={{ click: () => onSelectCluster(index) }}
                >
                  <Popup>
                    <div className="space-y-2.5 text-[#ccd0cf] min-w-[200px]">
                      <div className="flex items-center justify-between gap-3 border-b border-mid/40 pb-2">
                        <div>
                          <h3 className="text-xs font-bold text-white">{cluster.incidentCount} SOS Report(s)</h3>
                          <p className="text-[10px] text-muted">Risk Zone Cluster</p>
                        </div>
                        <RiskBadge level={cluster.riskLevel} />
                      </div>
                      {cluster.incidents.length > 0 ? (
                        <div className="max-h-36 overflow-y-auto space-y-1.5 text-xs text-muted pr-1">
                          {cluster.incidents.map((incident, i) => (
                            <div key={i} className="rounded-lg border border-mid/30 bg-deep/40 p-1.5">
                              <p className="font-medium text-[#ccd0cf]">{incident.name}</p>
                              <p className="text-[10px] text-cyan-400">📞 {incident.phoneNumber}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted">No individual reporter details available.</p>
                      )}
                    </div>
                  </Popup>
                </Marker>

                {/* Selected cluster glowing ring */}
                {selectedIndex === index && (
                  <Circle
                    center={center}
                    radius={Math.max(50, cluster.incidentCount * 10 + 15)}
                    pathOptions={{ color: '#22d3ee', weight: 4, fillColor: '#22d3ee', fillOpacity: 0.08, dashArray: '4 4' }}
                  />
                )}
              </Fragment>
            )
          })}

        <ZoomControls isFullscreen={isFullscreen} onToggleFullscreen={toggleFullscreen} onResetView={handleResetView} />
      </MapContainer>

      {/* Selected Cluster Info Card */}
      <div className="absolute left-3 bottom-14 z-[500] flex max-w-[260px] items-center gap-2.5 rounded-xl border border-mid/50 bg-[#06141b]/90 px-3 py-2.5 shadow-2xl backdrop-blur-2xl">
        {selectedCluster ? (
          <>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-deep text-xs font-bold text-cyan-300 ring-1 ring-mid/60">
              {selectedCluster.incidentCount}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[#ccd0cf]">
                CL-{(selectedCluster.centerLat.toFixed(4) + selectedCluster.centerLng.toFixed(4)).replace('.', '').slice(-5)}
              </p>
              <p className="text-[10px] text-muted">Selected Zone</p>
            </div>
            <RiskBadge level={selectedCluster.riskLevel} />
          </>
        ) : (
          <p className="text-xs text-muted">Click a marker on the map to inspect live cluster</p>
        )}
      </div>

      {/* Locate Me GPS Button */}
      <button
        type="button"
        onClick={onLocate}
        disabled={locating}
        title="Locate Me"
        className="absolute left-3 top-16 z-[500] flex h-9 w-9 items-center justify-center rounded-xl border border-mid/50 bg-[#06141b]/90 text-[#ccd0cf] shadow-xl backdrop-blur-xl transition hover:bg-surface disabled:opacity-50"
      >
        <Locate className={`h-4 w-4 ${locating ? 'animate-spin text-cyan-400' : 'text-cyan-400'}`} />
      </button>
      {locationError && (
        <p className="absolute left-3 top-28 z-[500] max-w-[220px] rounded-lg border border-rose-400/30 bg-rose-500/20 px-2.5 py-1 text-[10px] text-rose-300 backdrop-blur-xl shadow-lg">
          {locationError}
        </p>
      )}

      {/* Live Coordinates Footer */}
      <div className="absolute left-3 bottom-3 z-[500] flex items-center gap-3 rounded-lg border border-mid/40 bg-[#06141b]/80 px-2.5 py-1 text-[10px] font-mono text-muted backdrop-blur-xl">
        {cursorCoords ? (
          <span>
            LAT: {cursorCoords.lat.toFixed(5)} • LNG: {cursorCoords.lng.toFixed(5)}
          </span>
        ) : (
          <span>Move cursor over map</span>
        )}
      </div>

      {/* Risk Legend Overlay */}
      <div className="absolute bottom-16 right-4 z-[500] rounded-xl border border-mid/40 bg-[#06141b]/90 p-3 text-[10px] text-muted shadow-2xl backdrop-blur-2xl">
        <p className="mb-2 text-[11px] font-bold text-[#ccd0cf]">Risk Zones</p>
        <div className="space-y-1.5">
          <p className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="risk-pulse-ring absolute inline-flex h-full w-full rounded-full bg-rose-400/80" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
            </span>
            <span className="text-rose-300 font-medium">High Risk</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="text-amber-300 font-medium">Medium Risk</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
            <span className="text-cyan-300 font-medium">Low Risk</span>
          </p>
        </div>
      </div>
    </section>
  )
}

export default MapPanel
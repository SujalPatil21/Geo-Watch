import { Fragment, useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import 'leaflet.heat'
import { Circle, CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { useParams } from 'react-router-dom'
import type { Cluster, Incident, RiskLevel } from '../types/cluster'
import type { Event } from '../types/event'
import { getClustersByEventId, getEventById } from '../services/api'
import { createWebSocketClient } from '../services/websocket'
type ClusterLike = {
  centerLat?: unknown
  centerLng?: unknown
  latitude?: unknown
  longitude?: unknown
  lat?: unknown
  lng?: unknown
  incidentCount?: unknown
  reportCount?: unknown
  riskLevel?: unknown
  severity?: unknown
  incidents?: unknown
  eventId?: unknown
}

const wsEndpoint = import.meta.env.VITE_WS_ENDPOINT ?? 'http://localhost:8080/ws'

const riskColorMap: Record<RiskLevel, string> = {
  HIGH: 'red',
  MEDIUM: 'orange',
  LOW: 'yellow',
}

const isRiskLevel = (value: string): value is RiskLevel => value === 'HIGH' || value === 'MEDIUM' || value === 'LOW'

const parseNumber = (value: unknown): number | null => {
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

const normalizeIncident = (value: unknown): Incident | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as Record<string, unknown>
  const name = typeof record.name === 'string' && record.name.trim() ? record.name.trim() : 'Unknown Reporter'
  const phoneNumber =
    typeof record.phoneNumber === 'string' && record.phoneNumber.trim() ? record.phoneNumber.trim() : 'N/A'

  return { name, phoneNumber }
}

const normalizeCluster = (value: unknown, targetEventId: string): Cluster | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as ClusterLike
  if (record.eventId !== undefined && String(record.eventId) !== targetEventId) {
    return null
  }

  const centerLat = parseNumber(record.centerLat ?? record.latitude ?? record.lat)
  const centerLng = parseNumber(record.centerLng ?? record.longitude ?? record.lng)
  if (centerLat === null || centerLng === null) {
    return null
  }

  const incidents = Array.isArray(record.incidents)
    ? record.incidents.map((incident) => normalizeIncident(incident)).filter((incident): incident is Incident => incident !== null)
    : []

  const incidentCount = parseNumber(record.incidentCount ?? record.reportCount) ?? incidents.length
  const riskRaw = String(record.riskLevel ?? record.severity ?? 'LOW').toUpperCase()
  const riskLevel: RiskLevel = isRiskLevel(riskRaw) ? riskRaw : 'LOW'

  return {
    centerLat,
    centerLng,
    incidentCount,
    riskLevel,
    incidents,
  }
}

const normalizeClusters = (payload: unknown, targetEventId: string): Cluster[] => {
  if (Array.isArray(payload)) {
    return payload.map((cluster) => normalizeCluster(cluster, targetEventId)).filter((cluster): cluster is Cluster => cluster !== null)
  }

  if (!payload || typeof payload !== 'object') {
    return []
  }

  const record = payload as Record<string, unknown>
  if (record.eventId !== undefined && String(record.eventId) !== targetEventId) {
    return []
  }

  if (Array.isArray(record.clusters)) {
    return record.clusters
      .map((cluster) => normalizeCluster(cluster, targetEventId))
      .filter((cluster): cluster is Cluster => cluster !== null)
  }

  if (Array.isArray(record.data)) {
    return record.data.map((cluster) => normalizeCluster(cluster, targetEventId)).filter((cluster): cluster is Cluster => cluster !== null)
  }

  return []
}

function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap()

  useEffect(() => {
    map.setView(center)
  }, [center, map])

  return null
}

function MapClickHandler() {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng
      console.log('Latitude:', lat, 'Longitude:', lng)
    },
  })

  return null
}

type HeatPoint = [number, number, number]

function HeatmapOverlay({ points }: { points: HeatPoint[] }) {
  const map = useMap()

  useEffect(() => {
    const heatLayer = (L as unknown as { heatLayer: (value: HeatPoint[], options: Record<string, number>) => L.Layer }).heatLayer(
      points,
      {
        radius: 25,
        blur: 15,
        maxZoom: 17,
      },
    )

    heatLayer.addTo(map)
    return () => {
      map.removeLayer(heatLayer)
    }
  }, [map, points])

  return null
}

function Dashboard() {
  const params = useParams()
  const { eventId } = params
  console.log('URL:', window.location.pathname)
  console.log('Params:', params)
  console.log('Dashboard Event ID:', eventId)
  const [eventData, setEventData] = useState<Event | null>(null)
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!eventId || eventId === 'undefined' || eventId === 'null') {
      console.error('Dashboard loaded without eventId')
      setError('Missing event ID.')
      setLoading(false)
      return
    }

    let isMounted = true

    const loadDashboard = async () => {
      try {
        setLoading(true)
        setError('')

        const [eventResponse, clusterResponse] = await Promise.all([
          getEventById(eventId),
          getClustersByEventId(eventId),
        ])

        if (!isMounted) {
          return
        }

        const normalizedEvent: Event = {
          id: eventResponse.id ?? eventId,
          name: eventResponse.name ?? 'GeoWatch Event',
          centerLat: Number(eventResponse.centerLat),
          centerLng: Number(eventResponse.centerLng),
          radius: Number(eventResponse.radius),
          startTime: eventResponse.startTime ?? '',
          endTime: eventResponse.endTime ?? '',
        }

        if (
          !Number.isFinite(normalizedEvent.centerLat) ||
          !Number.isFinite(normalizedEvent.centerLng) ||
          !Number.isFinite(normalizedEvent.radius)
        ) {
          setError('Event location data is incomplete.')
          setEventData(null)
          setClusters([])
          return
        }

        setEventData(normalizedEvent)
        setClusters(normalizeClusters(clusterResponse, eventId))
      } catch {
        if (!isMounted) {
          return
        }

        setError('Unable to load event monitoring data.')
        setEventData(null)
        setClusters([])
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void loadDashboard()

    return () => {
      isMounted = false
    }
  }, [eventId])

useEffect(() => {

  if (!eventId || eventId === 'undefined' || eventId === 'null') return

  const client = createWebSocketClient(wsEndpoint)
  client.debug = () => {}

  client.connect({}, () => {

    client.subscribe("/topic/risk-updates", (message) => {

      try {
        const payload = JSON.parse(message.body)
        setClusters(normalizeClusters(payload, eventId))
      } catch (err) {
        console.error("WebSocket parse error", err)
      }

    })

  })

  return () => {
    try {
      client.disconnect(() => {})
    } catch {}
  }

}, [eventId])

  const mapCenter = useMemo<[number, number]>(
    () => [eventData?.centerLat ?? 20.5937, eventData?.centerLng ?? 78.9629],
    [eventData?.centerLat, eventData?.centerLng],
  )
  const heatmapPoints = useMemo<[number, number, number][]>(
    () => clusters.map((cluster) => [cluster.centerLat, cluster.centerLng, cluster.incidentCount]),
    [clusters],
  )

  if (loading) {
    return (
      <section className="rounded-xl bg-slate-800 p-8 shadow-sm">
        <h1 className="text-3xl font-bold">GeoWatch</h1>
        <p className="mt-2 text-slate-300">Loading dashboard...</p>
      </section>
    )
  }

  if (error || !eventData) {
    return (
      <section className="rounded-xl bg-slate-800 p-8 shadow-sm">
        <h1 className="text-3xl font-bold">GeoWatch</h1>
        <p className="mt-2 text-rose-300">{error || 'Dashboard unavailable.'}</p>
      </section>
    )
  }
return (
  <section className="space-y-6 rounded-xl bg-slate-800 p-8 shadow-sm">
    
    <div>
      <h1 className="text-3xl font-bold">GeoWatch</h1>
      <p className="mt-2 text-slate-300">
        Dashboard for event: {eventData.name}
      </p>
    </div>

    <div className="relative overflow-hidden rounded-xl border border-slate-600">

      <MapContainer center={mapCenter} zoom={15} className="h-[34rem] w-full">

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <HeatmapOverlay points={heatmapPoints} />

        <MapClickHandler />
        <MapRecenter center={mapCenter} />

        {/* Event geofence */}
        <Circle
          center={mapCenter}
          radius={eventData.radius}
          pathOptions={{
            color: "#33C3D9",
            fillColor: "#33C3D9",
            fillOpacity: 0.12,
          }}
        />
{/* Incident clusters */}
{clusters.map((cluster, index) => {
  const center: [number, number] = [cluster.centerLat, cluster.centerLng]

  return (
    <Fragment key={`cluster-${index}`}>
      {/* Bright red incident dot */}
      <CircleMarker
        center={center}
        radius={6}
        pathOptions={{
          color: "#ff0000",
          fillColor: "#ff0000",
          fillOpacity: 1
        }}
      />

      {/* Cluster circle */}
      <Circle
        center={center}
        radius={Math.max(8, cluster.incidentCount * 4)}
        pathOptions={{
          color: riskColorMap[cluster.riskLevel],
          fillColor: riskColorMap[cluster.riskLevel],
          fillOpacity: 0.25
        }}
      >
        <Popup>
          <div className="space-y-2 text-slate-800">
            <h3 className="text-sm font-semibold">
              Incident Reports ({cluster.incidentCount})
            </h3>

            {cluster.incidents.length > 0 ? (
              <div className="space-y-1 text-xs">
                {cluster.incidents.map((incident, i) => (
                  <p key={i}>
                    {incident.name} - {incident.phoneNumber}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-xs">No incident details available.</p>
            )}
          </div>
        </Popup>
      </Circle>
    </Fragment>
  )
})}

      </MapContainer>

      {/* Risk Legend */}
      <div className="absolute bottom-3 right-3 z-[400] rounded-lg bg-slate-900/90 p-3 text-xs text-slate-100 shadow-md">
        <p className="mb-2 text-sm font-semibold">Risk Legend</p>

        <div className="space-y-1">
          <p className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500"></span>
            High Risk
          </p>

          <p className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-orange-400"></span>
            Medium Risk
          </p>

          <p className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-yellow-300"></span>
            Low Risk
          </p>
        </div>
      </div>
      </div>
    </section>
  )
}

export default Dashboard

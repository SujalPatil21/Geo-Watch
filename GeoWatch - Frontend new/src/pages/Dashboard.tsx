import { useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import { motion } from 'framer-motion'
import { useParams } from 'react-router-dom'
import GlassCard from '../components/GlassCard'
import Reveal from '../components/Reveal'

import ActiveIncidentCard from '../components/dashboard/ActiveIncidentCard'
import IncidentList from '../components/dashboard/IncidentList'
import MapPanel from '../components/dashboard/MapPanel'
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

const wsEndpoint = (() => {
  const base = import.meta.env.VITE_WS_BASE_URL || import.meta.env.VITE_WS_ENDPOINT || `http://${window.location.hostname}:8080/ws`
  return base.endsWith('/ws') ? base : base.replace(/\/+$/, '') + '/ws'
})()

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

function Dashboard() {
  const params = useParams()
  const { eventId } = params
  const [eventData, setEventData] = useState<Event | null>(null)
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [map, setMap] = useState<L.Map | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')

  const locateMe = () => {
    setLocating(true)
    setLocationError('')
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.')
      setLocating(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        setUserLocation({ lat: latitude, lng: longitude, accuracy })
        if (map) {
          map.flyTo([latitude, longitude], 15)
        }
        setLocating(false)
      },
      () => {
        setLocationError('Unable to retrieve your location. Please check your permissions.')
        setLocating(false)
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  useEffect(() => {
    if (!eventId || eventId === 'undefined' || eventId === 'null') {
      console.error('Dashboard loaded without eventId')
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
          eventId: eventResponse.eventId ?? eventId,
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

    let isActive = true
    const client = createWebSocketClient(wsEndpoint)
    client.debug = () => {}

    const connectClient = () => {
      client.connect(
        {},
        () => {
          if (!isActive) {
            client.disconnect(() => {})
            return
          }

          client.subscribe(`/topic/risk-updates/${eventId}`, (message) => {
            try {
              if (!isActive) return
              const payload = JSON.parse(message.body)
              setClusters(normalizeClusters(payload, eventId))
            } catch (err) {
              console.error('WebSocket parse error', err)
            }
          })
        },
        (error: unknown) => {
          if (isActive) console.error('WebSocket connection error:', error)
        }
      )
    }

    connectClient()

    return () => {
      isActive = false
      try {
        if (client && client.connected) {
          client.disconnect(() => {})
        }
      } catch (error) {
        console.error('WebSocket safe disconnect error', error)
      }
    }
  }, [eventId])

  const mapCenter = useMemo<[number, number]>(
    () => [eventData?.centerLat ?? 20.5937, eventData?.centerLng ?? 78.9629],
    [eventData?.centerLat, eventData?.centerLng],
  )

  const selectedCluster = useMemo(
    () => (selectedIndex !== null && clusters[selectedIndex] ? clusters[selectedIndex] : null),
    [selectedIndex, clusters],
  )

  const handleSelect = (index: number | null) => setSelectedIndex(index)

  if (!eventId || eventId === 'undefined' || eventId === 'null') {
    return (
      <GlassCard className="p-10">
        <h1 className="text-xl font-semibold text-[#ccd0cf]">GeoWatch</h1>
        <p className="mt-2 text-sm text-rose-300">Missing event ID.</p>
      </GlassCard>
    )
  }

  if (loading) {
    return (
      <GlassCard className="p-10">
        <h1 className="text-xl font-semibold text-[#ccd0cf]">GeoWatch</h1>
        <p className="mt-2 animate-pulse text-sm text-muted">Loading dashboard...</p>
      </GlassCard>
    )
  }

  if (error || !eventData) {
    return (
      <GlassCard className="p-10">
        <h1 className="text-xl font-semibold text-[#ccd0cf]">GeoWatch</h1>
        <p className="mt-2 text-sm text-rose-300">{error || 'Dashboard unavailable.'}</p>
      </GlassCard>
    )
  }

  return (
    <Reveal direction="none">
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-[#ccd0cf]">Live Monitoring</h1>
            <p className="mt-0.5 text-sm text-muted">
              Dashboard for <span className="font-semibold text-muted">{eventData.name}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <div className="rounded-lg border border-mid/40 bg-deep/50 px-3 py-1.5 backdrop-blur">
              <p className="text-[10px] uppercase tracking-wider text-muted">Clusters</p>
              <motion.p key={clusters.length} initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-base font-bold text-[#ccd0cf]">
                {clusters.length}
              </motion.p>
            </div>
            <div className="rounded-lg border border-mid/40 bg-deep/50 px-3 py-1.5 backdrop-blur">
              <p className="text-[10px] uppercase tracking-wider text-muted">Reports</p>
              <motion.p
                key={clusters.reduce((sum, cluster) => sum + cluster.incidentCount, 0)}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="text-base font-bold text-muted"
              >
                {clusters.reduce((sum, cluster) => sum + cluster.incidentCount, 0)}
              </motion.p>
            </div>
          </div>
        </div>

        <div className="grid min-h-full items-start gap-4 lg:grid-cols-[minmax(0,44%)_minmax(0,56%)]">
          {/* Left column */}
          <div className="flex flex-col gap-4">

            {selectedCluster ? (
              <ActiveIncidentCard cluster={selectedCluster} eventName={eventData.name} />
            ) : (
              <div className="rounded-2xl border border-mid/40 bg-deep/60 p-[18px] text-center backdrop-blur-xl">
                <p className="text-xs text-muted">Select a cluster from the list or map to inspect its risk zone.</p>
              </div>
            )}
            <IncidentList clusters={clusters} selectedIndex={selectedIndex} onSelect={handleSelect} eventData={eventData} />
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            <MapPanel
              eventData={eventData}
              clusters={clusters}
              selectedIndex={selectedIndex}
              onSelectCluster={handleSelect}
              mapCenter={mapCenter}
              userLocation={userLocation}
              locating={locating}
              locationError={locationError}
              onLocate={locateMe}
              setMapRef={setMap}
            />
          </div>
        </div>
      </div>
    </Reveal>
  )
}

export default Dashboard
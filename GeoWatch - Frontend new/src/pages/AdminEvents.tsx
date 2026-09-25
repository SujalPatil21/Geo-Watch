import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Radio } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import Reveal from '../components/Reveal'
import { getActiveEvents } from '../services/api'
import type { Event } from '../types/event'

type ActiveEvent = Event

const formatDateTime = (value: string) => {
  if (!value) {
    return 'N/A'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString()
}

function AdminEvents() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<ActiveEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await getActiveEvents()
        setEvents(Array.isArray(data) ? (data as ActiveEvent[]) : [])
      } catch {
        setError('Unable to load events.')
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    void loadEvents()
  }, [])

  const handleConnect = (event: ActiveEvent) => {
    const eventId = event.eventId

    if (eventId === undefined || eventId === null) {
      console.error('Missing event identifier in event payload', event)
      return
    }

    navigate(`/admin/dashboard/${eventId}`)
  }

  return (
    <div className="space-y-8">
      <Reveal>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-[#ccd0cf]">Select Event</h1>
          <p className="text-sm text-muted">Choose an active event to open its live monitoring dashboard.</p>
        </div>
      </Reveal>

      <div className="space-y-4">
        {loading && (
          <GlassCard className="animate-pulse p-8">
            <p className="text-muted">Loading events...</p>
          </GlassCard>
        )}

        {!loading && error && (
          <GlassCard className="border-rose-400/30 p-6">
            <p className="text-sm text-rose-300">{error}</p>
          </GlassCard>
        )}

        {!loading && !error && events.length === 0 && (
          <GlassCard className="p-6">
            <p className="text-sm text-rose-300">No active events found.</p>
          </GlassCard>
        )}

        {!loading &&
          !error &&
          events.map((event, index) => (
            <Reveal key={`${event.eventId ?? index}`} delay={index * 0.08}>
              <GlassCard hover className="group flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-deep text-muted ring-1 ring-mid/60">
                  <MapPin className="h-5 w-5" />
                </span>

                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-semibold text-[#ccd0cf]">{event.name || 'Untitled Event'}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                    <span>Radius: {event.radius}m</span>
                    <span>Starts: {formatDateTime(event.startTime)}</span>
                    <span>Ends: {formatDateTime(event.endTime)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleConnect(event)}
                  className="btn-primary inline-flex items-center gap-2 px-5 py-2.5"
                >
                  <Radio className="h-4 w-4" />
                  Connect
                </button>
              </GlassCard>
            </Reveal>
          ))}
      </div>
    </div>
  )
}

export default AdminEvents

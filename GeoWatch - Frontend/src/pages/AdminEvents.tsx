import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getActiveEvents } from '../services/api'
import type { Event } from '../types/event'

type ActiveEvent = Event & {
  eventId?: string | number
}

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
      const adminId = Number(localStorage.getItem('adminId'))
      if (!Number.isFinite(adminId) || adminId <= 0) {
        setError('Admin session missing. Please log in again.')
        setEvents([])
        setLoading(false)
        return
      }

      try {
        const data = await getActiveEvents(adminId)
        console.log('ACTIVE EVENTS RESPONSE:', data)
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
    console.log('Event object:', event)
    const eventId = event.id ?? event.eventId

    if (eventId === undefined || eventId === null || eventId === '') {
      console.error('Missing event identifier in event payload', event)
      return
    }

    navigate(`/admin/dashboard/${eventId}`)
  }

  return (
    <section className="mx-auto w-full max-w-2xl rounded-xl bg-slate-800 p-8 shadow-sm">
      <h1 className="text-3xl font-bold">GeoWatch</h1>
      <p className="mt-2 text-slate-300">Select Event</p>

      <div className="mt-6 space-y-4">
        {loading && <p className="text-slate-300">Loading events...</p>}
        {!loading && error && <p className="text-sm text-rose-300">{error}</p>}
        {!loading && !error && events.length === 0 && (
          <p className="text-sm text-rose-300">No active events found.</p>
        )}

        {!loading &&
          !error &&
          events.map((event, index) => (
            <article
              key={`${event.id ?? event.eventId ?? index}`}
              className="rounded-lg border border-slate-600 bg-slate-900/60 p-4"
            >
              <h2 className="text-lg font-semibold text-slate-100">{event.name || 'Untitled Event'}</h2>
              <p className="mt-2 text-sm text-slate-300">Radius: {event.radius}m</p>
              <p className="mt-1 text-sm text-slate-300">Starts: {formatDateTime(event.startTime)}</p>
              <p className="mt-1 text-sm text-slate-300">Ends: {formatDateTime(event.endTime)}</p>

              <button
                type="button"
                onClick={() => handleConnect(event)}
                className="mt-4 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300"
              >
                Connect
              </button>
            </article>
          ))}
      </div>
    </section>
  )
}

export default AdminEvents

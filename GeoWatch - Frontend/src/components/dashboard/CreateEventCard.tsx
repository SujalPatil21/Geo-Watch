import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Plus } from 'lucide-react'
import { createEvent } from '../../services/api'

function CreateEventCard() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [radius, setRadius] = useState(500)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Event name is required.')
      return
    }
    if (!Number.isFinite(radius) || radius <= 0) {
      setError('Radius must be numeric.')
      return
    }
    try {
      setLoading(true)
      const data = await createEvent({
        name: name.trim(),
        centerLat: 12.9716,
        centerLng: 77.5946,
        radius,
        startTime: '',
        endTime: '',
        organizers: [],
      })

      const eventId = data?.eventId ?? data?.id
      if (!eventId) {
        setError('Event created but no eventId was returned by the backend.')
        return
      }

      navigate(`/admin/dashboard/${eventId}`)
    } catch {
      setError('Event creation failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-mid/40 bg-deep/60 p-[18px] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-mid/25 via-transparent to-transparent" />

      <div className="relative">
        <h2 className="text-base font-semibold text-[#ccd0cf]">Create Event</h2>
        <p className="mt-0.5 text-xs text-muted">Spin up a geofenced event in seconds.</p>

        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Event name"
            className="h-[38px] w-full rounded-lg border border-mid/50 bg-deep/50 px-3 text-sm text-[#ccd0cf] outline-none backdrop-blur transition placeholder:text-muted focus:border-light/70"
          />

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="number"
                min={1}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                placeholder="Geofence radius (m)"
                className="h-[38px] w-full rounded-lg border border-mid/50 bg-deep/50 px-3 text-sm text-[#ccd0cf] outline-none backdrop-blur transition placeholder:text-muted focus:border-light/70"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              title="Create event"
              className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-deep text-[#ccd0cf] shadow-lg shadow-black/40 ring-1 ring-mid transition hover:ring-light/60 disabled:opacity-60"
            >
              {loading ? <Plus className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
            </button>
          </div>

          {error && <p className="text-xs text-rose-300">{error}</p>}
        </form>
      </div>
    </section>
  )
}

export default CreateEventCard

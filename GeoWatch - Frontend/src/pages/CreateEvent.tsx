import { useState } from 'react'
import type { FormEvent } from 'react'
import type { LatLngExpression } from 'leaflet'
import L from 'leaflet'
import { Circle, MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import { Search, Locate } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import Reveal from '../components/Reveal'
import { createEvent } from '../services/api'
import { cyanPinIcon } from '../components/mapIcons'

type OrganizerForm = {
  name: string
  phoneNumber: string
}

type EventForm = {
  name: string
  startTime: string
  endTime: string
  organizers: OrganizerForm[]
}

const indiaCenter: LatLngExpression = [20.5937, 78.9629]

const darkTiles = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const darkAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

type LocationPickerProps = {
  onPick: (lat: number, lng: number) => void
}

function LocationPicker({ onPick }: LocationPickerProps) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng)
    },
  })

  return null
}

function CreateEvent() {
  const navigate = useNavigate()
  const [form, setForm] = useState<EventForm>({
    name: '',
    startTime: '',
    endTime: '',
    organizers: [
      { name: '', phoneNumber: '' },
      { name: '', phoneNumber: '' },
      { name: '', phoneNumber: '' },
    ],
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [centerLat, setCenterLat] = useState<number | null>(null)
  const [centerLng, setCenterLng] = useState<number | null>(null)
  const [radius, setRadius] = useState(500)

  const [map, setMap] = useState<L.Map | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchError, setSearchError] = useState('')
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)

  const selectLocation = (lat: number, lng: number, flyTo: boolean = false) => {
    setCenterLat(lat)
    setCenterLng(lng)
    if (flyTo && map) {
      map.flyTo([lat, lng], 14)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    setSearchError('')
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lng = parseFloat(data[0].lon)
        selectLocation(lat, lng, true)
      } else {
        setSearchError('Location not found.')
      }
    } catch {
      setSearchError('Network error while searching.')
    } finally {
      setSearching(false)
    }
  }

  const locateMe = () => {
    setLocating(true)
    setSearchError('')
    if (!navigator.geolocation) {
      setSearchError('Geolocation is not supported by your browser.')
      setLocating(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        selectLocation(position.coords.latitude, position.coords.longitude, true)
        setLocating(false)
      },
      () => {
        setSearchError('Unable to retrieve your location.')
        setLocating(false)
      },
      { timeout: 10000 }
    )
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!form.name.trim()) {
      setError('Event name is required.')
      return
    }
    if (centerLat === null || centerLng === null) {
      setError('Please select an event location on the map.')
      return
    }
    if (!Number.isFinite(radius) || radius <= 0) {
      setError('Radius must be numeric.')
      return
    }
    const organizers = form.organizers
      .filter((organizer) => organizer.name.trim() && organizer.phoneNumber.trim())
      .map((organizer) => ({
        name: organizer.name.trim(),
        phoneNumber: organizer.phoneNumber.trim(),
      }))
    const payload = {
      name: form.name.trim(),
      centerLat,
      centerLng,
      radius,
      startTime: form.startTime,
      endTime: form.endTime,
      organizers,
    }

    try {
      setLoading(true)
      const data = await createEvent(payload)

      const eventId = data?.eventId ?? data?.id
      if (!eventId) {
        setError('Event created but no eventId was returned by the backend.')
        return
      }

      navigate(`/admin/dashboard/${eventId}`)
    } catch (requestError: any) {
      const msg = requestError.response?.data?.message || requestError.response?.data?.error
      setError(msg || 'Event creation failed. Please verify values and try again.')
    } finally {
      setLoading(false)
    }
  }

  const fieldClass = 'glass-input'

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <Reveal>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-[#ccd0cf]">Create Event</h1>
          <p className="text-sm text-muted">Configure the event boundary and organizers before going live.</p>
        </div>
      </Reveal>

      <GlassCard className="p-8">
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-muted" htmlFor="eventName">
                Event Name
              </label>
              <input id="eventName" type="text" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className={fieldClass} />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-muted">Event Location</label>

              <div className="mb-3 flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleSearch()
                      }
                    }}
                    className="glass-input pl-10"
                  />
                  <Search className="absolute left-3 top-3 h-5 w-5 text-muted" />
                </div>
                <button type="button" onClick={handleSearch} disabled={searching} className="btn-ghost px-4 py-2">
                  {searching ? '...' : 'Search'}
                </button>
              </div>
              {searchError && <p className="mb-2 text-sm text-rose-300">{searchError}</p>}

              <div className="relative overflow-hidden rounded-xl border border-mid/40">
                <button
                  type="button"
                  onClick={locateMe}
                  disabled={locating}
                  title="Locate Me"
                  className="absolute left-[10px] top-[80px] z-[400] flex h-8 w-8 items-center justify-center rounded-lg border border-mid/40 bg-surface/80 text-[#ccd0cf] shadow-sm transition hover:bg-deep disabled:opacity-50 backdrop-blur"
                >
                  <Locate className="h-4 w-4" />
                </button>
                <MapContainer center={indiaCenter} zoom={5} className="h-96 w-full" ref={setMap}>
                  <TileLayer attribution={darkAttr} url={darkTiles} />
                  <LocationPicker onPick={(lat, lng) => selectLocation(lat, lng, false)} />
                  {centerLat !== null && centerLng !== null && (
                    <>
                      <Marker position={[centerLat, centerLng]} icon={cyanPinIcon} />
                      <Circle center={[centerLat, centerLng]} radius={radius} pathOptions={{ color: '#22d3ee', fillColor: '#22d3ee', fillOpacity: 0.08 }} />
                    </>
                  )}
                </MapContainer>
              </div>
              <p className="mt-2 text-xs text-muted/70">
                {centerLat !== null && centerLng !== null
                  ? `Selected: ${centerLat.toFixed(6)}, ${centerLng.toFixed(6)}`
                  : 'No location selected yet.'}
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-muted" htmlFor="radius">
                Geofence Radius (meters)
              </label>
              <div className="grid gap-3 md:grid-cols-[1fr_150px]">
                <input id="radius-slider" type="range" min={100} max={5000} step={50} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-full accent-[#9ba8ab]" />
                <input id="radius" type="number" min={1} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className={fieldClass} />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-muted" htmlFor="startTime">
                Start Time
              </label>
              <input id="startTime" type="datetime-local" value={form.startTime} onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))} className={fieldClass} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-muted" htmlFor="endTime">
                End Time
              </label>
              <input id="endTime" type="datetime-local" value={form.endTime} onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))} className={fieldClass} />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#ccd0cf]">Organizers (Maximum 3)</h2>

            {form.organizers.map((organizer, index) => (
              <div key={`organizer-${index + 1}`} className="grid gap-4 rounded-xl border border-mid/40 bg-deep/50 p-4 backdrop-blur md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-muted" htmlFor={`organizer-name-${index + 1}`}>
                    Organizer {index + 1} Name
                  </label>
                  <input
                    id={`organizer-name-${index + 1}`}
                    type="text"
                    value={organizer.name}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        organizers: prev.organizers.map((item, itemIndex) => (itemIndex === index ? { ...item, name: e.target.value } : item)),
                      }))
                    }
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-muted" htmlFor={`organizer-phone-${index + 1}`}>
                    Organizer {index + 1} Phone
                  </label>
                  <input
                    id={`organizer-phone-${index + 1}`}
                    type="text"
                    value={organizer.phoneNumber}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        organizers: prev.organizers.map((item, itemIndex) => (itemIndex === index ? { ...item, phoneNumber: e.target.value } : item)),
                      }))
                    }
                    className={fieldClass}
                  />
                </div>
              </div>
            ))}
          </div>

          {error && (
            <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-300">{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating Event...' : 'Create Event'}
          </button>
        </form>
      </GlassCard>
    </div>
  )
}

export default CreateEvent

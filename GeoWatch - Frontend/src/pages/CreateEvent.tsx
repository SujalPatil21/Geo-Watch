import { useState } from 'react'
import type { FormEvent } from 'react'
import type { LatLngExpression } from 'leaflet'
import L from 'leaflet'
import { Circle, MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import { createEvent } from '../services/api'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

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

const defaultMarkerIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

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
    const adminId = Number(localStorage.getItem('adminId'))
    if (!Number.isFinite(adminId) || adminId <= 0) {
      setError('Admin session missing. Please log in again.')
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
      startTime: form.startTime ? new Date(form.startTime).toISOString() : '',
      endTime: form.endTime ? new Date(form.endTime).toISOString() : '',
      adminId,
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
    } catch {
      setError('Event creation failed. Please verify values and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-4xl rounded-xl bg-slate-800 p-8 shadow-sm">
      <h1 className="text-3xl font-bold">GeoWatch</h1>
      <p className="mt-2 text-slate-300">Create Event</p>

      <form className="mt-6 space-y-5" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-200" htmlFor="eventName">
              Event Name
            </label>
            <input
              id="eventName"
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-400"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-200">
              Event Location (Click on map)
            </label>
            <div className="overflow-hidden rounded-lg border border-slate-600">
              <MapContainer center={indiaCenter} zoom={5} className="h-96 w-full">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationPicker
                  onPick={(lat, lng) => {
                    setCenterLat(lat)
                    setCenterLng(lng)
                  }}
                />
                {centerLat !== null && centerLng !== null && (
                  <>
                    <Marker position={[centerLat, centerLng]} icon={defaultMarkerIcon} />
                    <Circle center={[centerLat, centerLng]} radius={radius} pathOptions={{ color: '#22d3ee' }} />
                  </>
                )}
              </MapContainer>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {centerLat !== null && centerLng !== null
                ? `Selected: ${centerLat.toFixed(6)}, ${centerLng.toFixed(6)}`
                : 'No location selected yet.'}
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-200" htmlFor="radius">
              Geofence Radius (meters)
            </label>
            <div className="grid gap-3 md:grid-cols-[1fr_150px]">
              <input
                id="radius-slider"
                type="range"
                min={100}
                max={5000}
                step={50}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
              <input
                id="radius"
                type="number"
                min={1}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-400"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200" htmlFor="startTime">
              Start Time
            </label>
            <input
              id="startTime"
              type="datetime-local"
              value={form.startTime}
              onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200" htmlFor="endTime">
              End Time
            </label>
            <input
              id="endTime"
              type="datetime-local"
              value={form.endTime}
              onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-400"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">Organizers (Maximum 3)</h2>

          {form.organizers.map((organizer, index) => (
            <div key={`organizer-${index + 1}`} className="grid gap-4 rounded-lg bg-slate-900/60 p-4 md:grid-cols-2">
              <div>
                <label
                  className="mb-1 block text-sm font-medium text-slate-200"
                  htmlFor={`organizer-name-${index + 1}`}
                >
                  Organizer {index + 1} Name
                </label>
                <input
                  id={`organizer-name-${index + 1}`}
                  type="text"
                  value={organizer.name}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      organizers: prev.organizers.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, name: e.target.value } : item,
                      ),
                    }))
                  }
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-400"
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-sm font-medium text-slate-200"
                  htmlFor={`organizer-phone-${index + 1}`}
                >
                  Organizer {index + 1} Phone
                </label>
                <input
                  id={`organizer-phone-${index + 1}`}
                  type="text"
                  value={organizer.phoneNumber}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      organizers: prev.organizers.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, phoneNumber: e.target.value } : item,
                      ),
                    }))
                  }
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-400"
                />
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-rose-300">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Creating Event...' : 'Create Event'}
        </button>
      </form>
    </section>
  )
}

export default CreateEvent

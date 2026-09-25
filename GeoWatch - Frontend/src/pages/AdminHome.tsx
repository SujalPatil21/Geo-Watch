import { useEffect, useState, useMemo } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { LatLngExpression } from 'leaflet'
import L from 'leaflet'
import { Circle, CircleMarker, MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet'
import { Activity, CalendarDays, Radio, ListPlus, PencilLine, Search, Locate, MapPin, Clock, ShieldAlert } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import Counter from '../components/Counter'
import Reveal from '../components/Reveal'
import { getActiveEvents, createEvent } from '../services/api'
import type { Event } from '../types/event'
import { cyanPinIcon } from '../components/mapIcons'

const darkTiles = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const darkAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
const indiaCenter: LatLngExpression = [20.5937, 78.9629]

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

function LocationPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

const formatDateTime = (value: string) => {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function AdminHome() {
  const navigate = useNavigate()
  
  // Tab selector state
  const [activeTab, setActiveTab] = useState<'existing' | 'create'>('create')

  // Events list states
  const [events, setEvents] = useState<Event[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [loadError, setLoadError] = useState('')

  // Event Creation states
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
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [centerLat, setCenterLat] = useState<number | null>(null)
  const [centerLng, setCenterLng] = useState<number | null>(null)
  const [radius, setRadius] = useState(500)

  // Map states for event creation picker and preview
  const [previewMap, setPreviewMap] = useState<L.Map | null>(null)
  const [pickerMap, setPickerMap] = useState<L.Map | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchError, setSearchError] = useState('')
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null)

  const loadEventsList = async () => {
    try {
      setLoadingEvents(true)
      const data = await getActiveEvents()
      setEvents(Array.isArray(data) ? data : [])
      setLoadError('')
    } catch {
      setLoadError('Unable to load active events.')
      setEvents([])
    } finally {
      setLoadingEvents(false)
    }
  }

  useEffect(() => {
    void loadEventsList()
  }, [])

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
        setCenterLat(lat)
        setCenterLng(lng)
        if (pickerMap) {
          pickerMap.flyTo([lat, lng], 14)
        }
      } else {
        setSearchError('Location not found.')
      }
    } catch {
      setSearchError('Network error while searching.')
    } finally {
      setSearching(false)
    }
  }

  const locateMePicker = () => {
    setLocating(true)
    setSearchError('')
    if (!navigator.geolocation) {
      setSearchError('Geolocation is not supported by your browser.')
      setLocating(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        setCenterLat(lat)
        setCenterLng(lng)
        setUserCoords({ lat, lng, accuracy: position.coords.accuracy || 15 })
        if (pickerMap) {
          pickerMap.flyTo([lat, lng], 14)
        }
        setLocating(false)
      },
      () => {
        setSearchError('Unable to retrieve your location.')
        setLocating(false)
      },
      { timeout: 10000 }
    )
  }

  const locateMePreview = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        setUserCoords({ lat, lng, accuracy: position.coords.accuracy || 15 })
        if (previewMap) {
          previewMap.flyTo([lat, lng], 12)
        }
      },
      () => {}
    )
  }

  const onCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCreateError('')

    if (!form.name.trim()) {
      setCreateError('Event name is required.')
      return
    }
    if (centerLat === null || centerLng === null) {
      setCreateError('Please select an event location on the map.')
      return
    }
    if (!Number.isFinite(radius) || radius <= 0) {
      setCreateError('Radius must be numeric.')
      return
    }

    const organizers = form.organizers
      .filter((org) => org.name.trim() && org.phoneNumber.trim())
      .map((org) => ({
        name: org.name.trim(),
        phoneNumber: org.phoneNumber.trim(),
      }))

    const payload = {
      name: form.name.trim(),
      centerLat,
      centerLng,
      radius,
      startTime: form.startTime ? new Date(form.startTime).toISOString() : '',
      endTime: form.endTime ? new Date(form.endTime).toISOString() : '',
      organizers,
    }

    try {
      setCreating(true)
      const data = await createEvent(payload)
      const eventId = data?.eventId
      
      // Reset form states
      setForm({
        name: '',
        startTime: '',
        endTime: '',
        organizers: [
          { name: '', phoneNumber: '' },
          { name: '', phoneNumber: '' },
          { name: '', phoneNumber: '' },
        ],
      })
      setCenterLat(null)
      setCenterLng(null)
      setRadius(500)
      
      // Reload events list and toggle to list view
      await loadEventsList()
      setActiveTab('existing')
      
      if (eventId) {
        navigate(`/admin/dashboard/${eventId}`)
      }
    } catch {
      setCreateError('Event creation failed. Please verify fields and try again.')
    } finally {
      setCreating(false)
    }
  }

  const stats = useMemo(() => [
    {
      label: 'Active Events',
      value: events.length,
      suffix: '',
      icon: CalendarDays,
      note: loadingEvents ? 'loading...' : 'currently monitored',
    },
    { label: 'Realtime Feed', value: 100, suffix: '%', icon: Radio, note: 'WebSocket delivery' },
    { label: 'Platform Status', value: 100, suffix: '%', icon: Activity, note: 'operational uptime' },
  ], [events.length, loadingEvents])

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-[#ccd0cf]">Admin Dashboard</h1>
          <p className="text-sm text-muted">Monitor crowd safety and coordinate event security in real time.</p>
        </div>
      </Reveal>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Reveal key={stat.label} delay={index * 0.08}>
              <GlassCard className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">{stat.label}</p>
                    <p className="mt-1 text-3xl font-bold text-[#ccd0cf]">
                      <Counter value={stat.value} />
                      <span className="text-muted text-lg">{stat.suffix}</span>
                    </p>
                    <p className="mt-1 text-[10px] text-muted/70">{stat.note}</p>
                  </div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-deep text-cyan-400 ring-1 ring-mid/60">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
              </GlassCard>
            </Reveal>
          )
        })}
      </div>

      {/* Tab Buttons Selection */}
      <Reveal delay={0.15}>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`group flex items-center justify-center gap-3 rounded-2xl border p-5 transition ${
              activeTab === 'create'
                ? 'border-cyan-400/50 bg-cyan-500/10 text-cyan-300 shadow-xl'
                : 'border-white/10 bg-white/[0.02] text-muted hover:bg-white/[0.04] hover:text-[#ccd0cf]'
            }`}
          >
            <ListPlus className="h-5 w-5 text-cyan-400" />
            <div className="text-left">
              <h2 className="text-sm font-bold">Create New Event</h2>
              <p className="text-[10px] opacity-75">Define boundary coordinates & geofences</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('existing')}
            className={`group flex items-center justify-center gap-3 rounded-2xl border p-5 transition ${
              activeTab === 'existing'
                ? 'border-cyan-400/50 bg-cyan-500/10 text-cyan-300 shadow-xl'
                : 'border-white/10 bg-white/[0.02] text-muted hover:bg-white/[0.04] hover:text-[#ccd0cf]'
            }`}
          >
            <PencilLine className="h-5 w-5 text-cyan-400" />
            <div className="text-left">
              <h2 className="text-sm font-bold">View Existing Events</h2>
              <p className="text-[10px] opacity-75">Connect to live safety mapping dashboards</p>
            </div>
          </button>
        </div>
      </Reveal>

      {/* Content Render based on activeTab */}
      <AnimatePresence mode="wait">
        {activeTab === 'existing' ? (
          <motion.div
            key="existing-events-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Events List Cards */}
            <div className="grid gap-4">
              {loadingEvents && (
                <GlassCard className="animate-pulse p-6 text-center">
                  <p className="text-sm text-muted">Loading your created events...</p>
                </GlassCard>
              )}

              {!loadingEvents && loadError && (
                <GlassCard className="border-rose-400/30 p-6 text-center">
                  <p className="text-sm text-rose-300">{loadError}</p>
                </GlassCard>
              )}

              {!loadingEvents && !loadError && events.length === 0 && (
                <GlassCard className="p-6 text-center">
                  <ShieldAlert className="mx-auto h-8 w-8 text-muted mb-2" />
                  <p className="text-sm text-[#ccd0cf] font-semibold">No Active Events Found</p>
                  <p className="text-xs text-muted mt-1">Select the 'Create New Event' tab above to define a new geofence zone.</p>
                </GlassCard>
              )}

              {!loadingEvents &&
                !loadError &&
                events.map((event, idx) => (
                  <GlassCard key={event.eventId ?? idx} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-deep text-cyan-400 ring-1 ring-mid/60">
                      <MapPin className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-base font-bold text-[#ccd0cf]">{event.name}</h2>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                        <span>Radius: {event.radius}m</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Starts: {formatDateTime(event.startTime)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/dashboard/${event.eventId}`)}
                      className="btn-primary px-4 py-2 text-xs font-semibold"
                    >
                      Connect Dashboard
                    </button>
                  </GlassCard>
                ))}
            </div>

            {/* General Geofence Preview Map */}
            {events.length > 0 && (
              <Reveal delay={0.1}>
                <GlassCard className="overflow-hidden p-0">
                  <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5 bg-white/[0.01]">
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400">All Event Boundaries</h2>
                      <p className="text-[10px] text-muted">Visualization of active geofence coverage areas.</p>
                    </div>
                  </div>
                  <div className="relative h-[450px]">
                    <div className="absolute right-3 top-3 z-[400]">
                      <button
                        type="button"
                        onClick={locateMePreview}
                        title="Locate Me"
                        className="flex h-8 items-center gap-1.5 rounded-lg border border-mid/40 bg-surface/85 px-2.5 text-xs font-semibold text-[#ccd0cf] shadow-md transition hover:bg-deep"
                      >
                        <Locate className="h-3.5 w-3.5" />
                        <span>Locate</span>
                      </button>
                    </div>
                    <MapContainer
                      key={events[0]?.eventId ?? 'india'}
                      center={[events[0]?.centerLat ?? 20.5937, events[0]?.centerLng ?? 78.9629]}
                      zoom={12}
                      className="h-full w-full"
                      scrollWheelZoom
                      attributionControl={false}
                      ref={setPreviewMap}
                    >
                      <TileLayer url={darkTiles} attribution={darkAttr} />
                      {events.map((event, idx) => (
                        <Circle
                          key={event.eventId ?? idx}
                          center={[event.centerLat, event.centerLng]}
                          radius={event.radius}
                          pathOptions={{ color: '#22d3ee', fillColor: '#22d3ee', fillOpacity: 0.08, weight: 1.5 }}
                        />
                      ))}
                      {userCoords && (
                        <>
                          <Circle
                            center={[userCoords.lat, userCoords.lng]}
                            radius={userCoords.accuracy}
                            pathOptions={{ color: '#22d3ee', fillColor: '#22d3ee', fillOpacity: 0.14, stroke: false }}
                          />
                          <CircleMarker
                            center={[userCoords.lat, userCoords.lng]}
                            radius={8}
                            pathOptions={{ color: '#ffffff', weight: 2.5, fillColor: '#06b6d4', fillOpacity: 1 }}
                          >
                            <Popup>
                              <div className="text-xs text-[#ccd0cf]">
                                <p className="font-semibold text-cyan-300">Your Current Location</p>
                                <p className="text-[10px] text-muted">Accuracy: ±{Math.round(userCoords.accuracy)}m</p>
                              </div>
                            </Popup>
                          </CircleMarker>
                        </>
                      )}
                    </MapContainer>
                  </div>
                </GlassCard>
              </Reveal>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="create-event-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            <GlassCard className="p-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-5 flex items-center gap-2">
                <ListPlus className="h-4 w-4" />
                Configure New Geofence Event
              </h2>

              <form className="space-y-5" onSubmit={onCreateSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted" htmlFor="eventName">
                      Event Name
                    </label>
                    <input
                      id="eventName"
                      type="text"
                      placeholder="e.g. Campus Music Festival 2026"
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="glass-input text-xs"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted">Geofence Center Location</label>
                    <div className="mb-3 flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Search address or landmark..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              void handleSearch()
                            }
                          }}
                          className="glass-input pl-9 text-xs"
                        />
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted" />
                      </div>
                      <button
                        type="button"
                        onClick={handleSearch}
                        disabled={searching}
                        className="btn-ghost px-4 py-2 text-xs"
                      >
                        {searching ? 'Searching...' : 'Search'}
                      </button>
                    </div>
                    
                    {searchError && (
                      <p className="mb-2 text-xs text-rose-300 font-semibold">{searchError}</p>
                    )}

                    <div className="relative overflow-hidden rounded-xl border border-white/10">
                      <button
                        type="button"
                        onClick={locateMePicker}
                        disabled={locating}
                        title="Locate Me"
                        className="absolute left-3 top-[76px] z-[1000] flex h-8 w-8 items-center justify-center rounded-lg border border-mid/40 bg-surface/85 text-[#ccd0cf] shadow-md transition hover:bg-deep disabled:opacity-50"
                      >
                        <Locate className={`h-4 w-4 ${locating ? 'animate-spin' : ''}`} />
                      </button>
                      <MapContainer
                        center={indiaCenter}
                        zoom={5}
                        className="h-[450px] w-full"
                        ref={setPickerMap}
                        attributionControl={false}
                      >
                        <TileLayer attribution={darkAttr} url={darkTiles} />
                        <LocationPicker onPick={(lat, lng) => {
                          setCenterLat(lat)
                          setCenterLng(lng)
                        }} />
                        {centerLat !== null && centerLng !== null && (
                          <>
                            <Marker position={[centerLat, centerLng]} icon={cyanPinIcon} />
                            <Circle
                              center={[centerLat, centerLng]}
                              radius={radius}
                              pathOptions={{ color: '#22d3ee', fillColor: '#22d3ee', fillOpacity: 0.08 }}
                            />
                          </>
                        )}
                        {userCoords && (
                          <>
                            <Circle
                              center={[userCoords.lat, userCoords.lng]}
                              radius={userCoords.accuracy}
                              pathOptions={{ color: '#22d3ee', fillColor: '#22d3ee', fillOpacity: 0.14, stroke: false }}
                            />
                            <CircleMarker
                              center={[userCoords.lat, userCoords.lng]}
                              radius={8}
                              pathOptions={{ color: '#ffffff', weight: 2.5, fillColor: '#06b6d4', fillOpacity: 1 }}
                            >
                              <Popup>
                                <div className="text-xs text-[#ccd0cf]">
                                  <p className="font-semibold text-cyan-300">Your Current Location</p>
                                  <p className="text-[10px] text-muted">Accuracy: ±{Math.round(userCoords.accuracy)}m</p>
                                </div>
                              </Popup>
                            </CircleMarker>
                          </>
                        )}
                      </MapContainer>
                    </div>

                    <p className="mt-2 text-xs text-muted/70 font-mono">
                      {centerLat !== null && centerLng !== null
                        ? `Picked Coordinates: ${centerLat.toFixed(6)}, ${centerLng.toFixed(6)}`
                        : 'Click on the map or search above to select center location.'}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-muted" htmlFor="radius">
                        Geofence Radius (meters)
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="radius-slider"
                          type="range"
                          min={100}
                          max={5000}
                          step={50}
                          value={radius}
                          onChange={(e) => setRadius(Number(e.target.value))}
                          className="flex-1 accent-cyan-400"
                        />
                        <input
                          id="radius"
                          type="number"
                          min={1}
                          value={radius}
                          onChange={(e) => setRadius(Number(e.target.value))}
                          className="w-20 glass-input text-center text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid gap-2 grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-muted" htmlFor="startTime">
                          Start Time
                        </label>
                        <input
                          id="startTime"
                          type="datetime-local"
                          value={form.startTime}
                          onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
                          className="glass-input text-xs"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold text-muted" htmlFor="endTime">
                          End Time
                        </label>
                        <input
                          id="endTime"
                          type="datetime-local"
                          value={form.endTime}
                          onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
                          className="glass-input text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Organizers contact numbers setup */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Organizers Contact (Max 3)</h3>
                    {form.organizers.map((org, index) => (
                      <div key={index} className="grid gap-3 rounded-xl border border-white/5 bg-white/[0.01] p-3 md:grid-cols-2">
                        <div>
                          <input
                            type="text"
                            placeholder={`Organizer ${index + 1} Full Name`}
                            value={org.name}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                organizers: prev.organizers.map((item, itemIdx) =>
                                  itemIdx === index ? { ...item, name: e.target.value } : item
                                ),
                              }))
                            }
                            className="glass-input text-xs"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder={`Organizer ${index + 1} Mobile Number`}
                            value={org.phoneNumber}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                organizers: prev.organizers.map((item, itemIdx) =>
                                  itemIdx === index ? { ...item, phoneNumber: e.target.value } : item
                                ),
                              }))
                            }
                            className="glass-input text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {createError && (
                  <p className="rounded-lg border border-rose-400/30 bg-rose-500/20 px-3 py-2 text-xs text-rose-300 font-semibold">
                    {createError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary w-full py-3.5 text-xs font-bold"
                >
                  {creating ? 'Creating Event...' : 'Create & Launch Event'}
                </button>
              </form>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AdminHome

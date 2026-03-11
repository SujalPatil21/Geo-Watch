import axios from 'axios'
import type { Cluster } from '../types/cluster'
import type { Event } from '../types/event'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface RegisterAdminPayload {
  name: string
  email: string
  password: string
}

export interface LoginAdminPayload {
  email: string
  password: string
}

export interface OrganizerPayload {
  name: string
  phoneNumber: string
}

export interface CreateEventPayload {
  name: string
  centerLat: number
  centerLng: number
  radius: number
  startTime: string
  endTime: string
  adminId: number
  organizers: OrganizerPayload[]
}

export const registerAdmin = async (payload: RegisterAdminPayload) => {
  const response = await api.post('/admin/register', payload)
  return response.data
}

export const loginAdmin = async (payload: LoginAdminPayload) => {
  const response = await api.post('/admin/login', payload)
  return response.data
}

export const createEvent = async (payload: CreateEventPayload) => {
  const response = await api.post('/events', payload)
  return response.data
}

export const getEventById = async (eventId: string) => {
  const response = await api.get<Event>(`/events/${eventId}`)
  return response.data
}

export const getClustersByEventId = async (eventId: string) => {
  const response = await api.get<Cluster[]>(`/admin/clusters/${eventId}`)
  return response.data
}

export const getActiveEvents = async (adminId: number) => {
  const response = await api.get<Event[]>('/events/admin/active', {
    params: { adminId },
  })
  return response.data
}

export default api

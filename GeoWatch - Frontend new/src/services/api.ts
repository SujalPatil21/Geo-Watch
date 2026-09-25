import axios from 'axios'
import type { Cluster } from '../types/cluster'
import type { Event } from '../types/event'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export const getAdminId = () => localStorage.getItem('adminId') ?? sessionStorage.getItem('adminId')

export const clearAdminSession = () => {
  localStorage.removeItem('adminId')
  sessionStorage.removeItem('adminId')
}

export const saveAdminSession = (adminId: string | number, remember: boolean) => {
  const storage = remember ? localStorage : sessionStorage
  storage.setItem('adminId', String(adminId))
}

api.interceptors.request.use((config) => {
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) clearAdminSession()
    return Promise.reject(error)
  },
)

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
  organizers: OrganizerPayload[]
  adminId?: string | number
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
  const adminId = Number(getAdminId())
  const response = await api.post('/events', { ...payload, adminId })
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

export const getActiveEvents = async () => {
  const adminId = getAdminId()
  const response = await api.get<Event[]>(`/events/admin/active?adminId=${adminId}`)
  return response.data
}



export default api

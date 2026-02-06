import api from "../axios"

export interface EventIn {
  title: string
  description?: string
  start_time: string
  end_time: string
  location?: string
  is_virtual?: boolean
  tags?: string[]
  category?: string
  min_cycle?: number
  max_cycle?: number
}

export async function getEvents(params?: { tags?: string[]; fecha_from?: string; fecha_to?: string }) {
  const { data } = await api.get("/events", { params })
  return data
}

export async function createEvent(payload: EventIn) {
  const { data } = await api.post("/events", payload)
  return data
}

export async function getRecommendedEvents(params?: { tags?: string[]; fecha_from?: string; fecha_to?: string; page?: number; size?: number }) {
  const { data } = await api.get("/events/recommended-events", { params })
  return data
}

export async function saveEvent(eventId: number) {
  const { data } = await api.post(`/events/${eventId}/save`)
  return data
}

export async function unsaveEvent(eventId: number) {
  const { data } = await api.delete(`/events/${eventId}/save`)
  return data
}

export async function attendEvent(eventId: number, status: "going" | "interested" = "going") {
  const { data } = await api.post(`/events/${eventId}/attend`, null, { params: { status } })
  return data
}

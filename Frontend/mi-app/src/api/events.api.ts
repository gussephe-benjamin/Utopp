import api from "./axios"

/**
 * Eventos de la tabla compartida con Utopp Formulario.
 * A diferencia del dashboard de Formulario, que muestra solo los eventos del
 * organizador, aquí el listado trae los de todos los creadores, pero limitado a
 * los que el organizador marcó como visibles en Plataforma.
 */

export interface SharedEventCreator {
  id: string
  email: string
  full_name?: string | null
  avatar_url?: string | null
  /** id del usuario en Utopp Plataforma, si el organizador también tiene cuenta */
  utopp_user_id?: number | null
}

export interface SharedEvent {
  id: string
  creator_id: string
  title: string
  description?: string | null
  short_description?: string | null
  category?: string | null
  theme?: string | null
  highlights?: string[] | null
  date_time: string
  location: string
  capacity?: number | null
  banner_url?: string | null
  allow_only_utec_emails: boolean
  /** Siempre true en las respuestas de este endpoint: solo se listan los visibles */
  visible_on_plataforma: boolean
  utopp_post_id?: number | null
  creator_utopp_user_id?: number | null
  created_at: string
  registered_count: number
  creator?: SharedEventCreator | null
  /** Formulario público de inscripción, servido por Utopp Formulario */
  registration_url?: string | null
}

export interface SharedEventsPage {
  items: SharedEvent[]
  page: number
  size: number
  total: number
  pages: number
  has_next: boolean
  has_prev: boolean
}

export interface ListEventsParams {
  page?: number
  size?: number
  upcoming_only?: boolean
  search?: string
  category?: string
}

export async function listEvents(params: ListEventsParams = {}): Promise<SharedEventsPage> {
  const { data } = await api.get<SharedEventsPage>("/events", { params })
  return data
}

export async function getEvent(eventId: string): Promise<SharedEvent> {
  const { data } = await api.get<SharedEvent>(`/events/${eventId}`)
  return data
}

export interface CreateEventPayload {
  title: string
  description?: string | null
  short_description?: string | null
  category?: string | null
  theme?: string | null
  highlights?: string[] | null
  /** ISO 8601 */
  date_time: string
  location: string
  capacity?: number | null
  banner_url?: string | null
  allow_only_utec_emails?: boolean
}

export async function createEvent(payload: CreateEventPayload): Promise<SharedEvent> {
  const { data } = await api.post<SharedEvent>("/events", payload)
  return data
}

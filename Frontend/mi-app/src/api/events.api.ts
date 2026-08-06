import api from "./axios"

/**
 * Eventos de la tabla compartida con Utopp Formulario.
 * El listado trae los de todos los creadores (Plataforma y Formulario).
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
  /** Informativo: por ahora siempre true (eventos siempre compartidos) */
  visible_on_plataforma: boolean
  /** Estilo del boleto del asistente: clasico | stub | pase */
  ticket_style: string
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
  /** clasico | stub | pase (por defecto clasico) */
  ticket_style?: string
}

export async function createEvent(payload: CreateEventPayload): Promise<SharedEvent> {
  const { data } = await api.post<SharedEvent>("/events", payload)
  return data
}

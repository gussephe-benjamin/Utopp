/**
 * API de Usuarios
 *
 * Endpoints del backend (prefix: /users):
 *   GET    /users/check-username      — Verifica si un username está disponible
 *   GET    /users/check-email         — Verifica si un email ya está registrado
 *   GET    /users/all-users          — Lista todos los usuarios (legacy)
 *   GET    /users/me                 — Perfil completo del usuario autenticado
 *   GET    /users/me/events          — Eventos Formulario donde figura el email (asistente)
 *   PATCH  /users/me                 — Actualiza perfil del usuario autenticado
 *   PUT    /users/me/interests       — Reemplaza lista de intereses
 *   GET    /users/{user_id}          — Perfil público de un usuario
 *   GET    /users/{user_id}/posts    — Posts de un usuario (paginado)
 *   POST   /users/{user_id}/follow   — Seguir a un usuario
 *   DELETE /users/{user_id}/follow   — Dejar de seguir a un usuario
 *   GET    /users/{user_id}/followers — Seguidores de un usuario (paginado)
 *   GET    /users/{user_id}/following — Seguidos de un usuario (paginado)
 */

import api from "./axios"
import type { WeeklyAvailabilityPayload } from "../features/onboarding/lib/weeklyAvailability"

export interface OrganizationSummary {
  id: number
  full_name?: string
  profile_image_url?: string
  followers_count: number
  posts_count?: number
}

/** Respuesta de GET /users/me y GET /users/{id} (campos relevantes para perfil). */
export interface UserProfileResponse {
  id: number
  email?: string
  full_name?: string | null
  career?: string | null
  cycle?: number | null
  interests?: string[] | null
  availability?: number | null
  weekly_availability?: WeeklyAvailabilityPayload | null
  description?: string | null
  contacts?: Record<string, string> | null
  followers_count?: number
  following_count?: number
  posts_count?: number
  profile_image_url?: string | null
  role_name?: string
}

/**
 * GET /users/check-username?username=...
 * Verifica si un nombre de usuario está disponible.
 * Devuelve { available: boolean }
 * Auth: No requerida.
 */
export async function checkUsername(username: string): Promise<{ available: boolean }> {
  const { data } = await api.get("/users/check-username", { params: { username } })
  return data
}

/**
 * GET /users/check-email?email=...
 * Verifica si un correo ya está registrado.
 * Devuelve { available: boolean }
 * Auth: No requerida.
 */
export async function checkEmail(email: string): Promise<{ available: boolean }> {
  const { data } = await api.get("/users/check-email", { params: { email } })
  return data
}

/**
 * GET /users/all-users
 * Lista todos los usuarios registrados en el sistema.
 * Auth: No requerida.
 */
export async function getAllUsers() {
  const { data } = await api.get("/users/all-users")
  return data
}

/**
 * GET /users/me
 * Devuelve el perfil completo del usuario autenticado.
 * Auth: Requerida.
 */
export async function getMyProfile(): Promise<UserProfileResponse> {
  const { data } = await api.get<UserProfileResponse>("/users/me")
  return data
}

/**
 * PATCH /users/me
 * Actualiza campos del perfil del usuario autenticado (partial update).
 * Solo los campos enviados se modifican.
 * Auth: Requerida.
 */
export async function updateMyProfile(payload: Record<string, unknown>): Promise<UserProfileResponse> {
  const { data } = await api.patch<UserProfileResponse>("/users/me", payload)
  return data
}

/**
 * PUT /users/me/interests
 * Reemplaza la lista completa de intereses del usuario autenticado.
 * Auth: Requerida.
 */
export async function updateInterests(interests: string[]) {
  const { data } = await api.put("/users/me/interests", { interests })
  return data
}

/**
 * GET /users/me/following-organizations
 * Lista las organizaciones seguidas por el usuario autenticado.
 * Auth: Requerida.
 */
export async function getMyFollowingOrganizations(params?: { page?: number; size?: number }): Promise<OrganizationSummary[]> {
  const { data } = await api.get("/users/me/following-organizations", { params })
  return data
}

/** Evento de Formulario en el que el usuario figura como asistente (JOIN por email). */
export interface UserParticipatedEvent {
  event_id: string
  title: string
  date_time: string
  location: string
  banner_url?: string | null
  category?: string | null
  theme?: string | null
  registered_at: string
  checked_in: boolean
  checked_in_at?: string | null
  status: "registered" | "attended"
  ticket_id?: string | null
  ticket_url?: string | null
}

function dedupeParticipatedEvents(events: UserParticipatedEvent[]): UserParticipatedEvent[] {
  const byId = new Map<string, UserParticipatedEvent>()
  const order: string[] = []
  for (const event of events) {
    const prev = byId.get(event.event_id)
    if (!prev) {
      byId.set(event.event_id, event)
      order.push(event.event_id)
      continue
    }
    if (event.status === "attended" && prev.status !== "attended") {
      byId.set(event.event_id, event)
    }
  }
  return order.map((id) => byId.get(id)!)
}

/**
 * GET /users/me/events
 * Eventos de Utopp Formulario donde el email del usuario aparece en attendees.
 * Soft-join: registro guest previo + signup Utopp posterior aparecen sin backfill.
 * Auth: Requerida.
 */
export async function getMyParticipatedEvents(params?: {
  page?: number
  size?: number
  status?: "registered" | "attended"
}): Promise<UserParticipatedEvent[]> {
  const { data } = await api.get<UserParticipatedEvent[]>("/users/me/events", { params })
  return dedupeParticipatedEvents(Array.isArray(data) ? data : [])
}

/**
 * GET /users/{userId}/following-organizations
 * Lista organizaciones seguidas por un usuario.
 * Auth: No requerida.
 */
export async function getUserFollowingOrganizations(userId: number, params?: { page?: number; size?: number }): Promise<OrganizationSummary[]> {
  const { data } = await api.get(`/users/${userId}/following-organizations`, { params })
  return data
}

/**
 * GET /users/organizations
 * Lista organizaciones registradas en el sistema.
 * Auth: No requerida.
 */
export async function getOrganizations(params?: { page?: number; size?: number }): Promise<OrganizationSummary[]> {
  const { data } = await api.get("/users/organizations", { params })
  return data
}

/**
 * GET /users/{userId}
 * Devuelve el perfil público de un usuario con conteos de
 * seguidores, seguidos y posts.
 * Auth: No requerida.
 */
export async function getUserProfile(userId: number): Promise<UserProfileResponse> {
  const { data } = await api.get<UserProfileResponse>(`/users/${userId}`)
  return data
}

/**
 * GET /users/{userId}/posts
 * Lista los posts de un usuario específico, paginados.
 * Auth: No requerida.
 */
export async function getUserPosts(userId: number, params?: { page?: number; size?: number }) {
  const { data } = await api.get(`/users/${userId}/posts`, { params })
  return data
}

/**
 * POST /users/{userId}/follow
 * El usuario autenticado sigue al usuario indicado.
 * No se puede seguir a uno mismo. Error 404 si no existe.
 * Auth: Requerida.
 */
export async function followUser(userId: number) {
  const { data } = await api.post(`/users/${userId}/follow`)
  return data
}

/**
 * DELETE /users/{userId}/follow
 * El usuario autenticado deja de seguir al usuario indicado.
 * Auth: Requerida.
 */
export async function unfollowUser(userId: number) {
  const { data } = await api.delete(`/users/${userId}/follow`)
  return data
}

/**
 * GET /users/{userId}/followers
 * Lista los seguidores de un usuario, paginados.
 * Auth: No requerida.
 */
export async function getFollowers(userId: number, params?: { page?: number; size?: number }) {
  const { data } = await api.get(`/users/${userId}/followers`, { params })
  return data
}

/**
 * GET /users/{userId}/following
 * Lista los usuarios que sigue un usuario, paginados.
 * Auth: No requerida.
 */
export async function getFollowing(userId: number, params?: { page?: number; size?: number }) {
  const { data } = await api.get(`/users/${userId}/following`, { params })
  return data
}

/**
 * DELETE /users/me/followers/{followerId}
 * Elimina un seguidor de la lista del usuario autenticado.
 * Auth: Requerida.
 */
export async function removeFollower(followerId: number) {
  const { data } = await api.delete(`/users/me/followers/${followerId}`)
  return data
}

/**
 * POST /users/me/profile-images
 * Guarda la URL de la foto de perfil en la base de datos y la marca como activa.
 * Auth: Requerida.
 */
export async function setProfileImage(cloudinaryId: string, url: string): Promise<{ id: number; url: string; is_active: boolean }> {
  const payload = { cloudinary_id: cloudinaryId, url }
  try {
    const { data } = await api.post("/users/me/profile-images", payload)
    return data
  } catch (error) {
    const maybeAxios = error as { response?: { status?: number } }
    // Compatibilidad temporal:
    // En algunos entornos el backend expone accidentalmente /users/users/me/profile-images.
    if (maybeAxios.response?.status === 404) {
      const { data } = await api.post("/users/users/me/profile-images", payload)
      return data
    }
    throw error
  }
}

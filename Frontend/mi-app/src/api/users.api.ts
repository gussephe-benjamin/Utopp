/**
 * API de Usuarios
 *
 * Endpoints del backend (prefix: /users):
 *   GET    /users/check-username      — Verifica si un username está disponible
 *   GET    /users/check-email         — Verifica si un email ya está registrado
 *   GET    /users/all-users          — Lista todos los usuarios (legacy)
 *   GET    /users/me                 — Perfil completo del usuario autenticado
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
export async function getMyProfile() {
  const { data } = await api.get("/users/me")
  return data
}

/**
 * PATCH /users/me
 * Actualiza campos del perfil del usuario autenticado (partial update).
 * Solo los campos enviados se modifican.
 * Auth: Requerida.
 */
export async function updateMyProfile(payload: Record<string, unknown>) {
  const { data } = await api.patch("/users/me", payload)
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
 * GET /users/{userId}
 * Devuelve el perfil público de un usuario con conteos de
 * seguidores, seguidos y posts.
 * Auth: No requerida.
 */
export async function getUserProfile(userId: number) {
  const { data } = await api.get(`/users/${userId}`)
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
  const { data } = await api.post('/users/me/profile-images', { cloudinary_id: cloudinaryId, url })
  return data
}

/**
 * API de Participantes
 *
 * Endpoints del backend:
 *   POST   /posts/{post_id}/participate        — Registra participación
 *   PATCH  /posts/{post_id}/participation      — Actualiza estado de participación
 *   DELETE /posts/{post_id}/participation      — Cancela participación
 *   GET    /posts/{post_id}/participants       — Lista participantes (paginado, filtrable)
 *   GET    /posts/{post_id}/participants/count — Conteo agrupado por estado
 */

import api from "./axios"

export type ParticipantStatus = "interested" | "going" | "attended"

/**
 * POST /posts/{postId}/participate
 * Registra la participación del usuario autenticado en el post.
 * Error 409 si ya participa.
 * Auth: Requerida.
 */
export async function participate(postId: number, status: ParticipantStatus) {
  const { data } = await api.post(`/posts/${postId}/participate`, { status })
  return data
}

/**
 * PATCH /posts/{postId}/participation
 * Actualiza el estado de participación del usuario autenticado
 * (ej: interested → going).
 * Error 404 si no tiene participación registrada.
 * Auth: Requerida.
 */
export async function updateParticipation(postId: number, status: ParticipantStatus) {
  const { data } = await api.patch(`/posts/${postId}/participation`, { status })
  return data
}

/**
 * DELETE /posts/{postId}/participation
 * Cancela la participación del usuario autenticado.
 * Error 404 si no tenía participación.
 * Auth: Requerida.
 */
export async function cancelParticipation(postId: number) {
  await api.delete(`/posts/${postId}/participation`)
}

/**
 * GET /posts/{postId}/participants
 * Lista participantes del post, paginados.
 * Se puede filtrar por status (interested, going, attended).
 * Auth: No requerida.
 */
export async function listParticipants(
  postId: number,
  params?: { status?: ParticipantStatus; page?: number; size?: number }
) {
  const { data } = await api.get(`/posts/${postId}/participants`, { params })
  return data
}

/**
 * GET /posts/{postId}/participants/count
 * Devuelve conteo de participantes agrupado por estado:
 * { interested, going, attended, total }.
 * Auth: No requerida.
 */
export async function getParticipantCounts(postId: number) {
  const { data } = await api.get(`/posts/${postId}/participants/count`)
  return data
}

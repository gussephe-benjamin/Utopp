/**
 * API de Reacciones (me gusta)
 *
 * Endpoints del backend:
 *   POST /posts/{post_id}/reactions        — Alterna la reacción del usuario
 *   GET  /posts/{post_id}/reactions/count  — Conteo y si el usuario reaccionó
 */

import api from "./axios"

export interface ReactionToggleResponse {
  reacted: boolean
  count: number
}

export interface ReactionCountResponse {
  count: number
  user_reacted: boolean
}

/**
 * POST /posts/{postId}/reactions
 * Alterna la reacción (me gusta) del usuario autenticado.
 * Auth: Requerida.
 */
export async function toggleReaction(postId: number): Promise<ReactionToggleResponse> {
  const { data } = await api.post<ReactionToggleResponse>(`/posts/${postId}/reactions`)
  return data
}

/**
 * GET /posts/{postId}/reactions/count
 * Devuelve el conteo de reacciones y si el usuario actual reaccionó.
 * Auth: Opcional.
 */
export async function getReactionCount(postId: number): Promise<ReactionCountResponse> {
  const { data } = await api.get<ReactionCountResponse>(`/posts/${postId}/reactions/count`)
  return data
}

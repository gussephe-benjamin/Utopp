/**
 * API de Posts Guardados
 *
 * Endpoints del backend:
 *   POST   /posts/{post_id}/save      — Guarda un post en favoritos
 *   DELETE /posts/{post_id}/save      — Quita un post de favoritos
 *   GET    /users/me/saved-posts      — Lista posts guardados del usuario autenticado
 */

import api from "./axios"

/**
 * POST /posts/{postId}/save
 * Guarda el post en favoritos del usuario autenticado.
 * Error 409 si el post ya estaba guardado.
 * Auth: Requerida.
 */
export async function savePost(postId: number) {
  const { data } = await api.post(`/posts/${postId}/save`)
  return data
}

/**
 * DELETE /posts/{postId}/save
 * Quita el post de favoritos del usuario autenticado.
 * Error 404 si el post no estaba guardado.
 * Auth: Requerida.
 */
export async function unsavePost(postId: number) {
  const { data } = await api.delete(`/posts/${postId}/save`)
  return data
}

/**
 * GET /users/me/saved-posts
 * Lista todos los posts guardados por el usuario autenticado, paginados.
 * Auth: Requerida.
 */
export async function getSavedPosts(params?: { page?: number; size?: number }) {
  const { data } = await api.get("/users/me/saved-posts", { params })
  return data
}

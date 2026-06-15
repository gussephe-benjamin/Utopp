/**
 * API de Comentarios
 *
 * Endpoints del backend:
 *   GET    /posts/{post_id}/comments               — Lista comentarios (paginado)
 *   POST   /posts/{post_id}/comments               — Crea un comentario
 *   DELETE /posts/{post_id}/comments/{comment_id}  — Elimina un comentario
 */

import api from "./axios"

export interface CommentOut {
  id: number
  post_id: number
  user_id: number
  content: string
  created_at: string
  updated_at?: string | null
  user_name?: string | null
  user_profile_image_url?: string | null
}

/**
 * GET /posts/{postId}/comments
 * Lista los comentarios de un post (más antiguos primero), paginado.
 * Auth: No requerida.
 */
export async function listComments(
  postId: number,
  params?: { page?: number; size?: number },
): Promise<CommentOut[]> {
  const { data } = await api.get<CommentOut[]>(`/posts/${postId}/comments`, { params })
  return data
}

/**
 * POST /posts/{postId}/comments
 * Crea un comentario en el post.
 * Auth: Requerida.
 */
export async function createComment(postId: number, content: string): Promise<CommentOut> {
  const { data } = await api.post<CommentOut>(`/posts/${postId}/comments`, { content })
  return data
}

/**
 * DELETE /posts/{postId}/comments/{commentId}
 * Elimina un comentario propio (o cualquiera si admin/root).
 * Auth: Requerida.
 */
export async function deleteComment(postId: number, commentId: number): Promise<void> {
  await api.delete(`/posts/${postId}/comments/${commentId}`)
}

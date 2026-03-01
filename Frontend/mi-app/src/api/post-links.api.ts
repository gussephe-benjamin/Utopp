/**
 * API de Links de Posts
 *
 * Endpoints del backend:
 *   POST   /posts/{post_id}/links              — Agrega un link a un post
 *   GET    /posts/{post_id}/links              — Lista links de un post
 *   PATCH  /posts/{post_id}/links/reorder      — Reordena links
 *   PATCH  /posts/{post_id}/links/{link_id}    — Actualiza un link
 *   DELETE /posts/{post_id}/links/{link_id}    — Elimina un link
 */

import api from "./axios"
import { type PostLinkType } from "../types/post.types"

export interface LinkCreate {
  label: string
  url: string
  type: PostLinkType
  display_type: "button" | "link"
  position: number
}

export interface LinkUpdate {
  label?: string
  url?: string
  type?: PostLinkType
  display_type?: "button" | "link"
}

export interface LinkReorderItem {
  link_id: number
  position: number
}

/**
 * POST /posts/{postId}/links
 * Agrega un link al post. Requiere label, url, type, display_type y position.
 * Auth: Requerida (dueño o admin).
 */
export async function addLink(postId: number, payload: LinkCreate) {
  const { data } = await api.post(`/posts/${postId}/links`, payload)
  return data
}

/**
 * GET /posts/{postId}/links
 * Lista todos los links del post ordenados por position ascendente.
 * Auth: No requerida.
 */
export async function listLinks(postId: number) {
  const { data } = await api.get(`/posts/${postId}/links`)
  return data
}

/**
 * PATCH /posts/{postId}/links/reorder
 * Reordena los links del post asignando nuevas posiciones.
 * Auth: Requerida (dueño o admin).
 */
export async function reorderLinks(postId: number, links: LinkReorderItem[]) {
  const { data } = await api.patch(`/posts/${postId}/links/reorder`, { links })
  return data
}

/**
 * PATCH /posts/{postId}/links/{linkId}
 * Actualiza campos de un link (partial update).
 * Auth: Requerida (dueño o admin).
 */
export async function updateLink(postId: number, linkId: number, payload: LinkUpdate) {
  const { data } = await api.patch(`/posts/${postId}/links/${linkId}`, payload)
  return data
}

/**
 * DELETE /posts/{postId}/links/{linkId}
 * Elimina un link específico del post.
 * Auth: Requerida (dueño o admin).
 */
export async function deleteLink(postId: number, linkId: number) {
  const { data } = await api.delete(`/posts/${postId}/links/${linkId}`)
  return data
}

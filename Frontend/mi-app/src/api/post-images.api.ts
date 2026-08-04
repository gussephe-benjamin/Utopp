/**
 * API de Imágenes de Posts
 *
 * Endpoints del backend:
 *   POST   /posts/{post_id}/images          — Agrega una imagen a un post
 *   GET    /posts/{post_id}/images          — Lista imágenes de un post
 *   DELETE /posts/{post_id}/images/{image_id} — Elimina una imagen
 *   PATCH  /posts/{post_id}/images/reorder  — Reordena imágenes
 */

import api from "./axios"

/** 'upload' = subida a Cloudinary (default, comportamiento histórico). 'external_url' = link pegado por el usuario. */
export type ImageSourceType = "upload" | "external_url"

export interface ImageCreate {
  /** Requerido solo si source_type === 'upload'. Para 'external_url' el backend genera uno sintético si se omite. */
  cloudinary_id?: string
  url: string
  position: number
  object_position?: string
  scale?: number
  source_type?: ImageSourceType
}

export interface PostImage {
  id: number
  cloudinary_id: string
  url: string
  position: number
  object_position?: string | null
  scale?: number | null
  source_type?: ImageSourceType
}

export interface ImageReorderItem {
  image_id: number
  position: number
}

/**
 * POST /posts/{postId}/images
 * Agrega una imagen al post. Crea un registro en post_images.
 * Auth: Requerida (dueño o admin).
 */
export async function addImage(postId: number, payload: ImageCreate) {
  const { data } = await api.post(`/posts/${postId}/images`, payload)
  return data
}

/**
 * GET /posts/{postId}/images
 * Lista todas las imágenes del post ordenadas por position ascendente.
 * Auth: No requerida.
 */
export async function listImages(postId: number) {
  const { data } = await api.get(`/posts/${postId}/images`)
  return data
}

/**
 * DELETE /posts/{postId}/images/{imageId}
 * Elimina una imagen específica del post.
 * Auth: Requerida (dueño o admin).
 */
export async function deleteImage(postId: number, imageId: number) {
  const { data } = await api.delete(`/posts/${postId}/images/${imageId}`)
  return data
}

/**
 * PATCH /posts/{postId}/images/reorder
 * Reordena las imágenes del post asignando nuevas posiciones.
 * Auth: Requerida (dueño o admin).
 */
export async function reorderImages(postId: number, images: ImageReorderItem[]) {
  const { data } = await api.patch(`/posts/${postId}/images/reorder`, { images })
  return data
}

/**
 * API de Posts
 *
 * Endpoints del backend (prefix: /posts):
 *   POST   /posts/                      — Crea un post genérico en estado draft
 *   POST   /posts/academic-projects     — Crea un proyecto académico
 *   POST   /posts/simple-posts          — Crea una publicación simple (sin título)
 *   POST   /posts/announcements         — Crea un anuncio (deadline requerido)
 *   GET    /posts/{post_id}             — Obtiene un post con relaciones
 *   PATCH  /posts/{post_id}             — Actualiza campos de un post
 *   POST   /posts/{post_id}/publish     — Publica un post (draft → published)
 *   POST   /posts/{post_id}/archive     — Archiva un post (irreversible)
 *   POST   /posts/{post_id}/check-time-status — Verifica y actualiza time_status
 *   POST   /posts/{post_id}/close       — Cierra un proyecto académico manualmente
 *   PATCH  /posts/{post_id}/deadline    — Asigna/reemplaza deadline de proyecto académico
 *   DELETE /posts/{post_id}/deadline    — Elimina deadline de proyecto académico
 *   DELETE /posts/{post_id}             — Elimina un post permanentemente
 */

import api from "./axios"

// ─── Interfaces ──────────────────────────────────────────

export interface PostCreate {
  title: string
  description: string
  post_type: string
  subtype: string
  tags?: string[]
  specific_fields?: Record<string, unknown>
  deadline_at?: string
}

export interface AcademicProjectCreate {
  subtype: string
  title: string
  description: string
  tags?: string[]
  deadline_at?: string
  participants_needed?: number
  estimated_time?: string
}

export interface SimplePostCreate {
  subtype: string
  description: string
  tags?: string[]
}

export interface AnnouncementCreate {
  subtype: string
  title: string
  description: string
  tags?: string[]
  deadline_at: string
  specific_fields?: Record<string, unknown>
}

export interface PostUpdate {
  title?: string
  description?: string
  subtype?: string
  tags?: string[]
  specific_fields?: Record<string, unknown>
  deadline_at?: string | null
}

export interface DeadlineUpdate {
  deadline_at: string
}

// ─── Creación ────────────────────────────────────────────

/**
 * POST /posts/
 * Crea un post genérico en estado draft. Requiere title, description,
 * post_type y subtype. Opcionales: tags, specific_fields, deadline_at.
 * time_status se calcula automáticamente.
 * Auth: Requerida.
 */
export async function createPost(payload: PostCreate) {
  const { data } = await api.post("/posts/", payload)
  return data
}

/**
 * POST /posts/academic-projects
 * Crea un proyecto académico en estado draft.
 * deadline_at es opcional (sin fecha = no_deadline).
 * participants_needed y estimated_time se guardan en specific_fields.
 * Auth: Requerida.
 */
export async function createAcademicProject(payload: AcademicProjectCreate) {
  const { data } = await api.post("/posts/academic-projects", payload)
  return data
}

/**
 * POST /posts/simple-posts
 * Crea una publicación simple. title es opcional (puede omitirse).
 * Solo requiere description y subtype.
 * Auth: Requerida.
 */
export async function createSimplePost(payload: SimplePostCreate) {
  const { data } = await api.post("/posts/simple-posts", payload)
  return data
}

/**
 * POST /posts/announcements
 * Crea un anuncio. deadline_at es obligatorio (indica hasta cuándo es relevante).
 * title y description requeridos.
 * Auth: Requerida.
 */
export async function createAnnouncement(payload: AnnouncementCreate) {
  const { data } = await api.post("/posts/announcements", payload)
  return data
}

// ─── Lectura y actualización ─────────────────────────────

/**
 * GET /posts/{postId}
 * Obtiene un post por ID con relaciones: usuario, imágenes, links.
 * Actualiza time_status automáticamente si el deadline expiró.
 * Auth: No requerida.
 */
export async function getPost(postId: number) {
  const { data } = await api.get(`/posts/${postId}`)
  return data
}

/**
 * PATCH /posts/{postId}
 * Actualiza campos editables: title, description, subtype, tags,
 * specific_fields, deadline_at. Solo los campos enviados se modifican.
 * No editable si está archivado.
 * Auth: Requerida (dueño o admin).
 */
export async function updatePost(postId: number, payload: PostUpdate) {
  const { data } = await api.patch(`/posts/${postId}`, payload)
  return data
}

// ─── Ciclo de vida ───────────────────────────────────────

/**
 * POST /posts/{postId}/publish
 * Cambia status de draft a published. El post aparece en el feed.
 * Auth: Requerida (dueño).
 */
export async function publishPost(postId: number) {
  const { data } = await api.post(`/posts/${postId}/publish`)
  return data
}

/**
 * POST /posts/{postId}/archive
 * Cambia status a archived. Irreversible. No aparece en el feed.
 * Auth: Requerida (dueño o admin).
 */
export async function archivePost(postId: number) {
  const { data } = await api.post(`/posts/${postId}/archive`)
  return data
}

/**
 * POST /posts/{postId}/check-time-status
 * Fuerza verificación y actualización de time_status según deadline_at.
 * Auth: Requerida (dueño o admin).
 */
export async function checkTimeStatus(postId: number) {
  const { data } = await api.post(`/posts/${postId}/check-time-status`)
  return data
}

// ─── Deadline (proyectos académicos) ─────────────────────

/**
 * POST /posts/{postId}/close
 * Cierra manualmente un proyecto académico.
 * Fuerza time_status = out_of_time y deadline_at = now().
 * Solo aplica a academic_project.
 * Auth: Requerida (dueño o admin).
 */
export async function closePost(postId: number) {
  const { data } = await api.post(`/posts/${postId}/close`)
  return data
}

/**
 * PATCH /posts/{postId}/deadline
 * Asigna o reemplaza el deadline de un proyecto académico.
 * Recalcula time_status: fecha futura → in_time, fecha pasada → out_of_time.
 * Auth: Requerida (dueño o admin).
 */
export async function setDeadline(postId: number, payload: DeadlineUpdate) {
  const { data } = await api.patch(`/posts/${postId}/deadline`, payload)
  return data
}

/**
 * DELETE /posts/{postId}/deadline
 * Elimina el deadline de un proyecto académico. time_status pasa a no_deadline.
 * Auth: Requerida (dueño o admin).
 */
export async function removeDeadline(postId: number) {
  const { data } = await api.delete(`/posts/${postId}/deadline`)
  return data
}

// ─── Eliminación ─────────────────────────────────────────

/**
 * DELETE /posts/{postId}
 * Elimina permanentemente el post y todas sus relaciones.
 * Auth: Requerida (dueño o admin).
 */
export async function deletePost(postId: number) {
  await api.delete(`/posts/${postId}`)
}

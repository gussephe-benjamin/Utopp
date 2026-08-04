/**
 * API del Feed
 *
 * Endpoints del backend:
 *   GET /feed — Feed de posts publicados con paginación y filtros opcionales.
 *              Sin auth: datos básicos. Con auth: incluye is_saved y participation_status.
 *
 * Filtros disponibles (query params):
 *   type         — post_type (international_opportunity, event, academic_project, announcement, simple_post)
 *   exclude_type — excluir un post_type (p. ej. eventos del feed de publicaciones)
 *   subtype      — subtype del post
 *   tags         — múltiples tags (OR)
 *   page         — número de página (1-indexed)
 *   size         — tamaño de página
 *   sort         — 'recent' (más recientes primero) o 'recommended' (score
 *                  heurístico personalizado); por defecto, orden por urgencia
 */

import api from "./axios"

export interface FeedParams {
  type?: string
  exclude_type?: string
  subtype?: string
  tags?: string[]
  time_status?: string
  sort?: "recent" | "recommended" | string
  page?: number
  size?: number
}

/**
 * GET /feed
 * Devuelve posts publicados ordenados por fecha de creación descendente.
 * Soporta filtros opcionales por tipo, subtipo y tags.
 * Auth: Opcional (enriquece la respuesta si está autenticado).
 */
export async function getFeed(params?: FeedParams) {
  const { data } = await api.get("/feed", { params })
  return data
}

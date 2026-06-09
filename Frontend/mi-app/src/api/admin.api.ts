import api from "./axios"

// ─── Tipos ───────────────────────────────────────────────

export interface AdminUserListItem {
  id: number
  email: string
  full_name: string | null
  career: string | null
  cycle: number | null
  profile_image_url: string | null
  posts_count: number
  created_at: string
  roles: string[]
}

export interface AdminUserDetail {
  id: number
  email: string
  full_name: string | null
  career: string | null
  cycle: number | null
  interests: string[] | null
  availability: number | null
  description: string | null
  contacts: Record<string, string> | null
  is_onboarding_completed: boolean
  profile_image_url: string | null
  created_at: string
  roles: string[]
}

export interface AdminIdentity {
  user_id: number
  email: string
  full_name: string | null
  is_admin: boolean
  is_root: boolean
  roles: string[]
}

export interface AdminUsersPageResponse {
  items: AdminUserListItem[]
  page: number
  size: number
  total: number
  pages: number
  has_next: boolean
  has_prev: boolean
}

export interface AdminUserCreatePayload {
  email: string
  password: string
  full_name?: string | null
  role?: string | null
}

export interface AdminUserUpdatePayload {
  email?: string
  full_name?: string | null
  career?: string | null
  cycle?: number | null
  interests?: string[] | null
  availability?: number | null
  description?: string | null
  contacts?: Record<string, string> | null
}

// ─── Identificación de admin ─────────────────────────────

/**
 * GET /admin/me
 * Devuelve el estado administrativo del usuario autenticado (is_admin/is_root).
 * Cualquier usuario autenticado puede llamarla.
 */
export async function getAdminMe(): Promise<AdminIdentity> {
  const { data } = await api.get<AdminIdentity>("/admin/me")
  return data
}

/**
 * GET /admin/admins
 * Lista los usuarios con rol administrador o root. Auth: admin/root.
 */
export async function getAdminAdmins(): Promise<AdminUserListItem[]> {
  const { data } = await api.get<AdminUserListItem[]>("/admin/admins")
  return data
}

// ─── Endpoints (/admin/users) ────────────────────────────

/**
 * GET /admin/users
 * Lista paginada de usuarios con filtros de rol y búsqueda. Auth: admin/root.
 */
export async function getAdminUsers(params?: {
  role?: string
  q?: string
  page?: number
  size?: number
}): Promise<AdminUsersPageResponse> {
  const { data } = await api.get<AdminUsersPageResponse>("/admin/users", { params })
  return data
}

/** GET /admin/users/{id} — detalle de usuario. Auth: admin/root. */
export async function getAdminUser(userId: number): Promise<AdminUserDetail> {
  const { data } = await api.get<AdminUserDetail>(`/admin/users/${userId}`)
  return data
}

/** POST /admin/users — crea un usuario con rol. Auth: admin/root. */
export async function createAdminUser(payload: AdminUserCreatePayload): Promise<AdminUserDetail> {
  const { data } = await api.post<AdminUserDetail>("/admin/users", payload)
  return data
}

/** PATCH /admin/users/{id} — actualiza campos del usuario. Auth: admin/root. */
export async function updateAdminUser(
  userId: number,
  payload: AdminUserUpdatePayload,
): Promise<AdminUserDetail> {
  const { data } = await api.patch<AdminUserDetail>(`/admin/users/${userId}`, payload)
  return data
}

/** DELETE /admin/users/{id} — elimina al usuario y sus datos. Auth: admin/root. */
export async function deleteAdminUser(userId: number): Promise<void> {
  await api.delete(`/admin/users/${userId}`)
}

/**
 * API de Roles (Admin)
 *
 * Endpoints del backend (prefix: /roles):
 *   GET    /roles/                              — Lista todos los roles
 *   POST   /roles/                              — Crea un nuevo rol
 *   POST   /roles/users/{user_id}/roles/{role_id} — Asigna rol a usuario
 *   DELETE /roles/users/{user_id}/roles/{role_id} — Quita rol de usuario
 *   GET    /roles/users/{user_id}/roles         — Lista roles de un usuario
 *
 * Setup:
 *   POST   /setup/bootstrap-admin — Asigna rol admin al primer usuario
 *
 * Todos los endpoints de /roles/ requieren autenticación con rol admin.
 */

import api from "./axios"

// ─── Roles ───────────────────────────────────────────────

/**
 * GET /roles/
 * Lista todos los roles registrados en el sistema.
 * Auth: Requerida (admin).
 */
export async function listRoles() {
  const { data } = await api.get("/roles/")
  return data
}

/**
 * POST /roles/
 * Crea un nuevo rol. Error 409 si el nombre ya existe.
 * Auth: Requerida (admin).
 */
export async function createRole(name: string, description: string) {
  const { data } = await api.post("/roles/", { name, description })
  return data
}

/**
 * POST /roles/users/{userId}/roles/{roleId}
 * Asigna el rol al usuario. Error 409 si ya lo tiene.
 * Auth: Requerida (admin).
 */
export async function assignRole(userId: number, roleId: number) {
  const { data } = await api.post(`/roles/users/${userId}/roles/${roleId}`)
  return data
}

/**
 * DELETE /roles/users/{userId}/roles/{roleId}
 * Quita el rol del usuario. Error 404 si no lo tenía.
 * Auth: Requerida (admin).
 */
export async function removeRole(userId: number, roleId: number) {
  await api.delete(`/roles/users/${userId}/roles/${roleId}`)
}

/**
 * GET /roles/users/{userId}/roles
 * Lista los roles asignados a un usuario específico.
 * Auth: Requerida (admin).
 */
export async function getUserRoles(userId: number) {
  const { data } = await api.get(`/roles/users/${userId}/roles`)
  return data
}

// ─── Bootstrap ───────────────────────────────────────────

/**
 * POST /setup/bootstrap-admin
 * Asigna el rol admin al primer usuario del sistema.
 * Solo funciona si no existe ningún admin.
 * Auth: No requerida (controlado por X-Setup-Token header).
 */
export async function bootstrapAdmin(email: string, setupToken?: string) {
  const headers: Record<string, string> = {}
  if (setupToken) {
    headers["X-Setup-Token"] = setupToken
  }
  const { data } = await api.post("/setup/bootstrap-admin", { email }, { headers })
  return data
}

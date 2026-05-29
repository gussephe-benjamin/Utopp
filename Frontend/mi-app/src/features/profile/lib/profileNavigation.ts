/**
 * Ruta de perfil: propio sin id, ajeno con id.
 */
export function profilePath(targetUserId: number, currentUserId: number | null | undefined): string {
  if (currentUserId != null && targetUserId === currentUserId) {
    return "/app/perfil"
  }
  return `/app/perfil/${targetUserId}`
}

/** true si la URL apunta al usuario autenticado (con o sin id en la ruta). */
export function isViewingOwnProfile(
  viewedUserId: number | undefined,
  currentUserId: number | null
): boolean {
  if (viewedUserId == null) return true
  if (currentUserId == null) return false
  return viewedUserId === currentUserId
}

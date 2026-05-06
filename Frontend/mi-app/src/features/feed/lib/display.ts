/** Nombre visible del usuario o fallback */
export function getDisplayName(userName?: string, userId?: number): string {
  if (userName?.trim()) return userName;
  return userId ? `Usuario ${userId}` : "Usuario Anónimo";
}

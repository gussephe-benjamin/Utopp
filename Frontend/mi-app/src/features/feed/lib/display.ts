/** Nombre visible del usuario o fallback */
export function getDisplayName(userName?: string, userId?: number): string {
  if (userName?.trim()) return userName;
  return userId ? `Usuario ${userId}` : "Usuario Anónimo";
}

/** Primer nombre y primer apellido a partir del nombre completo. */
export function formatShortDisplayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] ?? fullName;
  if (parts.length === 2) return `${parts[0]} ${parts[1]}`;
  if (parts.length === 3) return `${parts[0]} ${parts[1]}`;
  return `${parts[0]} ${parts[2]}`;
}

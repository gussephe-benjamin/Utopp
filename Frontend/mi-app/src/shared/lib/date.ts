/** Formatea una fecha ISO a texto legible en español */
export function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** Determina si una fecha ya venció (client-side) */
export function isExpired(iso?: string): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() <= Date.now();
}

/** Tiempo relativo en español desde una fecha ISO */
export function timeAgo(iso?: string): string {
  if (!iso) return "";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "hace un momento";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `hace ${Math.floor(diff / 86400)} días`;
  if (diff < 2592000) return `hace ${Math.floor(diff / 604800)} sem`;
  return `hace ${Math.floor(diff / 2592000)} meses`;
}

/** Texto de tiempo restante hasta una fecha futura */
export function timeRemaining(iso?: string): string | null {
  if (!iso) return null;
  const diff = Math.floor((new Date(iso).getTime() - Date.now()) / 1000);
  if (diff <= 0) return null;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}min`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ${Math.floor((diff % 86400) / 3600)}h`;
  return `${Math.floor(diff / 604800)} sem`;
}

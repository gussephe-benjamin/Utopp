/** URL pública del API en producción (Render). */
export const PRODUCTION_API_URL = "https://utopp.onrender.com"

const PRODUCTION_API_BY_HOST: Record<string, string> = {
  "utopp-fronted.onrender.com": PRODUCTION_API_URL,
  "utopp.app": PRODUCTION_API_URL,
  "www.utopp.app": PRODUCTION_API_URL,
}

function isLocalApiUrl(url: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(url)
}

/**
 * Resuelve la base URL del API.
 * - Respeta VITE_API_URL si apunta a un host no local.
 * - En el frontend desplegado (Render / utopp.app), usa el API de producción aunque
 *   el build tenga localhost embebido.
 */
export function resolveApiBaseUrl(): string {
  const fromEnv = (import.meta.env.VITE_API_URL as string | undefined)?.trim()
  if (fromEnv && !isLocalApiUrl(fromEnv)) {
    return fromEnv.replace(/\/+$/, "")
  }

  if (typeof window !== "undefined") {
    const mapped = PRODUCTION_API_BY_HOST[window.location.hostname]
    if (mapped) return mapped
  }

  return (fromEnv || "http://localhost:8000").replace(/\/+$/, "")
}

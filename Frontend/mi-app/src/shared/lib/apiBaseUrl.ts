/** URL pública del API en producción. */
export const PRODUCTION_API_URL = "https://www.api.utopp.app"

const PRODUCTION_API_BY_HOST: Record<string, string> = {
  "utopp-fronted.onrender.com": PRODUCTION_API_URL,
  "utopp.app": PRODUCTION_API_URL,
  "www.utopp.app": PRODUCTION_API_URL,
}

/** Hosts del frontend; no deben usarse como VITE_API_URL por error. */
const FRONTEND_PRODUCTION_HOSTS = new Set([
  "utopp.app",
  "www.utopp.app",
  "utopp-fronted.onrender.com",
])

function isLocalApiUrl(url: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(url)
}

function isFrontendProductionUrl(url: string): boolean {
  try {
    return FRONTEND_PRODUCTION_HOSTS.has(new URL(url).hostname)
  } catch {
    return false
  }
}

/**
 * Resuelve la base URL del API.
 * - Respeta VITE_API_URL si apunta a un host de API (no al frontend).
 * - En utopp.app / Vercel, usa www.api.utopp.app aunque el build tenga localhost o el FE.
 */
export function resolveApiBaseUrl(): string {
  const fromEnv = (import.meta.env.VITE_API_URL as string | undefined)?.trim()
  if (fromEnv && !isLocalApiUrl(fromEnv) && !isFrontendProductionUrl(fromEnv)) {
    return fromEnv.replace(/\/+$/, "")
  }

  if (typeof window !== "undefined") {
    const mapped = PRODUCTION_API_BY_HOST[window.location.hostname]
    if (mapped) return mapped
  }

  return (fromEnv || "http://localhost:8000").replace(/\/+$/, "")
}

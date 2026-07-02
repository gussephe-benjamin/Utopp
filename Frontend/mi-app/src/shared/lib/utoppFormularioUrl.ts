import { getStoredAccessToken } from "./authToken"

/** URL pública de Utopp Formulario en producción. */
export const PRODUCTION_UF_URL = "https://www.formulario.utopp.app"

const PRODUCTION_UF_BY_HOST: Record<string, string> = {
  "utopp-fronted.onrender.com": PRODUCTION_UF_URL,
  "utopp.app": PRODUCTION_UF_URL,
  "www.utopp.app": PRODUCTION_UF_URL,
}

/** Resuelve la base URL del frontend de Utopp Formulario (mismo patrón que resolveApiBaseUrl). */
function resolveUfBaseUrl(): string {
  const fromEnv = (import.meta.env.VITE_UF_FRONTEND_URL as string | undefined)?.trim()
  if (fromEnv) return fromEnv.replace(/\/+$/, "")

  if (typeof window !== "undefined") {
    const mapped = PRODUCTION_UF_BY_HOST[window.location.hostname]
    if (mapped) return mapped
  }

  return "http://localhost:5174"
}

/**
 * URL para que un organizador entre a Utopp Formulario con su sesión de
 * Utopp ya iniciada (SSO). Null si no hay token de Utopp en esta sesión.
 */
export function buildUtoppFormularioSsoUrl(): string | null {
  const token = getStoredAccessToken()
  if (!token) return null
  return `${resolveUfBaseUrl()}/dashboard?sso_token=${encodeURIComponent(token)}`
}

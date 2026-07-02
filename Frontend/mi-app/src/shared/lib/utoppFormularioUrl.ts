import api from "../../api/axios"

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
 * Abre Utopp Formulario en una pestaña nueva con la sesión de Utopp ya
 * iniciada (SSO). La sesión de Utopp vive en una cookie HttpOnly, así que
 * el token se pide al backend en el momento del clic (POST /auth/refresh,
 * autenticado por esa misma cookie) en vez de leerlo del cliente.
 *
 * La pestaña se abre de forma síncrona (antes del await) para que los
 * navegadores no la bloqueen como popup, y se navega una vez llega el token.
 */
export async function openUtoppFormularioSso(): Promise<void> {
  // Sin "noopener" en las features: con noopener window.open devuelve null
  // y perderíamos el handle para navegar la pestaña. El vínculo con el
  // opener se corta manualmente justo después.
  const newTab = window.open("", "_blank")
  if (newTab) newTab.opener = null
  try {
    const { data } = await api.post("/auth/refresh")
    const token = data?.access_token as string | undefined
    if (!token) {
      throw new Error("No se recibió un token de sesión válido")
    }
    if (!newTab) {
      throw new Error("El navegador bloqueó la pestaña nueva. Habilita las ventanas emergentes e inténtalo de nuevo.")
    }
    newTab.location.href = `${resolveUfBaseUrl()}/dashboard?sso_token=${encodeURIComponent(token)}`
  } catch (err) {
    newTab?.close()
    throw err
  }
}

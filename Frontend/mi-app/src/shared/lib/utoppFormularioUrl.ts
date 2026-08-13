import api from "../../api/axios"

/** URL pública de Utopp Formulario en producción (custom domain real). */
export const PRODUCTION_UF_URL = "https://www.forms.utopp.app"
const FORMULARIO_RETURN_STORAGE_KEY = "utopp_formulario_return_url"

const PRODUCTION_UF_BY_HOST: Record<string, string> = {
  "utopp-fronted.onrender.com": PRODUCTION_UF_URL,
  "utopp.app": PRODUCTION_UF_URL,
  "www.utopp.app": PRODUCTION_UF_URL,
}

const ALLOWED_UF_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "utopp-formulario.onrender.com",
  "forms.utopp.app",
  "www.forms.utopp.app",
  // legacy / docs antiguos
  "formulario.utopp.app",
  "www.formulario.utopp.app",
])

/** Resuelve la base URL del frontend de Utopp Formulario (mismo patrón que resolveApiBaseUrl). */
export function resolveUfBaseUrl(): string {
  const fromEnv = (import.meta.env.VITE_UF_FRONTEND_URL as string | undefined)?.trim()
  if (fromEnv) return fromEnv.replace(/\/+$/, "")

  if (typeof window !== "undefined") {
    const mapped = PRODUCTION_UF_BY_HOST[window.location.hostname]
    if (mapped) return mapped
  }

  return "http://localhost:5174"
}

function isAllowedUfHostname(hostname: string): boolean {
  return ALLOWED_UF_HOSTS.has(hostname.toLowerCase())
}

/**
 * Apex `forms.utopp.app` redirige 301 a `www.forms.utopp.app` y puede
 * perder `?sso_token=`. Siempre devolvemos al host canónico.
 */
export function canonicalizeUtoppFormularioUrl(value: string): string {
  try {
    const url = new URL(value)
    if (url.hostname === "forms.utopp.app" || url.hostname === "formulario.utopp.app" || url.hostname === "www.formulario.utopp.app") {
      url.hostname = "www.forms.utopp.app"
    }
    return url.toString()
  } catch {
    return value
  }
}

export function isAllowedUtoppFormularioUrl(value: string | null | undefined): value is string {
  if (!value) return false
  try {
    const target = new URL(value)
    if (target.protocol === "http:") {
      return target.hostname === "localhost" || target.hostname === "127.0.0.1"
    }
    if (target.protocol !== "https:") return false
    return isAllowedUfHostname(target.hostname)
  } catch {
    return false
  }
}

export function rememberUtoppFormularioReturnUrl(value: string | null | undefined): void {
  if (!isAllowedUtoppFormularioUrl(value) || typeof window === "undefined") return
  try {
    window.sessionStorage.setItem(FORMULARIO_RETURN_STORAGE_KEY, canonicalizeUtoppFormularioUrl(value))
  } catch {
    /* sessionStorage can fail in private browsing; the direct redirect path still works. */
  }
}

export function getRememberedUtoppFormularioReturnUrl(): string | null {
  if (typeof window === "undefined") return null
  try {
    const value = window.sessionStorage.getItem(FORMULARIO_RETURN_STORAGE_KEY)
    return isAllowedUtoppFormularioUrl(value) ? canonicalizeUtoppFormularioUrl(value) : null
  } catch {
    return null
  }
}

export function consumeRememberedUtoppFormularioReturnUrl(): string | null {
  if (typeof window === "undefined") return null
  try {
    const value = window.sessionStorage.getItem(FORMULARIO_RETURN_STORAGE_KEY)
    window.sessionStorage.removeItem(FORMULARIO_RETURN_STORAGE_KEY)
    return isAllowedUtoppFormularioUrl(value) ? canonicalizeUtoppFormularioUrl(value) : null
  } catch {
    return null
  }
}

export function buildUtoppFormularioSsoUrl(targetUrl: string, token: string): string {
  const url = new URL(canonicalizeUtoppFormularioUrl(targetUrl))
  url.searchParams.set("sso_token", token)
  return url.toString()
}

async function getUtoppSsoToken(): Promise<string> {
  const { data } = await api.post("/auth/refresh")
  const token = data?.access_token as string | undefined
  if (!token) {
    throw new Error("No se recibió un token de sesión válido")
  }
  return token
}

export async function redirectToUtoppFormularioSso(targetUrl: string): Promise<void> {
  if (!isAllowedUtoppFormularioUrl(targetUrl)) {
    throw new Error("URL de retorno a Utopp Formulario no permitida")
  }
  const token = await getUtoppSsoToken()
  window.location.assign(buildUtoppFormularioSsoUrl(targetUrl, token))
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
    const token = await getUtoppSsoToken()
    if (!newTab) {
      throw new Error("El navegador bloqueó la pestaña nueva. Habilita las ventanas emergentes e inténtalo de nuevo.")
    }
    newTab.location.href = buildUtoppFormularioSsoUrl(`${resolveUfBaseUrl()}/dashboard`, token)
  } catch (err) {
    newTab?.close()
    throw err
  }
}

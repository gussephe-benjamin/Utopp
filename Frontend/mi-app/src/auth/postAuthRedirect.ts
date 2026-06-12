import type { NavigateFunction } from "react-router-dom"
import { getMe } from "../api/auth.api"
import { isComplete } from "../api/onboarding.api"
import { getToken } from "./tokenStorage"

/**
 * Tras tener JWT válido: envía a términos, onboarding o inicio según el estado del usuario.
 */
export async function redirectAfterAuthSession(
  navigate: NavigateFunction,
  options?: { replace?: boolean }
): Promise<void> {
  const replace = options?.replace ?? true

  // Soporte para SSO/Redirección externa a Utopp Formulario u otra app del ecosistema
  const params = new URLSearchParams(window.location.search)
  const redirectUrl = params.get("redirect")
  if (redirectUrl) {
    const token = getToken()
    if (token) {
      window.location.href = `${redirectUrl}?sso_token=${token}`
      return
    }
  }

  const user = await getMe()
  if (user.needs_terms) {
    navigate("/app/terms", { replace })
    return
  }
  const response = await isComplete(user.id)
  if (!response.onboarding_completed) {
    navigate("/onboarding", { replace })
  } else {
    navigate("/app/inicio", { replace })
  }
}


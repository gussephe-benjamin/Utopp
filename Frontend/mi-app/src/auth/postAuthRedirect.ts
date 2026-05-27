import type { NavigateFunction } from "react-router-dom"
import { getMe } from "../api/auth.api"
import { isComplete } from "../api/onboarding.api"

/**
 * Tras tener JWT válido: envía a términos, onboarding o inicio según el estado del usuario.
 */
export async function redirectAfterAuthSession(
  navigate: NavigateFunction,
  options?: { replace?: boolean }
): Promise<void> {
  const replace = options?.replace ?? true
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

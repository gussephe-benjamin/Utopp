import type { NavigateFunction } from "react-router-dom"
import type { AuthMeUser } from "../api/auth.api"

/** Redirige según el estado del usuario autenticado. */
export function redirectAfterAuthSession(
  navigate: NavigateFunction,
  user: AuthMeUser,
  options?: { replace?: boolean },
): void {
  const replace = options?.replace ?? true

  if (user.needs_terms) {
    navigate("/app/terms", { replace })
    return
  }
  if (!user.onboarding_completed) {
    navigate("/onboarding", { replace })
    return
  }
  navigate("/app/inicio", { replace })
}

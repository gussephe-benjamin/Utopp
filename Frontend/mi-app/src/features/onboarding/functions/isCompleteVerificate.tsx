import { getMe } from "../../../api/auth.api"
import type { NavigateFunction } from "react-router-dom"

export const checkOnboardingCompleted = async (
  navigate: NavigateFunction
) => {
  try {
    const user = await getMe()

    if (user.needs_terms) {
      navigate("/app/terms", { replace: true })
      return
    }

    if (user.onboarding_completed) {
      navigate("/app/inicio", { replace: true })
    }
  } catch (error) {
    console.error("Error verificando onboarding", error)
  }
}

import { getMe } from "../../api/apiFunctions/auth"
import type { NavigateFunction } from "react-router-dom"

export const checkOnboardingCompleted = async (
  navigate: NavigateFunction
) => {
  try {
    const user = await getMe()

    if (user.onboarding_completed) {
      navigate("/dashboard", { replace: true })
    }
  } catch (error) {
    console.error("Error verificando onboarding", error)
  }
}

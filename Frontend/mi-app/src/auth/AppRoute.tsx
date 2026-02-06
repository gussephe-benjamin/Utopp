import { Navigate } from "react-router-dom"
import { useAuth } from "./useAuth"
import { useEffect, useState } from "react"
import { getMe } from "../api/apiFunctions/auth"

export default function AppRoute() {
  const { token } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false)

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const user = await getMe()
        setIsOnboardingCompleted(user.onboarding_completed)
      } catch (error) {
        console.error("Error verificando onboarding", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkOnboarding()
  }, [token])

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (!isOnboardingCompleted) {
    return <Navigate to="/onboarding" replace />
  }

  return <Navigate to="/app/inicio" replace />
}

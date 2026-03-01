import { Navigate } from "react-router-dom"
import { useAuth } from "./useAuth"
import { useEffect, useState } from "react"
import { getMe } from "../api/auth.api"



export default function AppRoute() {
  const [isLoading, setIsLoading] = useState(true)
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false)
  const { token, logout } = useAuth()

  console.log("Token en AppRoute:", token)

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
        logout() // 👈 IMPORTANTE
      } finally {
        setIsLoading(false)
      }
    }

    checkOnboarding()
  }, [token, logout])

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

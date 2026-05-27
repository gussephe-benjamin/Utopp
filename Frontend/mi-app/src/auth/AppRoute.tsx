import { Navigate } from "react-router-dom"
import { useAuth } from "./useAuth"
import { useEffect, useState } from "react"
import { getMe } from "../api/auth.api"

type GateState =
  | { status: "loading" }
  | { status: "terms" }
  | { status: "onboarding" }
  | { status: "app" }

export default function AppRoute() {
  const [gate, setGate] = useState<GateState>({ status: "loading" })
  const { token, logout } = useAuth()

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setGate({ status: "loading" })
        return
      }

      try {
        const user = await getMe()
        if (user.needs_terms) {
          setGate({ status: "terms" })
          return
        }
        if (!user.onboarding_completed) {
          setGate({ status: "onboarding" })
          return
        }
        setGate({ status: "app" })
      } catch (error) {
        console.error("Error verificando sesión", error)
        logout()
        setGate({ status: "loading" })
      }
    }

    void run()
  }, [token, logout])

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (gate.status === "loading") {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  }

  if (gate.status === "terms") {
    return <Navigate to="/app/terms" replace />
  }

  if (gate.status === "onboarding") {
    return <Navigate to="/onboarding" replace />
  }

  return <Navigate to="/app/inicio" replace />
}

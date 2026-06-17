import { Navigate } from "react-router-dom"
import { useAuth } from "./useAuth"

export default function AppRoute() {
  const { status, user } = useAuth()

  if (status === "initializing") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Cargando...</p>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />
  }

  if (user?.needs_terms) {
    return <Navigate to="/app/terms" replace />
  }

  if (!user?.onboarding_completed) {
    return <Navigate to="/onboarding" replace />
  }

  return <Navigate to="/app/inicio" replace />
}

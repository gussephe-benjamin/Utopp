import { Navigate } from "react-router-dom"
import { useAuth } from "./useAuth"
import type { ReactNode } from "react"

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { status } = useAuth()

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

  return children
}

import { type ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useRole, ROLE_ADMIN, ROLE_ROOT } from "../../hooks/useRole"

/**
 * Restringe el acceso a la sección admin: solo roles administrador o root.
 * Mientras se resuelve el rol muestra un placeholder; si no tiene permisos,
 * redirige al feed.
 */
export function AdminGuard({ children }: { children: ReactNode }) {
  const { roleName, loading } = useRole()

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-gray-500 animate-pulse">Verificando permisos…</p>
      </div>
    )
  }

  const isAdmin = roleName === ROLE_ADMIN || roleName === ROLE_ROOT
  if (!isAdmin) {
    return <Navigate to="/app/inicio" replace />
  }

  return <>{children}</>
}

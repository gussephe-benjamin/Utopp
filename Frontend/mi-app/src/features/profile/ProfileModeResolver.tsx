import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { getMyRoles, getUserRoles } from "../../api/roles.api"
import StudentProfilePage from "../../pages/StudentProfilePage"
import OrganizationProfilePage from "../../pages/OrganizationProfilePage"

type RoleName =
  | "estudiante"
  | "organización estudiantil"
  | "oficina"
  | "administrador"
  | "root"
  | "unknown"

/**
 * Dispatcher de perfil: detecta el rol del usuario observado y renderiza
 * la página correspondiente (alumno u organización). Maneja tanto la vista
 * propia (`/app/perfil`) como la externa (`/app/perfil/:id`).
 */
export default function ProfileModeResolver({ viewUserId }: { viewUserId?: number } = {}) {
  const params = useParams()
  const resolvedId = viewUserId ?? (params.id ? Number(params.id) : undefined)
  const viewedUserId = resolvedId
  const isMe = useMemo(() => !resolvedId, [resolvedId])

  const [role, setRole] = useState<RoleName>("unknown")
  const [resolving, setResolving] = useState(true)

  useEffect(() => {
    let mounted = true
    setResolving(true)
    ;(async () => {
      try {
        const roles = isMe
          ? await getMyRoles().catch(() => [])
          : viewedUserId
            ? await getUserRoles(viewedUserId).catch(() => [])
            : []
        if (!mounted) return
        setRole(((roles[0]?.name as RoleName) ?? "unknown") as RoleName)
      } finally {
        if (mounted) setResolving(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [isMe, viewedUserId])

  if (resolving) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-gray-600">Cargando perfil...</p>
      </div>
    )
  }

  if (role === "organización estudiantil") {
    return <OrganizationProfilePage viewedUserId={viewedUserId} />
  }

  return <StudentProfilePage viewedUserId={viewedUserId} />
}

import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { getMyRoles, getUserRoles } from "../../api/roles.api"
import { getMyProfile } from "../../api/users.api"
import StudentProfilePage from "../../pages/StudentProfilePage"
import OrganizationProfilePage from "../../pages/OrganizationProfilePage"
import { isViewingOwnProfile } from "./lib/profileNavigation"

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

  const [myUserId, setMyUserId] = useState<number | null>(null)
  const [identityReady, setIdentityReady] = useState(false)
  const [role, setRole] = useState<RoleName>("unknown")
  const [resolving, setResolving] = useState(true)
  const [resolvedForKey, setResolvedForKey] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    getMyProfile()
      .then((profile) => {
        if (mounted) setMyUserId(profile.id)
      })
      .catch(() => {
        if (mounted) setMyUserId(null)
      })
      .finally(() => {
        if (mounted) setIdentityReady(true)
      })
    return () => {
      mounted = false
    }
  }, [])

  const isOwnProfile = isViewingOwnProfile(resolvedId, myUserId)
  const effectiveViewedUserId = isOwnProfile ? undefined : resolvedId
  const profileTargetKey = isOwnProfile ? "me" : String(resolvedId ?? "")

  useEffect(() => {
    if (!identityReady) return
    let mounted = true
    setResolving(true)
    setRole("unknown")
    ;(async () => {
      try {
        const roles = isOwnProfile
          ? await getMyRoles().catch(() => [])
          : resolvedId
            ? await getUserRoles(resolvedId).catch(() => [])
            : []
        if (!mounted) return
        setRole(((roles[0]?.name as RoleName) ?? "unknown") as RoleName)
        setResolvedForKey(profileTargetKey)
      } finally {
        if (mounted) setResolving(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [identityReady, isOwnProfile, resolvedId, profileTargetKey])

  const profileReady = identityReady && !resolving && resolvedForKey === profileTargetKey

  if (!profileReady) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-gray-600 animate-pulse">Cargando perfil...</p>
      </div>
    )
  }

  const pageKey = profileTargetKey

  if (role === "organización estudiantil") {
    return <OrganizationProfilePage key={pageKey} viewedUserId={effectiveViewedUserId} />
  }

  return <StudentProfilePage key={pageKey} viewedUserId={effectiveViewedUserId} />
}

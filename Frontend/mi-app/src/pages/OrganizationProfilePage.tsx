import { useEffect, useState } from "react"
import { getMyProfile, getUserProfile } from "../api/users.api"
import { OrganizationProfileSelf } from "../features/profile/views/OrganizationProfileSelf"
import { OrganizationProfilePublic } from "../features/profile/views/OrganizationProfilePublic"
import type { ProfileUserData } from "../features/profile/views/types"

interface OrganizationProfilePageProps {
  viewedUserId?: number
}

/**
 * Página de perfil para usuarios con rol `organización estudiantil`.
 * Mantiene una base interna/externa lista para la siguiente iteración
 * de contenido específico de organizaciones.
 */
export default function OrganizationProfilePage({ viewedUserId }: OrganizationProfilePageProps) {
  const isMe = !viewedUserId
  const [user, setUser] = useState<ProfileUserData | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    setLoading(true)

    ;(async () => {
      try {
        const profile = isMe
          ? await getMyProfile()
          : viewedUserId
            ? await getUserProfile(viewedUserId)
            : null
        if (!mounted || !profile) return
        setUser(profile)
        setAvatarUrl(profile.profile_image_url ?? null)
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [isMe, viewedUserId])

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-gray-600">Cargando perfil de organización...</p>
      </div>
    )
  }

  return isMe ? (
    <OrganizationProfileSelf user={user} avatarUrl={avatarUrl} />
  ) : (
    <OrganizationProfilePublic user={user} avatarUrl={avatarUrl} />
  )
}

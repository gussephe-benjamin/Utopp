import { useCallback, useEffect, useMemo, useState } from "react"
import {
  followUser,
  getMyFollowingOrganizations,
  getMyProfile,
  getOrganizations,
  getUserFollowingOrganizations,
  getUserProfile,
  setProfileImage,
  unfollowUser,
  updateMyProfile,
  type OrganizationSummary,
} from "../api/users.api"
import { uploadToCloudinary } from "../api/cloudinary"
import { getMyRoles } from "../api/roles.api"
import { getSavedPosts } from "../api/saved-posts.api"
import { StudentProfileSelf } from "../features/profile/views/StudentProfileSelf"
import { StudentProfilePublic } from "../features/profile/views/StudentProfilePublic"
import { mapSavedPostToFeedPost, type SavedPostRaw } from "../features/profile/lib/postMapper"
import type { ProfileUserData } from "../features/profile/views/types"
import type { FeedPostOut } from "../types/post.types"

interface StudentProfilePageProps {
  viewedUserId?: number
}

/**
 * Página de perfil para usuarios con rol `estudiante`.
 * Decide entre la vista propia (`student-self`) y la vista pública (`student-public`)
 * en función del `viewedUserId` recibido.
 */
export default function StudentProfilePage({ viewedUserId }: StudentProfilePageProps) {
  const isMe = !viewedUserId

  const [user, setUser] = useState<ProfileUserData | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [followingOrganizations, setFollowingOrganizations] = useState<OrganizationSummary[]>([])
  const [allOrganizations, setAllOrganizations] = useState<OrganizationSummary[]>([])
  const [eventSavedPosts, setEventSavedPosts] = useState<FeedPostOut[]>([])
  const [loading, setLoading] = useState(true)
  const [profileSaving, setProfileSaving] = useState(false)
  const [avatarSaving, setAvatarSaving] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [orgActionId, setOrgActionId] = useState<number | null>(null)
  const [orgError, setOrgError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)

    ;(async () => {
      try {
        if (isMe) {
          const [profile, savedRaw, followingOrgs, orgs, roles] = await Promise.all([
            getMyProfile(),
            getSavedPosts().catch(() => [] as SavedPostRaw[]),
            getMyFollowingOrganizations().catch(() => []),
            getOrganizations().catch(() => []),
            getMyRoles().catch(() => []),
          ])
          if (!mounted) return
          setUser({ ...profile, role_name: roles[0]?.name ?? profile.role_name ?? "alumno" })
          setAvatarUrl(profile.profile_image_url ?? null)
          setFollowingOrganizations(followingOrgs)
          setAllOrganizations(orgs)
          const savedFeedPosts = (savedRaw as SavedPostRaw[])
            .filter((post) => post.post_type === "event")
            .map(mapSavedPostToFeedPost)
          setEventSavedPosts(savedFeedPosts)
          return
        }

        if (!viewedUserId) return
        const [publicProfile, followedOrgs] = await Promise.all([
          getUserProfile(viewedUserId),
          getUserFollowingOrganizations(viewedUserId).catch(() => []),
        ])
        if (!mounted) return
        setUser(publicProfile)
        setAvatarUrl(publicProfile.profile_image_url ?? null)
        setFollowingOrganizations(followedOrgs)
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [isMe, viewedUserId])

  const handleSaveProfile = useCallback(
    async (payload: { cycle: number; availability: number }) => {
      setProfileSaving(true)
      try {
        const updated = await updateMyProfile(payload)
        setUser((prev) => (prev ? { ...prev, ...updated } : prev))
      } finally {
        setProfileSaving(false)
      }
    },
    [],
  )

  const extractApiError = (error: unknown, fallback: string): string => {
    if (error && typeof error === "object") {
      const maybeAxios = error as { response?: { data?: { detail?: string } }; message?: string }
      if (maybeAxios.response?.data?.detail) return maybeAxios.response.data.detail
      if (maybeAxios.message) return maybeAxios.message
    }
    return fallback
  }

  const handleFollowOrganization = useCallback(
    async (orgId: number) => {
      if (followingOrganizations.length >= 5) {
        setOrgError("Solo puedes seguir hasta 5 organizaciones. Usa 'Quitar' para cambiar.")
        return
      }
      setOrgActionId(orgId)
      setOrgError(null)
      try {
        await followUser(orgId)
        const refreshed = await getMyFollowingOrganizations().catch(() => null)
        if (refreshed) {
          setFollowingOrganizations(refreshed)
        } else {
          const org = allOrganizations.find((item) => item.id === orgId)
          if (org) setFollowingOrganizations((prev) => [...prev, org])
        }
      } catch (error) {
        const message = extractApiError(error, "No se pudo seguir la organización")
        console.error(message, error)
        setOrgError(message)
      } finally {
        setOrgActionId(null)
      }
    },
    [allOrganizations, followingOrganizations.length],
  )

  const handleUnfollowOrganization = useCallback(async (orgId: number) => {
    setOrgActionId(orgId)
    setOrgError(null)
    try {
      await unfollowUser(orgId)
      setFollowingOrganizations((prev) => prev.filter((org) => org.id !== orgId))
    } catch (error) {
      const message = extractApiError(error, "No se pudo dejar de seguir la organización")
      console.error(message, error)
      setOrgError(message)
    } finally {
      setOrgActionId(null)
    }
  }, [])

  const handleDismissOrgError = useCallback(() => setOrgError(null), [])
  const handleDismissAvatarError = useCallback(() => setAvatarError(null), [])

  const handleChangeAvatar = useCallback(
    async (file: File) => {
      if (!user) return

      setAvatarSaving(true)
      setAvatarError(null)
      try {
        const uploaded = await uploadToCloudinary(file)
        const saved = await setProfileImage(uploaded.public_id, uploaded.secure_url)
        const nextAvatarUrl = saved.url
        setAvatarUrl(nextAvatarUrl)
        setUser((prev) => (prev ? { ...prev, profile_image_url: nextAvatarUrl } : prev))
        localStorage.setItem(`avatar_${user.id}`, nextAvatarUrl)
        window.dispatchEvent(
          new CustomEvent("avatarUpdated", {
            detail: { userId: user.id, avatarUrl: nextAvatarUrl },
          }),
        )
      } catch (error) {
        const message = extractApiError(error, "No se pudo actualizar la foto de perfil")
        console.error(message, error)
        setAvatarError(message)
      } finally {
        setAvatarSaving(false)
      }
    },
    [user],
  )

  const handleSavedPostEdited = useCallback((updated: FeedPostOut) => {
    setEventSavedPosts((prev) => prev.map((post) => (post.id === updated.id ? { ...post, ...updated } : post)))
  }, [])

  const handleSavedPostUnsaved = useCallback((postId: number) => {
    setEventSavedPosts((prev) => prev.filter((post) => post.id !== postId))
  }, [])

  const content = useMemo(() => {
    if (loading || !user) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm text-gray-600">Cargando perfil...</p>
        </div>
      )
    }

    if (isMe) {
      return (
        <StudentProfileSelf
          user={user}
          avatarUrl={avatarUrl}
          eventSavedPosts={eventSavedPosts}
          followingOrganizations={followingOrganizations}
          allOrganizations={allOrganizations}
          onSaveProfile={handleSaveProfile}
          onFollowOrganization={handleFollowOrganization}
          onUnfollowOrganization={handleUnfollowOrganization}
          profileSaving={profileSaving}
          avatarSaving={avatarSaving}
          avatarError={avatarError}
          orgActionId={orgActionId}
          orgError={orgError}
          onChangeAvatar={handleChangeAvatar}
          onDismissAvatarError={handleDismissAvatarError}
          onDismissOrgError={handleDismissOrgError}
          onSavedPostEdited={handleSavedPostEdited}
          onSavedPostUnsaved={handleSavedPostUnsaved}
        />
      )
    }

    return (
      <StudentProfilePublic
        user={user}
        avatarUrl={avatarUrl}
        followingOrganizations={followingOrganizations}
      />
    )
  }, [
    loading,
    user,
    isMe,
    avatarUrl,
    eventSavedPosts,
    followingOrganizations,
    allOrganizations,
    handleSaveProfile,
    handleFollowOrganization,
    handleUnfollowOrganization,
    profileSaving,
    avatarSaving,
    avatarError,
    orgActionId,
    orgError,
    handleChangeAvatar,
    handleDismissAvatarError,
    handleDismissOrgError,
    handleSavedPostEdited,
    handleSavedPostUnsaved,
  ])

  return content
}

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  followUser,
  getMyFollowingOrganizations,
  getMyParticipatedEvents,
  getMyProfile,
  getOrganizations,
  getUserFollowingOrganizations,
  getUserPosts,
  getUserProfile,
  setProfileImage,
  unfollowUser,
  updateMyProfile,
  updateInterests,
  type OrganizationSummary,
  type UserParticipatedEvent,
} from "../api/users.api"
import { uploadToCloudinary } from "../api/cloudinary"
import { getMyRoles } from "../api/roles.api"
import { getSavedPosts } from "../api/saved-posts.api"
import PublicationWizard from "../components/PublicationWizard"
import { useRole, ROLE_ADMIN, ROLE_ROOT } from "../hooks/useRole"
import { StudentProfileSelf } from "../features/profile/views/StudentProfileSelf"
import { StudentProfilePublic } from "../features/profile/views/StudentProfilePublic"
import { mapPostOutToFeedPost, type PostOutRaw } from "../features/profile/lib/postMapper"
import { toProfileUserData } from "../features/profile/lib/profileUserData"
import type { ProfileUserData } from "../features/profile/views/types"
import type { ProfileSettingsPayload } from "../features/profile/components/ProfileSettingsModal"
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
  const [searchParams, setSearchParams] = useSearchParams()
  const openSettingsOnMount = searchParams.get("settings") === "1"
  const openCreateOnMount = searchParams.get("create") === "1"
  const { allowedTypes, canCreate, roleName } = useRole()
  const canAccessAdmin = roleName === ROLE_ADMIN || roleName === ROLE_ROOT
  const [showCreateWizard, setShowCreateWizard] = useState(false)
  const [isOwnProfile, setIsOwnProfile] = useState<boolean | null>(viewedUserId == null ? true : null)

  const [user, setUser] = useState<ProfileUserData | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [followingOrganizations, setFollowingOrganizations] = useState<OrganizationSummary[]>([])
  const [allOrganizations, setAllOrganizations] = useState<OrganizationSummary[]>([])
  const [eventSavedPosts, setEventSavedPosts] = useState<FeedPostOut[]>([])
  const [participatedEvents, setParticipatedEvents] = useState<UserParticipatedEvent[]>([])
  const [posts, setPosts] = useState<FeedPostOut[]>([])
  const [loading, setLoading] = useState(true)
  const [profileSaving, setProfileSaving] = useState(false)
  const [avatarSaving, setAvatarSaving] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [orgActionId, setOrgActionId] = useState<number | null>(null)
  const [orgError, setOrgError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setIsOwnProfile(viewedUserId == null ? true : null)
    setUser(null)
    setFollowingOrganizations([])
    setEventSavedPosts([])
    setParticipatedEvents([])
    setPosts([])

    ;(async () => {
      try {
        const myProfile = await getMyProfile()
        const viewingSelf =
          !viewedUserId || viewedUserId === myProfile.id
        if (mounted) setIsOwnProfile(viewingSelf)

        if (viewingSelf) {
          const [savedRaw, followingOrgs, orgs, roles, userPostsRaw, myEvents] = await Promise.all([
            getSavedPosts().catch(() => [] as PostOutRaw[]),
            getMyFollowingOrganizations().catch(() => []),
            getOrganizations().catch(() => []),
            getMyRoles().catch(() => []),
            getUserPosts(myProfile.id).catch(() => [] as PostOutRaw[]),
            getMyParticipatedEvents({ size: 50 }).catch(() => [] as UserParticipatedEvent[]),
          ])
          if (!mounted) return
          setUser(toProfileUserData({ ...myProfile, role_name: roles[0]?.name ?? myProfile.role_name ?? "alumno" }))
          setAvatarUrl(myProfile.profile_image_url ?? null)
          setFollowingOrganizations(followingOrgs)
          setAllOrganizations(orgs)
          setPosts(userPostsRaw.map((post: PostOutRaw) => mapPostOutToFeedPost(post)))
          const savedFeedPosts = (savedRaw as PostOutRaw[])
            .filter((post: PostOutRaw) => post.post_type === "event")
            .map((post: PostOutRaw) => mapPostOutToFeedPost(post, { is_saved: true }))
          setEventSavedPosts(savedFeedPosts as FeedPostOut[])
          setParticipatedEvents(myEvents)
          return
        }

        if (!viewedUserId) return
        const [publicProfile, followedOrgs] = await Promise.all([
          getUserProfile(viewedUserId),
          getUserFollowingOrganizations(viewedUserId).catch(() => []),
        ])
        if (!mounted) return
        setUser(toProfileUserData(publicProfile))
        setAvatarUrl(publicProfile.profile_image_url ?? null)
        setFollowingOrganizations(followedOrgs)
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [viewedUserId])

  const refreshPosts = useCallback(async () => {
    if (!user?.id) return
    const userPostsRaw = await getUserPosts(user.id).catch(() => [] as PostOutRaw[])
    setPosts(userPostsRaw.map((post: PostOutRaw) => mapPostOutToFeedPost(post)))
  }, [user?.id])

  useEffect(() => {
    if (!user?.id || isOwnProfile !== true) return
    const handlePublished = () => {
      void refreshPosts()
    }
    window.addEventListener("postPublished", handlePublished)
    return () => window.removeEventListener("postPublished", handlePublished)
  }, [user?.id, isOwnProfile, refreshPosts])

  useEffect(() => {
    if (openCreateOnMount && canCreate) {
      setShowCreateWizard(true)
      const next = new URLSearchParams(searchParams)
      next.delete("create")
      setSearchParams(next, { replace: true })
    }
  }, [openCreateOnMount, canCreate, searchParams, setSearchParams])

  const handleSaveProfile = useCallback(
    async (payload: ProfileSettingsPayload) => {
      setProfileSaving(true)
      try {
        const [updated] = await Promise.all([
          updateMyProfile({
            cycle: payload.cycle,
            availability: payload.availability,
            weekly_availability: payload.weekly_availability,
          }),
          updateInterests(payload.interests),
        ])
        setUser((prev) =>
          prev
            ? {
                ...prev,
                ...updated,
                interests: payload.interests,
                weekly_availability: payload.weekly_availability,
              } as ProfileUserData
            : prev,
        )
      } finally {
        setProfileSaving(false)
      }
    },
    [],
  )

  const handleSettingsOpened = useCallback(() => {
    if (!openSettingsOnMount) return
    const next = new URLSearchParams(searchParams)
    next.delete("settings")
    setSearchParams(next, { replace: true })
  }, [openSettingsOnMount, searchParams, setSearchParams])

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
        const org = allOrganizations.find((item) => item.id === orgId)
        if (org) {
          setFollowingOrganizations((prev) => {
            if (prev.some((o) => o.id === orgId)) return prev
            return [...prev, org]
          })
        }
      } catch (error) {
        const message = extractApiError(error, "No se pudo seguir la organización")
        console.error(message, error)
        setOrgError(message)
      } finally {
        setOrgActionId(null)
      }
    },
    [allOrganizations],
  )

  const handleUnfollowOrganization = useCallback(async (orgId: number) => {
    setOrgActionId(orgId)
    setOrgError(null)
    try {
      await unfollowUser(orgId)
      // Do not filter followingOrganizations here; deferred until modal closes
    } catch (error) {
      const message = extractApiError(error, "No se pudo dejar de seguir la organización")
      console.error(message, error)
      setOrgError(message)
    } finally {
      setOrgActionId(null)
    }
  }, [])

  const handleCloseOrganizationsManager = useCallback((unfollowedIds?: Set<number>) => {
    if (unfollowedIds && unfollowedIds.size > 0) {
      setFollowingOrganizations((prev) =>
        prev.filter((org) => !unfollowedIds.has(org.id))
      )
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
    setEventSavedPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }, [])

  const handleSavedPostUnsaved = useCallback((postId: number) => {
    setEventSavedPosts((prev) => prev.filter((p) => p.id !== postId))
  }, [])

  const handlePostEdited = useCallback((updated: FeedPostOut) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)))
  }, [])

  const handlePostDeleted = useCallback((postId: number) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }, [])

  const sharedProps = useMemo(() => {
    return {
      user: user!,
      avatarUrl,
      postsCount: 0,
      followersCount: 0,
      followingCount: 0,
    }
  }, [user, avatarUrl])

  const content = useMemo(() => {
    if (loading || !user || isOwnProfile === null) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm text-gray-600">Cargando perfil...</p>
        </div>
      )
    }

    if (isOwnProfile) {
      return (
        <StudentProfileSelf
          {...sharedProps}
          posts={posts}
          eventSavedPosts={eventSavedPosts}
          participatedEvents={participatedEvents}
          followingOrganizations={followingOrganizations}
          allOrganizations={allOrganizations}
          onSaveProfile={handleSaveProfile}
          openSettingsOnMount={openSettingsOnMount}
          onSettingsOpened={handleSettingsOpened}
          onFollowOrganization={handleFollowOrganization}
          onUnfollowOrganization={handleUnfollowOrganization}
          onCloseOrganizationsManager={handleCloseOrganizationsManager}
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
          onPostEdited={handlePostEdited}
          onPostDeleted={handlePostDeleted}
          onOpenCreate={canCreate ? () => setShowCreateWizard(true) : undefined}
          canAccessAdmin={canAccessAdmin}
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
    isOwnProfile,
    avatarUrl,
    eventSavedPosts,
    participatedEvents,
    posts,
    followingOrganizations,
    allOrganizations,
    handleSaveProfile,
    openSettingsOnMount,
    handleSettingsOpened,
    handleFollowOrganization,
    handleUnfollowOrganization,
    handleCloseOrganizationsManager,
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
    handlePostEdited,
    handlePostDeleted,
    canCreate,
    canAccessAdmin,
  ])

  return (
    <>
      {content}
      {isOwnProfile && (
        <PublicationWizard
          isOpen={showCreateWizard}
          onClose={() => setShowCreateWizard(false)}
          allowedTypes={allowedTypes}
        />
      )}
    </>
  )
}

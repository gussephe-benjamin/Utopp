import { useCallback, useEffect, useState } from "react"
import {
  getMyProfile,
  getUserProfile,
  getUserPosts,
  updateMyProfile,
  updateInterests,
  setProfileImage,
  followUser,
  unfollowUser,
  getMyFollowingOrganizations,
} from "../api/users.api"
import { getSavedPosts } from "../api/saved-posts.api"
import { getMyRoles } from "../api/roles.api"
import { ROLE_ESTUDIANTE } from "../hooks/useRole"
import { uploadToCloudinary } from "../api/cloudinary"
import { OrganizationProfileSelf } from "../features/profile/views/OrganizationProfileSelf"
import { OrganizationProfilePublic } from "../features/profile/views/OrganizationProfilePublic"
import { mapSavedPostToFeedPost, type SavedPostRaw } from "../features/profile/lib/postMapper"
import type { ProfileUserData } from "../features/profile/views/types"
import type { FeedPostOut } from "../types/post.types"

interface OrganizationProfilePageProps {
  viewedUserId?: number
}

export default function OrganizationProfilePage({ viewedUserId }: OrganizationProfilePageProps) {
  const [isOwnProfile, setIsOwnProfile] = useState<boolean | null>(viewedUserId == null ? true : null)
  const [user, setUser] = useState<ProfileUserData | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [posts, setPosts] = useState<FeedPostOut[]>([])
  const [savedPosts, setSavedPosts] = useState<FeedPostOut[]>([])
  const [loading, setLoading] = useState(true)

  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [viewerCanFollow, setViewerCanFollow] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followSaving, setFollowSaving] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [avatarSaving, setAvatarSaving] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setIsOwnProfile(viewedUserId == null ? true : null)
    setUser(null)
    setPosts([])
    setSavedPosts([])
    setIsFollowing(false)

    ;(async () => {
      try {
        let profile: ProfileUserData | null = null
        let savedRaw: SavedPostRaw[] = []

        const [myProfile, myRoles] = await Promise.all([
          getMyProfile().catch(() => null),
          getMyRoles().catch(() => []),
        ])
        if (myProfile && mounted) {
          setCurrentUserId(myProfile.id)
        }
        if (mounted) {
          setViewerCanFollow(myRoles.some((r) => r.name === ROLE_ESTUDIANTE))
        }

        const viewingSelf =
          !viewedUserId || (myProfile != null && viewedUserId === myProfile.id)
        if (mounted) setIsOwnProfile(viewingSelf)

        if (viewingSelf) {
          profile = myProfile
          savedRaw = await getSavedPosts().catch(() => [] as SavedPostRaw[])
        } else if (viewedUserId) {
          profile = await getUserProfile(viewedUserId)
          const myFollowing = await getMyFollowingOrganizations().catch(() => [])
          const following = myFollowing.some((org) => org.id === viewedUserId)
          setIsFollowing(following)
        }

        if (!mounted || !profile) return

        setUser(profile)
        setAvatarUrl(profile.profile_image_url ?? null)

        // Load organization posts
        const userPosts = await getUserPosts(profile.id).catch(() => [] as FeedPostOut[])
        setPosts(userPosts)

        // Load saved posts if it's the current user
        if (viewingSelf && savedRaw.length > 0) {
          const mappedSaved = savedRaw.map(mapSavedPostToFeedPost)
          setSavedPosts(mappedSaved)
        }
      } catch (err) {
        console.error("Error loading organization profile data:", err)
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [viewedUserId])

  const handleSaveProfile = useCallback(
    async (payload: {
      fullName: string
      description: string
      contacts: Record<string, string>
      interests: string[]
    }) => {
      if (!user) return
      setSavingProfile(true)
      try {
        // 1. Update name, description, and contacts in database
        const updatedUser = await updateMyProfile({
          full_name: payload.fullName,
          description: payload.description,
          contacts: payload.contacts
        })
        // 2. Update interests/categories in database
        await updateInterests(payload.interests)

        // 3. Update states
        setUser((prev) =>
          prev
            ? {
                ...prev,
                full_name: updatedUser.full_name ?? payload.fullName,
                description: updatedUser.description ?? payload.description,
                contacts: updatedUser.contacts ?? payload.contacts,
                interests: payload.interests,
                role_name: updatedUser.role_name ?? prev.role_name,
              }
            : prev
        )
      } catch (err) {
        console.error("Error saving organization profile:", err)
      } finally {
        setSavingProfile(false)
      }
    },
    [user]
  )

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
          })
        )
      } catch (error) {
        console.error("Error changing avatar:", error)
        setAvatarError("No se pudo actualizar la foto de perfil")
      } finally {
        setAvatarSaving(false)
      }
    },
    [user]
  )

  const handleFollowToggle = useCallback(async () => {
    if (!user) return
    setFollowSaving(true)
    try {
      if (isFollowing) {
        await unfollowUser(user.id)
        setIsFollowing(false)
        setUser((prev) => prev ? { ...prev, followers_count: Math.max(0, (prev.followers_count ?? 1) - 1) } : prev)
      } else {
        await followUser(user.id)
        setIsFollowing(true)
        setUser((prev) => prev ? { ...prev, followers_count: (prev.followers_count ?? 0) + 1 } : prev)
      }
    } catch (err) {
      console.error("Error toggling follow:", err)
    } finally {
      setFollowSaving(false)
    }
  }, [user, isFollowing])

  if (loading || !user || isOwnProfile === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-gray-600 animate-pulse">Cargando perfil de organización...</p>
      </div>
    )
  }

  const sharedProps = {
    user,
    avatarUrl,
    posts,
  }

  return isOwnProfile ? (
    <OrganizationProfileSelf
      {...sharedProps}
      savedPosts={savedPosts}
      savingProfile={savingProfile}
      avatarSaving={avatarSaving}
      avatarError={avatarError}
      onSaveProfile={handleSaveProfile}
      onChangeAvatar={handleChangeAvatar}
      onDismissAvatarError={() => setAvatarError(null)}
      onPostEdited={(updated) => {
        setPosts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)))
      }}
      onPostDeleted={(postId) => {
        setPosts((prev) => prev.filter((p) => p.id !== postId))
      }}
    />
  ) : (
    <OrganizationProfilePublic
      {...sharedProps}
      isFollowing={isFollowing}
      followSaving={followSaving}
      onFollowToggle={handleFollowToggle}
      currentUserId={currentUserId}
      showFollowButton={viewerCanFollow}
    />
  )
}

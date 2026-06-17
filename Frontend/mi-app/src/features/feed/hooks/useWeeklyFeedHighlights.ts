import { useCallback, useEffect, useState } from "react"
import { getFeed } from "../../../api/feed.api"
import {
  getMyFollowingOrganizations,
  getMyProfile,
  getOrganizations,
  followUser,
  unfollowUser,
  type OrganizationSummary,
} from "../../../api/users.api"
import { getMyRoles } from "../../../api/roles.api"
import { useAuth } from "../../../auth/useAuth"
import type { FeedPostOut } from "../../../types/post.types"

function sortOrganizations(orgs: OrganizationSummary[]): OrganizationSummary[] {
  return [...orgs].sort((a, b) => {
    if (b.followers_count !== a.followers_count) {
      return b.followers_count - a.followers_count
    }
    return (a.full_name ?? "").localeCompare(b.full_name ?? "", "es")
  })
}

function sortByDeadline(posts: FeedPostOut[]): FeedPostOut[] {
  return [...posts]
    .filter((p) => p.deadline_at)
    .sort(
      (a, b) =>
        new Date(a.deadline_at!).getTime() - new Date(b.deadline_at!).getTime(),
    )
}

export function useWeeklyFeedHighlights() {
  const { status } = useAuth()
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([])
  const [deadlinePosts, setDeadlinePosts] = useState<FeedPostOut[]>([])
  const [followedIds, setFollowedIds] = useState<Set<number>>(new Set())
  const [isStudent, setIsStudent] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [orgsLoading, setOrgsLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setOrgsLoading(true)
      setPostsLoading(true)
      try {
        const orgs = await getOrganizations({ page: 1, size: 100 })
        if (mounted) setOrganizations(sortOrganizations(orgs))

        const feed = await getFeed({ page: 1, size: 50 })
        const now = Date.now()
        const withDeadline = sortByDeadline(feed.items ?? [])

        const upcoming = withDeadline.filter((p) => new Date(p.deadline_at!).getTime() >= now)

        if (mounted) {
          if (upcoming.length > 0) {
            setDeadlinePosts(upcoming)
          } else {
            setDeadlinePosts(withDeadline.slice(0, 20))
          }
        }

        const token = status === "authenticated"
        if (token && mounted) {
          const [followed, roles, myProfile] = await Promise.all([
            getMyFollowingOrganizations().catch(() => []),
            getMyRoles().catch(() => []),
            getMyProfile().catch(() => null),
          ])
          setFollowedIds(new Set(followed.map((o) => o.id)))
          setIsStudent(roles.some((r) => r.name.toLowerCase() === "estudiante"))
          if (myProfile) setCurrentUserId(myProfile.id)
        }
      } catch (err) {
        console.error("Error loading weekly highlights:", err)
      } finally {
        if (mounted) {
          setOrgsLoading(false)
          setPostsLoading(false)
        }
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [status])

  const handleFollowToggle = useCallback(
    async (orgId: number) => {
      if (!isStudent) return
      setActionLoadingId(orgId)
      const isFollowing = followedIds.has(orgId)
      try {
        if (isFollowing) {
          await unfollowUser(orgId)
          setFollowedIds((prev) => {
            const next = new Set(prev)
            next.delete(orgId)
            return next
          })
          setOrganizations((prev) =>
            prev.map((org) =>
              org.id === orgId
                ? { ...org, followers_count: Math.max(0, org.followers_count - 1) }
                : org,
            ),
          )
        } else {
          await followUser(orgId)
          setFollowedIds((prev) => new Set(prev).add(orgId))
          setOrganizations((prev) =>
            prev.map((org) =>
              org.id === orgId
                ? { ...org, followers_count: org.followers_count + 1 }
                : org,
            ),
          )
        }
      } catch (err) {
        console.error("Error toggling follow:", err)
      } finally {
        setActionLoadingId(null)
      }
    },
    [followedIds, isStudent],
  )

  return {
    organizations,
    deadlinePosts,
    followedIds,
    isStudent,
    currentUserId,
    orgsLoading,
    postsLoading,
    actionLoadingId,
    handleFollowToggle,
  }
}

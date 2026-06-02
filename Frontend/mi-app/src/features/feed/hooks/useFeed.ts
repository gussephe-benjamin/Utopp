import { useCallback, useEffect, useRef, useState } from "react"
import { getFeed } from "../../../api/feed.api"
import { getMyProfile, type UserProfileResponse } from "../../../api/users.api"
import type { FeedPostOut, FeedResponse } from "../../../types/post.types"

type UseFeedOptions = {
  pageSize?: number
}

export function useFeed({ pageSize = 10 }: UseFeedOptions = {}) {
  const [posts, setPosts] = useState<FeedPostOut[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const loadingRef = useRef(false)
  const loaderRef = useRef<HTMLDivElement | null>(null)

  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [userName, setUserName] = useState<string>("Usuario")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [userCareer, setUserCareer] = useState<string | null>(null)
  const [userCycle, setUserCycle] = useState<number | null>(null)
  const [userPostsCount, setUserPostsCount] = useState<number>(0)
  const [userFollowersCount, setUserFollowersCount] = useState<number>(0)
  const [userFollowingCount, setUserFollowingCount] = useState<number>(0)
  const [userInterests, setUserInterests] = useState<string[]>([])

  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortOrder, setSortOrder] = useState<"urgency" | "recent">("urgency")

  useEffect(() => {
    getMyProfile()
      .then(
        (d: UserProfileResponse) => {
          setCurrentUserId(d.id)
          if (d.full_name) setUserName(d.full_name)
          if (d.profile_image_url) setAvatarUrl(d.profile_image_url)
          if (d.career) setUserCareer(d.career)
          if (d.cycle) setUserCycle(d.cycle)
          setUserInterests(Array.isArray(d.interests) ? d.interests : [])
          setUserPostsCount(d.posts_count ?? 0)
          setUserFollowersCount(d.followers_count ?? 0)
          setUserFollowingCount(d.following_count ?? 0)
        })
      .catch(() => { return })
  }, [setCurrentUserId, setUserName, setAvatarUrl, setUserCareer, setUserCycle, setUserInterests, setUserPostsCount, setUserFollowersCount, setUserFollowingCount])

  useEffect(() => {
    setPosts([])
    setPage(1)
    setHasMore(true)
  }, [statusFilter, selectedTags, sortOrder])

  const fetchPage = useCallback(
    async (pageNum: number) => {
      if (loadingRef.current) return
      loadingRef.current = true
      setLoading(true)
      try {
        const data: FeedResponse = await getFeed({
          page: pageNum,
          size: pageSize,
          time_status: statusFilter,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          sort: sortOrder === "recent" ? "recent" : undefined,
        })
        setPosts((prev) => (pageNum === 1 ? data.items : [...prev, ...data.items]))
        setHasMore(data.has_next)
        if (data.has_next) setPage(pageNum + 1)
      } catch (err) {
        console.error("Error cargando feed:", err)
      } finally {
        loadingRef.current = false
        setLoading(false)
      }
    },
    [pageSize, selectedTags, sortOrder, statusFilter],
  )

  useEffect(() => {
    const handlePublished = () => {
      setPage(1)
      setHasMore(true)
      fetchPage(1)
    }
    window.addEventListener("postPublished", handlePublished)
    return () => window.removeEventListener("postPublished", handlePublished)
  }, [fetchPage])

  useEffect(() => {
    const el = loaderRef.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
        fetchPage(page)
      }
    })
    io.observe(el)
    return () => io.disconnect()
  }, [fetchPage, hasMore, page])

  return {
    posts,
    setPosts,
    page,
    hasMore,
    loading,
    loaderRef,
    currentUserId,
    userName,
    avatarUrl,
    userCareer,
    userCycle,
    userPostsCount,
    userFollowersCount,
    userFollowingCount,
    userInterests,
    setUserInterests,
    statusFilter,
    setStatusFilter,
    selectedTags,
    setSelectedTags,
    sortOrder,
    setSortOrder,
  }
}

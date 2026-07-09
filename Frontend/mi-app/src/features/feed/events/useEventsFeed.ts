import { useCallback, useEffect, useRef, useState } from "react"
import { getFeed } from "../../../api/feed.api"
import { getMyProfile, type UserProfileResponse } from "../../../api/users.api"
import type { FeedPostOut, FeedResponse } from "../../../types/post.types"

type UseEventsFeedOptions = {
  /** Tamaño de página; en grid conviene múltiplo de columnas. */
  pageSize?: number
}

/**
 * Feed de eventos (post_type === "event") con scroll infinito.
 * Reutiliza getFeed con el filtro `type: "event"` y ordena por urgencia.
 */
export function useEventsFeed({ pageSize = 12 }: UseEventsFeedOptions = {}) {
  const [events, setEvents] = useState<FeedPostOut[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const loadingRef = useRef(false)
  const loaderRef = useRef<HTMLDivElement | null>(null)

  const [currentUserId, setCurrentUserId] = useState<number | null>(null)

  useEffect(() => {
    getMyProfile()
      .then((d: UserProfileResponse) => setCurrentUserId(d.id))
      .catch(() => {
        return
      })
  }, [])

  const fetchPage = useCallback(
    async (pageNum: number) => {
      if (loadingRef.current) return
      loadingRef.current = true
      setLoading(true)
      try {
        const data: FeedResponse = await getFeed({
          page: pageNum,
          size: pageSize,
          type: "event",
        })
        setEvents((prev) => (pageNum === 1 ? data.items : [...prev, ...data.items]))
        setHasMore(data.has_next)
        if (data.has_next) setPage(pageNum + 1)
      } catch (err) {
        console.error("Error cargando eventos:", err)
      } finally {
        loadingRef.current = false
        setLoading(false)
      }
    },
    [pageSize],
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
    events,
    setEvents,
    loading,
    hasMore,
    loaderRef,
    currentUserId,
  }
}

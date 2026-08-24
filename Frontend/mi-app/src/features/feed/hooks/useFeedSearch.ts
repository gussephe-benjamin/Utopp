import { useEffect, useState } from "react"
import { getFeed } from "../../../api/feed.api"
import { getMyProfile } from "../../../api/users.api"
import type { FeedPostOut } from "../../../types/post.types"
import { useResetOnChange } from "../../../hooks/useResetOnChange"

type FeedSearchMode = "posts" | "events"

/**
 * Carga publicaciones o eventos para la barra de búsqueda del navbar.
 */
export function useFeedSearch(mode: FeedSearchMode) {
  const [items, setItems] = useState<FeedPostOut[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)

  useResetOnChange([mode], () => setLoading(true))

  useEffect(() => {
    let cancelled = false

    const feedParams =
      mode === "events"
        ? { type: "event", page: 1, size: 50 }
        : { exclude_type: "event", page: 1, size: 50 }

    Promise.all([getFeed(feedParams), getMyProfile().catch(() => null)])
      .then(([feed, profile]) => {
        if (cancelled) return
        setItems(feed.items ?? [])
        setCurrentUserId(profile?.id ?? null)
      })
      .catch((err) => {
        console.error("Error cargando búsqueda del feed:", err)
        if (!cancelled) setItems([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [mode])

  return { items, loading, currentUserId }
}

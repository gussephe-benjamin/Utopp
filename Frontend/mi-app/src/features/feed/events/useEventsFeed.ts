import { useCallback, useEffect, useRef, useState } from "react"
import { listEvents, type SharedEvent, type SharedEventsPage } from "../../../api/events.api"

type UseEventsFeedOptions = {
  /** Tamaño de página; en grid conviene múltiplo de columnas. */
  pageSize?: number
}

/**
 * Eventos de la tabla compartida con Utopp Formulario, con scroll infinito.
 * Trae los eventos de TODOS los creadores, no solo los del usuario actual.
 */
export function useEventsFeed({ pageSize = 12 }: UseEventsFeedOptions = {}) {
  const [events, setEvents] = useState<SharedEvent[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const loadingRef = useRef(false)
  const loaderRef = useRef<HTMLDivElement | null>(null)

  const fetchPage = useCallback(
    async (pageNum: number) => {
      if (loadingRef.current) return
      loadingRef.current = true
      setLoading(true)
      try {
        const data: SharedEventsPage = await listEvents({ page: pageNum, size: pageSize })
        setEvents((prev) => (pageNum === 1 ? data.items : [...prev, ...data.items]))
        setHasMore(data.has_next)
        if (data.has_next) setPage(pageNum + 1)
      } catch (err) {
        console.error("Error cargando eventos:", err)
        setHasMore(false)
      } finally {
        loadingRef.current = false
        setLoading(false)
      }
    },
    [pageSize],
  )

  const refresh = useCallback(() => {
    setPage(1)
    setHasMore(true)
    fetchPage(1)
  }, [fetchPage])

  useEffect(() => {
    const handleCreated = () => refresh()
    window.addEventListener("eventCreated", handleCreated)
    return () => window.removeEventListener("eventCreated", handleCreated)
  }, [refresh])

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
    refresh,
  }
}

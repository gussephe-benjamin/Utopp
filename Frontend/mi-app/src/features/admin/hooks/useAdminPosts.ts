import { useCallback, useEffect, useState } from "react"
import { getAdminPosts, type AdminPostSummary } from "../../../api/posts.api"

const DEFAULT_PAGE_SIZE = 20

function parseApiError(error: unknown, fallback: string): string {
  const maybeAxios = error as { response?: { status?: number; data?: { detail?: string } }; message?: string }
  if (maybeAxios.response?.status === 403) {
    return "No tienes permisos para ver todas las publicaciones."
  }
  return maybeAxios.response?.data?.detail ?? maybeAxios.message ?? fallback
}

export function useAdminPosts(initialPage = 1, pageSize = DEFAULT_PAGE_SIZE) {
  const [items, setItems] = useState<AdminPostSummary[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(initialPage)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrev, setHasPrev] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPage = useCallback(
    async (nextPage: number) => {
      setLoading(true)
      setError(null)
      try {
        const data = await getAdminPosts({ page: nextPage, size: pageSize })
        setItems(data.items)
        setTotal(data.total)
        setPage(data.page)
        setHasNext(data.has_next)
        setHasPrev(data.has_prev)
      } catch (err) {
        setItems([])
        setTotal(0)
        setError(parseApiError(err, "No se pudieron cargar las publicaciones."))
      } finally {
        setLoading(false)
      }
    },
    [pageSize],
  )

  useEffect(() => {
    void loadPage(initialPage)
  }, [initialPage, loadPage])

  const nextPage = useCallback(() => {
    if (hasNext) void loadPage(page + 1)
  }, [hasNext, loadPage, page])

  const prevPage = useCallback(() => {
    if (hasPrev) void loadPage(page - 1)
  }, [hasPrev, loadPage, page])

  return {
    items,
    total,
    page,
    hasNext,
    hasPrev,
    loading,
    error,
    loadPage,
    nextPage,
    prevPage,
  }
}

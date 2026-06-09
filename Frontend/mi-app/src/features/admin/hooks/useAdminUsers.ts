import { useCallback, useEffect, useState } from "react"
import { getAdminUsers, type AdminUserListItem } from "../../../api/admin.api"

const DEFAULT_PAGE_SIZE = 20

function parseApiError(error: unknown, fallback: string): string {
  const maybeAxios = error as {
    response?: { status?: number; data?: { detail?: string } }
    message?: string
  }
  if (maybeAxios.response?.status === 403) {
    return "No tienes permisos para administrar usuarios."
  }
  return maybeAxios.response?.data?.detail ?? maybeAxios.message ?? fallback
}

/**
 * Hook de listado administrativo de usuarios con paginación, filtro de rol y búsqueda.
 * `role` puede ser un nombre de rol o "all"; `q` es el término de búsqueda.
 */
export function useAdminUsers(role: string = "all", q: string = "", pageSize = DEFAULT_PAGE_SIZE) {
  const [items, setItems] = useState<AdminUserListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrev, setHasPrev] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPage = useCallback(
    async (nextPage: number) => {
      setLoading(true)
      setError(null)
      try {
        const data = await getAdminUsers({
          role,
          q: q.trim() || undefined,
          page: nextPage,
          size: pageSize,
        })
        setItems(data.items)
        setTotal(data.total)
        setPage(data.page)
        setHasNext(data.has_next)
        setHasPrev(data.has_prev)
      } catch (err) {
        setItems([])
        setTotal(0)
        setError(parseApiError(err, "No se pudieron cargar los usuarios."))
      } finally {
        setLoading(false)
      }
    },
    [role, q, pageSize],
  )

  useEffect(() => {
    void loadPage(1)
  }, [loadPage])

  const nextPage = useCallback(() => {
    if (hasNext) void loadPage(page + 1)
  }, [hasNext, loadPage, page])

  const prevPage = useCallback(() => {
    if (hasPrev) void loadPage(page - 1)
  }, [hasPrev, loadPage, page])

  const reload = useCallback(() => {
    void loadPage(page)
  }, [loadPage, page])

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
    reload,
  }
}

import { ChevronLeft, ChevronRight } from "lucide-react"
import { AppLink } from "../shared/navigation/AppLink"
import { useAdminPosts } from "../features/admin/hooks/useAdminPosts"

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
}

function truncate(text: string, max = 120): string {
  if (text.length <= max) return text
  return `${text.slice(0, max).trim()}…`
}

export default function AdminPostsPage() {
  const { items, total, page, hasNext, hasPrev, loading, error, nextPage, prevPage } = useAdminPosts()

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Publicaciones del sistema</h1>
          <p className="mt-1 text-sm text-gray-500">
            Publicaciones totales: <span className="font-semibold text-gray-800">{total}</span>
          </p>
        </div>
        <AppLink
          to="/app/inicio"
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Volver al inicio
        </AppLink>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500">
          Cargando publicaciones…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-700">{error}</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500">
          No hay publicaciones registradas.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/80 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Creador</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Título</th>
                  <th className="px-4 py-3 font-semibold">Descripción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((post) => (
                  <tr key={post.id} className="align-top hover:bg-gray-50/60">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{post.id}</td>
                    <td className="px-4 py-3 text-gray-900">
                      {post.creator_name?.trim() || `Usuario #${post.user_id}`}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{post.creator_email}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">{formatDate(post.created_at)}</td>
                    <td className="px-4 py-3 text-gray-900">{post.title?.trim() || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{truncate(post.description)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && items.length > 0 ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-gray-500">Página {page}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevPage}
              disabled={!hasPrev}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>
            <button
              type="button"
              onClick={nextPage}
              disabled={!hasNext}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gray-50"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

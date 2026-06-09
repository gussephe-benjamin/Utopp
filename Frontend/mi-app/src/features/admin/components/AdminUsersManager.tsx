import { useState } from "react"
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { useAdminUsers } from "../hooks/useAdminUsers"
import { deleteAdminUser, type AdminUserListItem } from "../../../api/admin.api"
import { resolveAvatarUrl } from "../../../shared/lib/cloudinaryUrl"
import { ConfirmModal } from "../../profile/components/ConfirmModal"
import { TW_UTOPP_GRADIENT_R } from "../../../shared/constants/brand"
import { AdminUserFormModal } from "./AdminUserFormModal"

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso))
}

type Props = {
  /** Filtro de rol para el listado (nombre de rol exacto). */
  roleFilter: string
  /** Rol a asignar al crear nuevos registros. */
  createRoleName: string
  title: string
  subtitle: string
  /** Etiqueta singular (p.ej. "alumno"). */
  entityLabel: string
  showAcademicFields?: boolean
  showDescription?: boolean
}

export function AdminUsersManager({
  roleFilter,
  createRoleName,
  title,
  subtitle,
  entityLabel,
  showAcademicFields = false,
  showDescription = false,
}: Props) {
  const [searchInput, setSearchInput] = useState("")
  const [query, setQuery] = useState("")
  const { items, total, page, hasNext, hasPrev, loading, error, nextPage, prevPage, reload } =
    useAdminUsers(roleFilter, query)

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<AdminUserListItem | null>(null)
  const [toDelete, setToDelete] = useState<AdminUserListItem | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function confirmDelete() {
    if (!toDelete) return
    setDeleteError(null)
    try {
      await deleteAdminUser(toDelete.id)
      setToDelete(null)
      reload()
    } catch (err) {
      const maybeAxios = err as { response?: { data?: { detail?: string } }; message?: string }
      setDeleteError(maybeAxios.response?.data?.detail ?? maybeAxios.message ?? "No se pudo eliminar.")
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {subtitle} · <span className="font-semibold text-gray-800">{total}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white ${TW_UTOPP_GRADIENT_R} shadow-sm hover:brightness-105`}
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          Crear {entityLabel}
        </button>
      </div>

      {/* Buscador */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setQuery(searchInput)
        }}
        className="mb-4 flex items-center gap-2"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nombre o correo…"
            className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Buscar
        </button>
      </form>

      {loading ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500">
          Cargando…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-700">{error}</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500">
          No se encontraron registros.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/80 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Usuario</th>
                  <th className="px-4 py-3 font-semibold">Correo</th>
                  {showAcademicFields && <th className="px-4 py-3 font-semibold">Carrera</th>}
                  <th className="px-4 py-3 font-semibold">Posts</th>
                  <th className="px-4 py-3 font-semibold">Registro</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {u.profile_image_url ? (
                          <img
                            src={resolveAvatarUrl(u.profile_image_url) ?? u.profile_image_url}
                            alt={u.full_name ?? u.email}
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                            {(u.full_name ?? u.email).charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-gray-900">
                          {u.full_name?.trim() || `Usuario #${u.id}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    {showAcademicFields && (
                      <td className="px-4 py-3 text-gray-600">{u.career?.trim() || "—"}</td>
                    )}
                    <td className="px-4 py-3 text-gray-600">{u.posts_count}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditing(u)}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-violet-600"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError(null)
                            setToDelete(u)
                          }}
                          className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-gray-500">Página {page}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevPage}
              disabled={!hasPrev}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>
            <button
              type="button"
              onClick={nextPage}
              disabled={!hasNext}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {showCreate && (
        <AdminUserFormModal
          mode="create"
          createRoleName={createRoleName}
          entityLabel={entityLabel}
          showAcademicFields={showAcademicFields}
          showDescription={showDescription}
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false)
            reload()
          }}
        />
      )}

      {editing && (
        <AdminUserFormModal
          mode="edit"
          user={editing}
          entityLabel={entityLabel}
          showAcademicFields={showAcademicFields}
          showDescription={showDescription}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            reload()
          }}
        />
      )}

      {toDelete && (
        <ConfirmModal
          danger
          title={`Eliminar ${entityLabel}`}
          message={
            deleteError
              ? deleteError
              : `¿Seguro que deseas eliminar a "${toDelete.full_name?.trim() || toDelete.email}"? Esta acción borra también sus publicaciones y no se puede deshacer.`
          }
          onCancel={() => setToDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  )
}

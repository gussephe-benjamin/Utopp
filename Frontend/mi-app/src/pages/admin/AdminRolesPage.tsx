import { useEffect, useState } from "react"
import { Search } from "lucide-react"
import { useAdminUsers } from "../../features/admin/hooks/useAdminUsers"
import { assignRole, listRoles } from "../../api/roles.api"
import { resolveAvatarUrl } from "../../shared/lib/cloudinaryUrl"

interface RoleOption {
  id: number
  identifier: number
  name: string
  description?: string | null
}

export default function AdminRolesPage() {
  const [searchInput, setSearchInput] = useState("")
  const [query, setQuery] = useState("")
  const { items, loading, error, reload } = useAdminUsers("all", query)

  const [roles, setRoles] = useState<RoleOption[]>([])
  const [savingId, setSavingId] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{ id: number; text: string; ok: boolean } | null>(null)

  useEffect(() => {
    listRoles()
      .then((data) => setRoles(data as RoleOption[]))
      .catch(() => setRoles([]))
  }, [])

  async function handleChangeRole(userId: number, identifier: number) {
    setSavingId(userId)
    setFeedback(null)
    try {
      await assignRole(userId, identifier)
      setFeedback({ id: userId, text: "Rol actualizado", ok: true })
      reload()
    } catch (err) {
      const maybeAxios = err as { response?: { data?: { detail?: string } }; message?: string }
      setFeedback({
        id: userId,
        text: maybeAxios.response?.data?.detail ?? maybeAxios.message ?? "No se pudo actualizar el rol.",
        ok: false,
      })
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de roles</h1>
        <p className="mt-1 text-sm text-gray-500">
          Busca un usuario y asígnale un rol. Cada usuario tiene un único rol activo.
        </p>
      </div>

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
            placeholder="Buscar usuario por nombre o correo…"
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
          No se encontraron usuarios.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((u) => {
            const currentRole = u.roles[0] ?? "sin rol"
            return (
              <div
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {u.profile_image_url ? (
                    <img
                      src={resolveAvatarUrl(u.profile_image_url) ?? u.profile_image_url}
                      alt={u.full_name ?? u.email}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                      {(u.full_name ?? u.email).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">
                      {u.full_name?.trim() || `Usuario #${u.id}`}
                    </p>
                    <p className="truncate text-sm text-gray-500">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                    {currentRole}
                  </span>
                  <select
                    value=""
                    disabled={savingId === u.id || roles.length === 0}
                    onChange={(e) => {
                      const identifier = Number(e.target.value)
                      if (identifier) void handleChangeRole(u.id, identifier)
                    }}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 disabled:opacity-50"
                  >
                    <option value="">Cambiar rol…</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.identifier}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {feedback?.id === u.id && (
                  <p className={`w-full text-right text-xs ${feedback.ok ? "text-green-600" : "text-red-600"}`}>
                    {feedback.text}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

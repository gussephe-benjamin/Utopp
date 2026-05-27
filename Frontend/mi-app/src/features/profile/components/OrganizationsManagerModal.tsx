import { useEffect, useMemo, useState } from "react"
import { X, Plus, Check, Search } from "lucide-react"
import type { OrganizationSummary } from "../../../api/users.api"

interface OrganizationsManagerModalProps {
  followingOrganizations: OrganizationSummary[]
  allOrganizations: OrganizationSummary[]
  currentUserId: number
  orgActionId: number | null
  onFollow: (orgId: number) => Promise<void>
  onUnfollow: (orgId: number) => Promise<void>
  onClose: () => void
}

/**
 * Modal centrado con fondo blureado para gestionar organizaciones del alumno.
 * Muestra en una sola vista las organizaciones seguidas y las disponibles, con
 * acciones de seguir / dejar de seguir y un buscador rápido.
 */
export function OrganizationsManagerModal({
  followingOrganizations,
  allOrganizations,
  currentUserId,
  orgActionId,
  onFollow,
  onUnfollow,
  onClose,
}: OrganizationsManagerModalProps) {
  const [query, setQuery] = useState("")

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const followedIds = useMemo(
    () => new Set(followingOrganizations.map((org) => org.id)),
    [followingOrganizations],
  )

  const normalizedQuery = query.trim().toLowerCase()
  const reachedFollowLimit = followingOrganizations.length >= 5

  const filteredFollowing = useMemo(() => {
    if (!normalizedQuery) return followingOrganizations
    return followingOrganizations.filter((org) =>
      (org.full_name ?? "").toLowerCase().includes(normalizedQuery),
    )
  }, [followingOrganizations, normalizedQuery])

  const filteredAvailable = useMemo(() => {
    const candidates = allOrganizations.filter(
      (org) => !followedIds.has(org.id) && org.id !== currentUserId,
    )
    if (!normalizedQuery) return candidates
    return candidates.filter((org) =>
      (org.full_name ?? "").toLowerCase().includes(normalizedQuery),
    )
  }, [allOrganizations, followedIds, currentUserId, normalizedQuery])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Gestionar organizaciones</h2>
            <p className="text-xs text-gray-500">
              Sigue o deja de seguir organizaciones. Los cambios se reflejan al instante.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="border-b border-gray-100 px-6 py-3">
          <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar organización..."
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <section>
            <div className="mb-2 flex items-baseline justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wide text-violet-700">
                Mis organizaciones
              </h3>
              <span className="text-xs font-semibold text-gray-400">
                {followingOrganizations.length} seguidas
              </span>
            </div>
            {filteredFollowing.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-3 text-xs text-gray-500">
                {followingOrganizations.length === 0
                  ? "Aún no sigues ninguna organización."
                  : "No hay resultados para tu búsqueda."}
              </p>
            ) : (
              <ul className="grid gap-2">
                {filteredFollowing.map((org) => (
                  <li
                    key={`followed-${org.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-violet-100 bg-violet-50/40 px-3 py-2"
                  >
                    <OrgRow org={org} />
                    <button
                      type="button"
                      disabled={orgActionId === org.id}
                      onClick={() => onUnfollow(org.id)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-violet-200 px-3 py-1 text-xs font-semibold text-violet-700 hover:bg-white disabled:opacity-50"
                    >
                      <Check className="h-3 w-3" />
                      Siguiendo
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-6">
            <div className="mb-2 flex items-baseline justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-700">
                Quizá te interesen
              </h3>
              <span className="text-xs font-semibold text-gray-400">
                {filteredAvailable.length} disponibles
              </span>
            </div>
            {filteredAvailable.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-3 text-xs text-gray-500">
                {allOrganizations.length === 0
                  ? "Aún no hay organizaciones registradas en la plataforma."
                  : normalizedQuery
                    ? "No hay resultados para tu búsqueda."
                    : "Ya sigues todas las organizaciones disponibles."}
              </p>
            ) : (
              <ul className="grid gap-2">
                {filteredAvailable.map((org) => (
                  <li
                    key={`available-${org.id}`}
                    className="flex min-w-0 flex-col gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <OrgRow org={org} />
                    <button
                      type="button"
                      disabled={orgActionId === org.id || reachedFollowLimit}
                      onClick={() => onFollow(org.id)}
                      className="inline-flex w-full items-center justify-center gap-1 rounded-full bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-gray-300 sm:w-auto sm:shrink-0 sm:justify-start sm:py-1"
                    >
                      <Plus className="h-3 w-3" />
                      {reachedFollowLimit ? "Límite alcanzado" : "Seguir"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {reachedFollowLimit ? (
              <p className="mt-2 text-xs text-amber-700">
                Alcanzaste el máximo de 5 organizaciones seguidas. Deja de seguir una para agregar otra.
              </p>
            ) : null}
          </section>
        </div>

        <footer className="border-t border-gray-100 px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="ml-auto block rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  )
}

function OrgRow({ org }: { org: OrganizationSummary }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100">
        {org.profile_image_url ? (
          <img
            src={org.profile_image_url}
            alt={org.full_name ?? "org"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-bold text-violet-400">
            {(org.full_name ?? "O").charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-900">
          {org.full_name ?? `Org ${org.id}`}
        </p>
        <p className="text-xs text-gray-500">{org.followers_count} seguidores</p>
      </div>
    </div>
  )
}

import { useEffect, useMemo, useState } from "react"
import { X, Plus, Check, Search } from "lucide-react"
import type { OrganizationSummary } from "../../../api/users.api"
import { motion } from "framer-motion"

interface OrganizationsManagerModalProps {
  followingOrganizations: OrganizationSummary[]
  allOrganizations: OrganizationSummary[]
  currentUserId: number
  orgActionId: number | null
  onFollow: (orgId: number) => Promise<void>
  onUnfollow: (orgId: number) => Promise<void>
  onClose: (unfollowedIds?: Set<number>) => void
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
  const [unfollowedIds, setUnfollowedIds] = useState<Set<number>>(new Set())

  const handleClose = () => {
    onClose(unfollowedIds)
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose, unfollowedIds])

  const normalizedQuery = query.trim().toLowerCase()

  const filteredFollowing = useMemo(() => {
    if (!normalizedQuery) return followingOrganizations
    return followingOrganizations.filter((org) =>
      (org.full_name ?? "").toLowerCase().includes(normalizedQuery),
    )
  }, [followingOrganizations, normalizedQuery])

  const discoverOrganizations = useMemo(() => {
    const followingIds = new Set(followingOrganizations.map((o) => o.id))
    return allOrganizations.filter((org) => !followingIds.has(org.id))
  }, [allOrganizations, followingOrganizations])

  const filteredDiscover = useMemo(() => {
    if (!normalizedQuery) return discoverOrganizations
    return discoverOrganizations.filter((org) =>
      (org.full_name ?? "").toLowerCase().includes(normalizedQuery),
    )
  }, [discoverOrganizations, normalizedQuery])

  const handleUnfollowClick = async (orgId: number) => {
    try {
      await onUnfollow(orgId)
      setUnfollowedIds((prev) => {
        const next = new Set(prev)
        next.add(orgId)
        return next
      })
    } catch (e) {
      console.error(e)
    }
  }

  const handleFollowClick = async (orgId: number) => {
    try {
      await onFollow(orgId)
      setUnfollowedIds((prev) => {
        const next = new Set(prev)
        next.delete(orgId)
        return next
      })
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      />

      {/* Modal Container */}
      <motion.div
        className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl z-10"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.4 }}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Gestionar organizaciones</h2>
            <p className="text-xs text-gray-500">
              Sigue o deja de seguir organizaciones. Los cambios se confirman al cerrar el modal.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
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
          {/* Mis Organizaciones */}
          <section>
            <div className="mb-2 flex items-baseline justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wide text-violet-700">
                Mis organizaciones
              </h3>
              <span className="text-xs font-semibold text-gray-400">
                {followingOrganizations.filter((o) => !unfollowedIds.has(o.id)).length} seguidas
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
                {filteredFollowing.map((org) => {
                  const isUnfollowed = unfollowedIds.has(org.id)
                  return (
                    <li
                      key={`followed-${org.id}`}
                      className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-colors ${
                        isUnfollowed
                          ? "border-gray-100 bg-gray-50/50 opacity-60"
                          : "border-violet-100 bg-violet-50/40"
                      }`}
                    >
                      <OrgRow org={org} />
                      {isUnfollowed ? (
                        <button
                          type="button"
                          disabled={orgActionId === org.id}
                          onClick={() => handleFollowClick(org.id)}
                          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-violet-600 bg-violet-600 px-3 py-1 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50 shadow-sm"
                        >
                          <Plus className="h-3 w-3" />
                          Seguir
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={orgActionId === org.id}
                          onClick={() => handleUnfollowClick(org.id)}
                          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-violet-200 px-3 py-1 text-xs font-semibold text-violet-700 hover:bg-white disabled:opacity-50"
                        >
                          <Check className="h-3 w-3" />
                          Siguiendo
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {/* Descubrir Organizaciones */}
          <section className="mt-6 border-t border-gray-100 pt-6">
            <div className="mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">
                Descubrir organizaciones
              </h3>
            </div>
            {filteredDiscover.length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                No hay más organizaciones para descubrir por el momento.
              </p>
            ) : (
              <ul className="grid gap-2">
                {filteredDiscover.map((org) => (
                  <li
                    key={`discover-${org.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2"
                  >
                    <OrgRow org={org} />
                    <button
                      type="button"
                      disabled={orgActionId === org.id}
                      onClick={() => onFollow(org.id)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-violet-600 bg-violet-600 px-3 py-1 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50 shadow-sm"
                    >
                      <Plus className="h-3 w-3" />
                      Seguir
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <footer className="border-t border-gray-100 px-6 py-3">
          <button
            type="button"
            onClick={handleClose}
            className="ml-auto block rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cerrar
          </button>
        </footer>
      </motion.div>
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
        <p className="text-xs text-gray-500">
          {org.followers_count ?? 0} {org.followers_count === 1 ? "seguidor" : "seguidores"}
        </p>
      </div>
    </div>
  )
}

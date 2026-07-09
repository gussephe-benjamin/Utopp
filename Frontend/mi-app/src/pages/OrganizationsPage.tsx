import { useState } from "react"
import { Search, Users, X } from "lucide-react"
import { useWeeklyFeedHighlights } from "../features/feed/hooks/useWeeklyFeedHighlights"
import { ProfileLink } from "../features/profile/components/ProfileLink"
import { TW_UTOPP_GRADIENT_R } from "../shared/constants/brand"
import { resolveOrgImageUrl } from "../shared/lib/cloudinaryUrl"

/**
 * Listado de organizaciones (antes pestaña Explorar → Organizaciones).
 * Accesible desde la barra inferior móvil en `/app/organizaciones`.
 */
export default function OrganizationsPage() {
  const {
    organizations,
    followedIds,
    isStudent,
    currentUserId,
    orgsLoading,
    actionLoadingId,
    handleFollowToggle,
  } = useWeeklyFeedHighlights()

  const [searchQuery, setSearchQuery] = useState("")

  const filteredOrgs = organizations.filter((org) => {
    const name = (org.full_name ?? "").toLowerCase()
    return name.includes(searchQuery.toLowerCase())
  })

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-8 pt-4 md:pt-6">
      <h1 className="font-display mb-4 text-xl font-extrabold text-gray-900 md:text-2xl">
        Organizaciones
      </h1>

      <div className="relative mb-6">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-gray-400" />
        </span>
        <input
          type="text"
          placeholder="Buscar organizaciones..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 shadow-sm transition-all focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
        {searchQuery ? (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {orgsLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex animate-pulse items-center gap-3 rounded-xl border border-gray-100 bg-white p-4"
            >
              <div className="h-10 w-10 rounded-full bg-gray-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 rounded bg-gray-100" />
                <div className="h-2 w-1/2 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredOrgs.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          <div className="mb-3 flex justify-center">
            <Users className="h-10 w-10 text-gray-300" />
          </div>
          {searchQuery
            ? "No se encontraron organizaciones que coincidan con la búsqueda."
            : "No hay organizaciones registradas."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filteredOrgs.map((org) => {
            const initial = (org.full_name ?? "O").charAt(0).toUpperCase()
            const isFollowing = followedIds.has(org.id)
            const postText =
              org.posts_count === 1 ? "1 publicación" : `${org.posts_count ?? 0} publicaciones`

            return (
              <div
                key={org.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-violet-100"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <ProfileLink
                    userId={org.id}
                    currentUserId={currentUserId}
                    className="shrink-0 transition-transform hover:scale-105"
                  >
                    {org.profile_image_url ? (
                      <img
                        src={resolveOrgImageUrl(org.profile_image_url) ?? org.profile_image_url}
                        alt={org.full_name ?? "Organización"}
                        className="h-10 w-10 rounded-full border border-gray-100 object-cover shadow-sm"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-violet-100 bg-violet-50 text-sm font-bold text-violet-600">
                        {initial}
                      </div>
                    )}
                  </ProfileLink>
                  <div className="min-w-0">
                    <ProfileLink
                      userId={org.id}
                      currentUserId={currentUserId}
                      className="block truncate text-xs font-bold text-gray-900 hover:text-[#2563EB]"
                    >
                      {org.full_name}
                    </ProfileLink>
                    <p className="mt-0.5 text-[9px] text-gray-400">{postText}</p>
                  </div>
                </div>

                {isStudent ? (
                  <button
                    type="button"
                    onClick={() => handleFollowToggle(org.id)}
                    disabled={actionLoadingId === org.id}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-[9px] font-bold shadow-sm transition-all active:scale-95 ${
                      isFollowing
                        ? "border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                        : `${TW_UTOPP_GRADIENT_R} text-white hover:brightness-105`
                    }`}
                  >
                    {actionLoadingId === org.id ? "..." : isFollowing ? "Siguiendo" : "Seguir"}
                  </button>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

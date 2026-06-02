import { useState } from "react"
import { Calendar as CalendarIcon, Search, Users, X } from "lucide-react"
import { useWeeklyFeedHighlights } from "../features/feed/hooks/useWeeklyFeedHighlights"
import { formatDeadlineBadge } from "../features/feed/lib/weeklyHighlightUtils"
import { ProfileLink } from "../features/profile/components/ProfileLink"
import { TW_UTOPP_GRADIENT_R } from "../shared/constants/brand"

export default function ExplorePage() {
  const {
    organizations,
    deadlinePosts,
    followedIds,
    isStudent,
    currentUserId,
    orgsLoading,
    postsLoading,
    actionLoadingId,
    handleFollowToggle,
  } = useWeeklyFeedHighlights()

  const [activeTab, setActiveTab] = useState<"events" | "organizations">("events")
  const [searchQuery, setSearchQuery] = useState("")

  // Filtros locales por buscador
  const filteredEvents = deadlinePosts.filter((post) => {
    const title = (post.title ?? "").toLowerCase()
    const org = (post.user_name ?? "").toLowerCase()
    const query = searchQuery.toLowerCase()
    return title.includes(query) || org.includes(query)
  })

  const filteredOrgs = organizations.filter((org) => {
    const name = (org.full_name ?? "").toLowerCase()
    const query = searchQuery.toLowerCase()
    return name.includes(query)
  })

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">


      {/* Buscador */}
      <div className="relative mb-6">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-gray-400" />
        </span>
        <input
          type="text"
          placeholder={activeTab === "events" ? "Buscar eventos por título u organización..." : "Buscar organizaciones..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 shadow-sm transition-all focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex rounded-xl border border-gray-150 bg-white p-1 shadow-sm">
        <button
          onClick={() => {
            setActiveTab("events")
            setSearchQuery("")
          }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
            activeTab === "events"
              ? "bg-[#f3efff] text-violet-700"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
          }`}
        >
          <CalendarIcon className="h-4 w-4" />
          Eventos ({deadlinePosts.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("organizations")
            setSearchQuery("")
          }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
            activeTab === "organizations"
              ? "bg-[#f3efff] text-violet-700"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
          }`}
        >
          <Users className="h-4 w-4" />
          Organizaciones ({organizations.length})
        </button>
      </div>

      {/* Contenido según pestaña */}
      <div className="space-y-4">
        {activeTab === "events" ? (
          postsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex animate-pulse items-center gap-3 rounded-xl border border-gray-100 bg-white p-4">
                  <div className="h-12 w-12 rounded-full bg-gray-100" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 w-1/2 rounded bg-gray-100" />
                    <div className="h-3 w-1/4 rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="rounded-xl border border-gray-150 bg-white p-8 text-center text-sm text-gray-500">
              {searchQuery ? "No se encontraron eventos que coincidan con la búsqueda." : "No hay eventos próximos registrados."}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredEvents.map((post) => {
                if (!post.deadline_at) return null
                const { dayName, dayNumber } = formatDeadlineBadge(post.deadline_at)
                const title = post.title?.trim() || "Sin título"

                return (
                  <div
                    key={post.id}
                    className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:border-violet-100 transition-all"
                  >
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-fuchsia-500 text-white shadow-sm">
                      <span className="mt-0.5 text-[10px] font-bold uppercase leading-none">{dayName}</span>
                      <span className="text-sm font-bold leading-tight">{dayNumber}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <ProfileLink
                        userId={post.user_id}
                        currentUserId={currentUserId}
                        postId={post.id}
                        className="w-full text-left text-xs font-bold leading-snug text-gray-800 hover:text-[#2563EB] break-words"
                      >
                        {title}
                      </ProfileLink>
                      <p className="mt-1 text-[10px] text-gray-400">
                        Organizado por: <span className="font-semibold text-gray-500">{post.user_name || "Organización"}</span>
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        ) : orgsLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex animate-pulse items-center gap-3 rounded-xl border border-gray-100 bg-white p-4">
                <div className="h-10 w-10 rounded-full bg-gray-100" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-3/4 rounded bg-gray-100" />
                  <div className="h-2 w-1/2 rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredOrgs.length === 0 ? (
          <div className="rounded-xl border border-gray-150 bg-white p-8 text-center text-sm text-gray-500">
            {searchQuery ? "No se encontraron organizaciones que coincidan con la búsqueda." : "No hay organizaciones registradas."}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filteredOrgs.map((org) => {
              const initial = (org.full_name ?? "O").charAt(0).toUpperCase()
              const isFollowing = followedIds.has(org.id)
              const postText = org.posts_count === 1 ? "1 publicación" : `${org.posts_count ?? 0} publicaciones`

              return (
                <div
                  key={org.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:border-violet-100 transition-all"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <ProfileLink
                      userId={org.id}
                      currentUserId={currentUserId}
                      className="shrink-0 transition-transform hover:scale-105"
                    >
                      {org.profile_image_url ? (
                        <img
                          src={org.profile_image_url}
                          alt={org.full_name ?? "Organización"}
                          className="h-10 w-10 rounded-full border border-gray-100 object-cover shadow-sm"
                        />
                      ) : (
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold bg-violet-50 text-violet-600 border border-violet-100`}
                        >
                          {initial}
                        </div>
                      )}
                    </ProfileLink>
                    <div className="min-w-0">
                      <ProfileLink
                        userId={org.id}
                        currentUserId={currentUserId}
                        className="truncate text-xs font-bold text-gray-900 hover:text-[#2563EB] block"
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
    </div>
  )
}

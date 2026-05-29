import { useWeeklyFeedHighlights } from "../hooks/useWeeklyFeedHighlights"
import { getOrgAvatarStyle, formatDeadlineBadge } from "../lib/weeklyHighlightUtils"
import { useNavigate } from "react-router-dom"
import { Trophy, Calendar as CalendarIcon } from "lucide-react"
import { profilePath } from "../../profile/lib/profileNavigation"
import { TW_UTOPP_GRADIENT_R } from "../../../shared/constants/brand"
import { WEEKLY_ORGS_TITLE } from "../constants/weeklyHighlights"

/** Carrusel solo en modo teléfono (&lt;768px): orgs y publicaciones por vencimiento. */
export function FeedWeeklyHighlightsCarousel() {
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

  const navigate = useNavigate()

  return (
    <div className="space-y-4 pb-3 md:hidden">
      <section>
        <div className="mb-2 flex items-center gap-2 px-4">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <h3 className="text-sm font-bold text-gray-800">{WEEKLY_ORGS_TITLE}</h3>
        </div>
        {orgsLoading ? (
          <div className="flex gap-5 overflow-hidden px-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex w-[76px] shrink-0 flex-col items-center gap-2">
                <div className="h-16 w-16 animate-pulse rounded-full bg-gray-200" />
                <div className="h-2.5 w-14 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : organizations.length === 0 ? (
          <p className="px-4 text-center text-xs text-gray-400">No hay organizaciones</p>
        ) : (
          <div className="flex gap-5 overflow-x-auto px-4 pb-1 snap-x snap-mandatory no-scrollbar">
            {organizations.map((org) => {
              const initial = (org.full_name ?? "O").charAt(0).toUpperCase()
              const isFollowing = followedIds.has(org.id)
              return (
                <div
                  key={org.id}
                  className="flex w-[76px] shrink-0 snap-start flex-col items-center gap-1.5 text-center"
                >
                  <button
                    type="button"
                    onClick={() => navigate(profilePath(org.id, currentUserId))}
                    className="rounded-full ring-2 ring-violet-100 transition-transform active:scale-95"
                    aria-label={`Ver perfil de ${org.full_name ?? "organización"}`}
                  >
                    {org.profile_image_url ? (
                      <img
                        src={org.profile_image_url}
                        alt=""
                        className="h-16 w-16 rounded-full border border-gray-100 object-cover shadow-sm"
                      />
                    ) : (
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-full border border-gray-100 text-lg font-bold shadow-sm ${getOrgAvatarStyle(org.id)}`}
                      >
                        {initial}
                      </div>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(profilePath(org.id, currentUserId))}
                    className="line-clamp-2 w-full text-[10px] font-bold leading-tight text-gray-900 hover:text-[#2563EB]"
                    title={org.full_name ?? undefined}
                  >
                    {org.full_name}
                  </button>
                  {isStudent ? (
                    <button
                      type="button"
                      onClick={() => handleFollowToggle(org.id)}
                      disabled={actionLoadingId === org.id}
                      className={`mt-0.5 rounded-full px-2.5 py-1 text-[9px] font-bold ${
                        isFollowing
                          ? "border border-gray-200 text-gray-500"
                          : `${TW_UTOPP_GRADIENT_R} text-white shadow-sm`
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
      </section>

      {/* Esta semana — carrusel por vencimiento */}
      <section>
        <div className="mb-2 flex items-center gap-2 px-4">
          <CalendarIcon className="h-4 w-4 text-violet-600" />
          <h3 className="text-sm font-bold text-gray-800">Esta semana</h3>
        </div>
        {postsLoading ? (
          <div className="flex gap-3 overflow-hidden px-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-[88px] w-[min(260px,78vw)] shrink-0 animate-pulse rounded-xl border border-gray-100 bg-white"
              />
            ))}
          </div>
        ) : deadlinePosts.length === 0 ? (
          <p className="px-4 text-center text-xs text-gray-400">No hay eventos próximos</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto px-4 pb-1 snap-x snap-mandatory no-scrollbar">
            {deadlinePosts.map((post) => {
              if (!post.deadline_at) return null
              const { dayName, dayNumber } = formatDeadlineBadge(post.deadline_at)
              const title = post.title?.trim() || "Sin título"
              return (
                <article
                  key={post.id}
                  className="w-[min(260px,78vw)] shrink-0 snap-start rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-fuchsia-500 text-white text-center shadow-sm">
                      <span className="text-[9px] font-bold uppercase leading-none">{dayName}</span>
                      <span className="text-sm font-bold leading-tight">{dayNumber}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => {
                          const base = profilePath(post.user_id, currentUserId)
                          navigate(`${base}?postId=${post.id}`)
                        }}
                        className="line-clamp-2 text-left text-xs font-bold text-gray-800 hover:text-[#2563EB]"
                      >
                        {title}
                      </button>
                      <p className="mt-1 truncate text-[10px] text-gray-400">
                        {post.user_name || "Organización"}
                      </p>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

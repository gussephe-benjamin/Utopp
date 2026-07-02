import { useState } from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { ProfileLink } from "../../profile/components/ProfileLink"
import type { FeedPostOut } from "../../../types/post.types"
import { formatDeadlineBadge } from "../lib/weeklyHighlightUtils"
import { EventsCalendarModal } from "./EventsCalendarModal"

type WeeklyEventsWidgetProps = {
  posts: FeedPostOut[]
  loading: boolean
  currentUserId: number | null
  compact?: boolean
}

export function WeeklyEventsWidget({
  posts,
  loading,
  currentUserId,
  compact = false,
}: WeeklyEventsWidgetProps) {
  const [showAllModal, setShowAllModal] = useState(false)

  const maxVisible = 3
  const visiblePosts = posts.slice(0, maxVisible)
  const hasMore = posts.length > maxVisible

  return (
    <div className={compact ? "h-full" : "rounded-xl border border-gray-100 bg-white p-4 shadow-sm"}>
      <div className={`flex items-center gap-2 ${compact ? "mb-3 px-1" : "mb-4"}`}>
        <CalendarIcon className="h-4 w-4 text-violet-600" />
        <h4 className="text-sm font-bold text-gray-800">Eventos próximos</h4>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex animate-pulse items-start gap-3">
              <div className="h-12 w-12 shrink-0 rounded-full bg-gray-100" />
              <div className="h-3 flex-1 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <p className="py-4 text-center text-xs text-gray-400">No hay publicaciones con fecha de vencimiento</p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className={`flex flex-col gap-3 ${compact ? "max-h-[220px] overflow-y-auto no-scrollbar" : ""}`}>
            {visiblePosts.map((post) => {
              if (!post.deadline_at) return null
              const { dayName, dayNumber } = formatDeadlineBadge(post.deadline_at)
              const title = post.title?.trim() || "Sin título"

              return (
                <div key={post.id} className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-fuchsia-500 text-white shadow-sm">
                    <span className="mt-0.5 text-[10px] font-bold uppercase leading-none">{dayName}</span>
                    <span className="text-sm font-bold leading-tight">{dayNumber}</span>
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <ProfileLink
                      userId={post.user_id}
                      currentUserId={currentUserId}
                      postId={post.id}
                      className="w-full line-clamp-2 text-left text-xs font-bold leading-snug text-gray-800 hover:text-[#2563EB] break-words"
                      title={title}
                    >
                      {title}
                    </ProfileLink>
                    <p className="mt-0.5 truncate text-[10px] text-gray-400">
                      Organizado por: {post.user_name || "Organización"}
                    </p>
                    {post.registration_url && (
                      <a
                        href={post.registration_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-[10px] font-bold text-violet-600 hover:text-violet-800"
                      >
                        Inscribirse →
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {hasMore && (
            <button
              onClick={() => setShowAllModal(true)}
              className="mt-1 w-full rounded-lg bg-gray-50 py-2 text-center text-xs font-semibold text-violet-600 hover:bg-violet-50 hover:text-violet-700 transition-colors"
            >
              Ver todos ({posts.length})
            </button>
          )}
        </div>
      )}

      {/* Modal calendario (vista mensual + panel del día) */}
      <EventsCalendarModal
        open={showAllModal}
        onClose={() => setShowAllModal(false)}
        posts={posts}
        currentUserId={currentUserId}
      />
    </div>
  )
}

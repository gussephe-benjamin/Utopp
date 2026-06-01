import { useState } from "react"
import ReactDOM from "react-dom"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { ProfileLink } from "../../profile/components/ProfileLink"
import type { FeedPostOut } from "../../../types/post.types"
import { formatDeadlineBadge } from "../lib/weeklyHighlightUtils"

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

      {/* Modal / Popup Portal */}
      {typeof document !== "undefined" &&
        ReactDOM.createPortal(
          <AnimatePresence>
            {showAllModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAllModal(false)}
                className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex max-h-[80vh] w-full max-w-md flex-col rounded-2xl bg-white shadow-2xl overflow-hidden"
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4.5 w-4.5 text-violet-600" />
                      <h3 className="text-sm font-bold text-gray-900">Todos los eventos próximos</h3>
                    </div>
                    <button
                      onClick={() => setShowAllModal(false)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
                    {posts.map((post) => {
                      if (!post.deadline_at) return null
                      const { dayName, dayNumber } = formatDeadlineBadge(post.deadline_at)
                      const title = post.title?.trim() || "Sin título"

                      return (
                        <div key={post.id} className="flex items-start gap-4 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                          <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-fuchsia-500 text-white shadow-sm">
                            <span className="mt-0.5 text-[10px] font-bold uppercase leading-none">{dayName}</span>
                            <span className="text-sm font-bold leading-tight">{dayNumber}</span>
                          </div>
                          <div className="min-w-0 flex-1 pt-0.5">
                            <ProfileLink
                              userId={post.user_id}
                              currentUserId={currentUserId}
                              postId={post.id}
                              onClick={() => setShowAllModal(false)}
                              className="w-full text-left text-xs font-bold leading-snug text-gray-800 hover:text-[#2563EB] break-words"
                            >
                              {title}
                            </ProfileLink>
                            <p className="mt-1 text-[10px] text-gray-400">
                              Organizado por: {post.user_name || "Organización"}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  )
}

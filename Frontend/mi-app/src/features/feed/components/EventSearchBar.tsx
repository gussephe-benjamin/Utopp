import { useEffect, useMemo, useRef, useState } from "react"
import { Search, X } from "lucide-react"
import { useWeeklyFeedHighlights } from "../hooks/useWeeklyFeedHighlights"
import { filterEventsByQuery } from "../lib/eventSearch"
import { formatDeadlineBadge } from "../lib/weeklyHighlightUtils"
import { ProfileLink } from "../../profile/components/ProfileLink"

type EventSearchBarProps = {
  /** Versión compacta para la barra superior en laptop/desktop. */
  compact?: boolean
  className?: string
}

export function EventSearchBar({ compact = false, className = "" }: EventSearchBarProps) {
  const { deadlinePosts, postsLoading, currentUserId } = useWeeklyFeedHighlights()
  const [searchQuery, setSearchQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const filteredEvents = useMemo(
    () => filterEventsByQuery(deadlinePosts, searchQuery).slice(0, compact ? 6 : 50),
    [deadlinePosts, searchQuery, compact],
  )

  useEffect(() => {
    if (!compact) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    return () => document.removeEventListener("mousedown", handlePointerDown)
  }, [compact])

  const showDropdown = compact && isOpen && searchQuery.trim().length > 0

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className={`${compact ? "h-4 w-4" : "h-4 w-4"} text-gray-400`} />
        </span>
        <input
          type="text"
          role="searchbox"
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value)
            if (compact) setIsOpen(true)
          }}
          onFocus={() => {
            if (compact && searchQuery.trim()) setIsOpen(true)
          }}
          placeholder="Buscar eventos por título u organización..."
          className={`w-full border border-gray-200 bg-white text-sm text-gray-900 shadow-sm transition-all focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 ${
            compact
              ? "h-10 rounded-full py-2 pl-10 pr-10"
              : "rounded-xl py-2.5 pl-10 pr-10"
          }`}
          aria-label="Buscar eventos"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("")
              setIsOpen(false)
            }}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[70] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
          {postsLoading ? (
            <p className="px-4 py-3 text-sm text-gray-500">Buscando eventos...</p>
          ) : filteredEvents.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-500">No se encontraron eventos.</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1">
              {filteredEvents.map((post) => {
                if (!post.deadline_at) return null
                const { dayName, dayNumber } = formatDeadlineBadge(post.deadline_at)
                const title = post.title?.trim() || "Sin título"

                return (
                  <li key={post.id}>
                    <ProfileLink
                      userId={post.user_id}
                      currentUserId={currentUserId}
                      postId={post.id}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-violet-50"
                    >
                      <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-fuchsia-500 text-white shadow-sm">
                        <span className="mt-0.5 text-[9px] font-bold uppercase leading-none">{dayName}</span>
                        <span className="text-xs font-bold leading-tight">{dayNumber}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">{title}</p>
                        <p className="truncate text-xs text-gray-500">
                          {post.user_name || "Organización"}
                        </p>
                      </div>
                    </ProfileLink>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

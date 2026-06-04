import { useEffect, useState } from "react"
import { Inbox, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { PostCard } from "../features/feed/components/PostCard"
import { LeftSidebar } from "../features/feed/components/LeftSidebar"
import { RightSidebar } from "../features/feed/components/RightSidebar"
import { FeedWelcomeBanner } from "../features/feed/components/FeedWelcomeBanner"
import { FeedHorizontalFilters } from "../features/feed/components/FeedHorizontalFilters"
import { FeedWeeklyHighlightsCarousel } from "../features/feed/components/FeedWeeklyHighlightsCarousel"
import { FeedTabletHighlights } from "../features/feed/components/FeedTabletHighlights"
import { FeedFiltersPanel } from "../features/feed/components/FeedFiltersPanel"
import { useFeed } from "../features/feed/hooks/useFeed"
import { updateInterests } from "../api/users.api"
import {
  getClampedRightPopoverStyle,
  type MenuPopoverAnchor,
} from "../features/dashboard/popoverAnchor"
import type { FeedViewProps } from "../features/feed/types"
import { formatShortDisplayName } from "../features/feed/lib/display"

import ExplorePage from "./ExplorePage"

const FILTER_POPOVER_FALLBACK: MenuPopoverAnchor = { top: 64, right: 12, minWidth: 40 }

export default function StudentFeedPage({
  filtersSheetOpen = false,
  onCloseFiltersSheet = () => {},
  filterPopoverAnchor = null,
  onCategoryFiltersActiveChange,
}: FeedViewProps) {
  const [interestsSaving, setInterestsSaving] = useState(false)
  const [interestsError, setInterestsError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"posts" | "explore">("posts")

  const {
    posts,
    setPosts,
    loading,
    loaderRef,
    currentUserId,
    userName,
    avatarUrl,
    userCareer,
    userCycle,
    userPostsCount,
    userFollowersCount,
    userFollowingCount,
    userInterests,
    setUserInterests,
    statusFilter,
    setStatusFilter,
    selectedTags,
    setSelectedTags,
    sortOrder,
    setSortOrder,
  } = useFeed({ pageSize: 10 })

  useEffect(() => {
    onCategoryFiltersActiveChange?.(selectedTags.length > 0)
  }, [onCategoryFiltersActiveChange, selectedTags])

  const bannerUserName = formatShortDisplayName(userName)

  const handleSaveInterests = async (nextInterests: string[]) => {
    setInterestsSaving(true)
    setInterestsError(null)
    try {
      await updateInterests(nextInterests)
      setUserInterests(nextInterests)
    } catch (error) {
      const maybeAxios = error as { response?: { data?: { detail?: string } }; message?: string }
      setInterestsError(
        maybeAxios.response?.data?.detail ??
          maybeAxios.message ??
          "No se pudieron actualizar los intereses.",
      )
    } finally {
      setInterestsSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen justify-center bg-gray-50" style={{ overflowAnchor: "none" }}>
      <div className="mx-auto flex w-full max-w-[1320px] items-start justify-center gap-6 px-0 pb-8 pt-0 md:px-4 md:pt-6">
        <LeftSidebar
          userName={userName}
          avatarUrl={avatarUrl}
          career={userCareer}
          cycle={userCycle}
          postsCount={userPostsCount}
          followersCount={userFollowersCount}
          followingCount={userFollowingCount}
          interests={userInterests}
          interestsSaving={interestsSaving}
          interestsError={interestsError}
          onSaveInterests={handleSaveInterests}
        />

        <div className="w-full min-w-0 max-w-[700px] flex-1 space-y-0 md:space-y-5">
          <div className="mb-3 block w-full rounded-b-[32px] bg-gradient-to-b from-[#2f55f6] via-[#614bf8] to-[#803ef8] px-6 pb-7 pt-7 text-white shadow-lg md:hidden">
            <h1 className="text-2xl font-bold tracking-tight">Hola, {bannerUserName}</h1>
            <p className="mt-0.5 text-xs font-medium text-white/80">Bienvenido a Utopp</p>
          </div>

          {/* Selector de pestañas para cambiar entre feed y explorador (solo móvil) */}
          <div className="px-4 md:px-0 pt-2 md:pt-0 md:hidden">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab("posts")}
                className={`flex-1 pb-3 px-6 text-sm font-bold border-b-2 transition-all ${
                  activeTab === "posts"
                    ? "border-violet-600 text-violet-600"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                Publicaciones
              </button>
              <button
                onClick={() => setActiveTab("explore")}
                className={`flex-1 pb-3 px-6 text-sm font-bold border-b-2 transition-all ${
                  activeTab === "explore"
                    ? "border-violet-600 text-violet-600"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                Explorar
              </button>
            </div>
          </div>

          {activeTab === "explore" && (
            <div className="md:hidden">
              <ExplorePage />
            </div>
          )}

          <div className={activeTab === "explore" ? "hidden md:block space-y-0 md:space-y-5" : "space-y-0 md:space-y-5"}>
            <div className="block px-4 pb-2 pt-3 md:pt-0 md:hidden">
              <FeedHorizontalFilters
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                selectedTags={selectedTags}
                setSelectedTags={setSelectedTags}
              />
            </div>
            <FeedWeeklyHighlightsCarousel />
            <FeedTabletHighlights userName={bannerUserName} />

            <div className="hidden lg:block">
              <FeedWelcomeBanner userName={bannerUserName} />
            </div>

            <div className="w-full space-y-4 px-4 pt-2 md:px-0 md:pt-0 lg:pt-4">
              {(() => {
                const lastPinnedIdx = posts.reduce((acc, p, i) => (p.is_pinned ? i : acc), -1)
                return posts.map((post, i) => (
                  <div key={post.id} className="mb-4 last:mb-0">
                    <div className="flex justify-center">
                      <PostCard
                        post={post}
                        currentUserId={currentUserId}
                        onEdited={(updated) =>
                          setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
                        }
                      />
                    </div>
                    {i === lastPinnedIdx && posts.length > lastPinnedIdx + 1 && (
                      <div className="flex items-center gap-3 py-1">
                        <div className="h-px flex-1 bg-cyan-200" />
                        <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-widest text-cyan-600">
                          - Publicaciones generales -
                        </span>
                        <div className="h-px flex-1 bg-cyan-200" />
                      </div>
                    )}
                  </div>
                ))
              })()}
            </div>

            {!loading && posts.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                <div className="mb-3 flex justify-center">
                  <Inbox className="h-12 w-12 text-gray-300" />
                </div>
                <p className="font-medium text-gray-700">Aun no hay publicaciones</p>
                <p className="mt-1 text-sm text-gray-400">Se el primero en crear una publicacion</p>
              </div>
            ) : null}

            {loading ? <div className="py-4 text-center text-sm text-gray-400">Cargando mas...</div> : null}
            <div ref={loaderRef} />
          </div>
        </div>

        <RightSidebar showTrending={false} />
      </div>

      <AnimatePresence>
        {filtersSheetOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[65] bg-black/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => onCloseFiltersSheet()}
              aria-hidden
            />
            <motion.div
              className="fixed z-[66] flex min-w-0 flex-col overflow-hidden rounded-xl border border-gray-200/90 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
              style={getClampedRightPopoverStyle(filterPopoverAnchor ?? FILTER_POPOVER_FALLBACK, {
                maxWidth: 480,
                margin: 8,
              })}
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ type: "spring", duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="feed-filters-title"
            >
              <div className="shrink-0 flex items-center justify-between gap-3 border-b border-gray-100 px-3 py-2.5">
                <h2 id="feed-filters-title" className="text-base font-bold text-gray-900">
                  Filtros
                </h2>
                <button
                  type="button"
                  onClick={() => onCloseFiltersSheet()}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50"
                  aria-label="Cerrar filtros"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="min-h-0 w-full min-w-0 space-y-3 overflow-y-auto bg-violet-50/30 p-3 pb-5">
                <FeedFiltersPanel
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  sortOrder={sortOrder}
                  setSortOrder={setSortOrder}
                  selectedTags={selectedTags}
                  setSelectedTags={setSelectedTags}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

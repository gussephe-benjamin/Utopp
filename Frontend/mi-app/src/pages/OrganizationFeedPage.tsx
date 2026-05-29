import { useEffect } from "react"
import { Building2, Inbox, X } from "lucide-react"
import { PostCard } from "../features/feed/components/PostCard"
import { RightSidebar } from "../features/feed/components/RightSidebar"
import { FeedFiltersPanel } from "../features/feed/components/FeedFiltersPanel"
import { useFeed } from "../features/feed/hooks/useFeed"
import { FeedQuickCreate } from "../features/feed/components/FeedQuickCreate"
import {
  getClampedRightPopoverStyle,
  type MenuPopoverAnchor,
} from "../features/dashboard/popoverAnchor"
import type { FeedViewProps } from "../features/feed/types"

const FILTER_POPOVER_FALLBACK: MenuPopoverAnchor = { top: 64, right: 12, minWidth: 40 }

/**
 * Base de feed para organizaciones.
 * Por ahora comparte la misma fuente de publicaciones y filtros, pero queda
 * desacoplada de StudentFeedPage para futuras iteraciones específicas.
 */
export default function OrganizationFeedPage({
  filtersSheetOpen = false,
  onCloseFiltersSheet = () => {},
  filterPopoverAnchor = null,
  onCategoryFiltersActiveChange,
  onOpenCreate = () => {},
}: FeedViewProps) {
  const {
    posts,
    setPosts,
    loading,
    loaderRef,
    currentUserId,
    avatarUrl,
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto flex w-full max-w-[1320px] gap-6 px-4 pb-8 pt-0 md:pt-6">
        <div className="w-full min-w-0 max-w-[720px] flex-1 space-y-4">
          <section className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-violet-100 p-2 text-violet-700">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Feed de organizaciones</h1>
                <p className="text-sm text-gray-600">
                  Base separada para organizaciones. En esta iteración mantiene el feed completo.
                </p>
              </div>
            </div>
          </section>

          <FeedQuickCreate avatarUrl={avatarUrl} onOpenWizard={onOpenCreate} />

          <section className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="flex justify-center">
                <PostCard
                  post={post}
                  currentUserId={currentUserId}
                  onEdited={(updated) =>
                    setPosts((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
                  }
                />
              </div>
            ))}
          </section>

          {!loading && posts.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
              <div className="mb-3 flex justify-center">
                <Inbox className="h-12 w-12 text-gray-300" />
              </div>
              <p className="font-medium text-gray-700">Aun no hay publicaciones</p>
            </div>
          ) : null}

          {loading ? <div className="py-4 text-center text-sm text-gray-400">Cargando mas...</div> : null}
          <div ref={loaderRef} />
        </div>

        <RightSidebar />
      </div>

      {filtersSheetOpen && (
        <>
          <div
            className="fixed inset-0 z-[65] bg-black/10"
            onClick={() => onCloseFiltersSheet()}
            aria-hidden
          />
          <div
            className="fixed z-[66] flex min-w-0 flex-col overflow-hidden rounded-xl border border-gray-200/90 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] animate-in fade-in zoom-in-95 slide-in-from-top-1 duration-150"
            style={getClampedRightPopoverStyle(filterPopoverAnchor ?? FILTER_POPOVER_FALLBACK, {
              maxWidth: 480,
              margin: 8,
            })}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="org-feed-filters-title"
          >
            <div className="shrink-0 flex items-center justify-between gap-3 border-b border-gray-100 px-3 py-2.5">
              <h2 id="org-feed-filters-title" className="text-base font-bold text-gray-900">
                Filtros
              </h2>
              <button
                type="button"
                onClick={() => onCloseFiltersSheet()}
                className="h-8 w-8 shrink-0 rounded-lg bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
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
          </div>
        </>
      )}
    </div>
  )
}

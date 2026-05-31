import { useWeeklyFeedHighlights } from "../hooks/useWeeklyFeedHighlights"
import { FeedWelcomeBanner } from "./FeedWelcomeBanner"
import { WeeklyOrgsWidget } from "./WeeklyOrgsWidget"
import { WeeklyEventsWidget } from "./WeeklyEventsWidget"

type FeedTabletHighlightsProps = {
  userName: string
}

/** Tablet (768px–1023px): banner, widgets del sidebar y separador antes del feed. */
export function FeedTabletHighlights({ userName }: FeedTabletHighlightsProps) {
  const highlights = useWeeklyFeedHighlights()

  return (
    <div className="hidden space-y-5 px-4 pb-1 md:block lg:hidden">
      <FeedWelcomeBanner userName={userName} />

      <div className="grid grid-cols-2 gap-5">
        <WeeklyOrgsWidget
          organizations={highlights.organizations}
          loading={highlights.orgsLoading}
          followedIds={highlights.followedIds}
          isStudent={highlights.isStudent}
          currentUserId={highlights.currentUserId}
          actionLoadingId={highlights.actionLoadingId}
          onFollowToggle={highlights.handleFollowToggle}
        />
        <WeeklyEventsWidget
          posts={highlights.deadlinePosts}
          loading={highlights.postsLoading}
          currentUserId={highlights.currentUserId}
        />
      </div>

      <div className="flex items-center gap-4 pt-1" aria-hidden>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-200/80 to-violet-300/40" />
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-400/90">
          Publicaciones
        </span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-violet-200/80 to-violet-300/40" />
      </div>
    </div>
  )
}

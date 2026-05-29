import { useWeeklyFeedHighlights } from "../hooks/useWeeklyFeedHighlights"
import { WeeklyOrgsWidget } from "./WeeklyOrgsWidget"
import { WeeklyEventsWidget } from "./WeeklyEventsWidget"

/** Tablet (768px–1023px): widgets del sidebar derecho a ancho completo, antes del feed. */
export function FeedTabletHighlights() {
  const highlights = useWeeklyFeedHighlights()

  return (
    <div className="hidden space-y-4 px-4 pb-2 md:block lg:hidden">
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
  )
}

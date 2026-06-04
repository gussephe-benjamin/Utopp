import { Flame } from "lucide-react"
import { useWeeklyFeedHighlights } from "../hooks/useWeeklyFeedHighlights"
import { WeeklyOrgsWidget } from "./WeeklyOrgsWidget"
import { WeeklyEventsWidget } from "./WeeklyEventsWidget"

type RightSidebarProps = {
  showTrending?: boolean
}

export function RightSidebar({ showTrending = true }: RightSidebarProps) {
  const highlights = useWeeklyFeedHighlights()

  return (
    <aside className="sticky top-[80px] hidden h-[calc(100vh-80px)] w-80 flex-col gap-4 overflow-y-auto pb-6 no-scrollbar lg:flex">
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

      {showTrending ? (
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 fill-current text-orange-500" />
              <h4 className="text-sm font-bold text-gray-800">En tendencia esta semana</h4>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { tag: "#Hackathon", count: "324 posts" },
              { tag: "#Voluntariado", count: "198 posts" },
              { tag: "#Intercambio", count: "156 posts" },
              { tag: "#DemoDay", count: "112 posts" },
              { tag: "#IA", count: "98 posts" },
            ].map((item) => (
              <div key={item.tag} className="flex items-center justify-between text-xs font-semibold">
                <span className="cursor-pointer text-[#2563EB] hover:underline">{item.tag}</span>
                <span className="font-normal text-gray-400">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </aside>
  )
}

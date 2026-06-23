import type { FeedPostOut } from "../../../types/post.types";
import { SUBTYPE_LABELS } from "../../../types/post.types";
import { formatDeadlineBadge } from "../../feed/lib/weeklyHighlightUtils";

type AuthLatestEventsProps = {
  events: FeedPostOut[];
  loading: boolean;
};

function EventSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
      <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-white/10" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3 w-3/4 animate-pulse rounded bg-white/10" />
        <div className="h-2.5 w-1/2 animate-pulse rounded bg-white/[0.06]" />
      </div>
    </div>
  );
}

export function AuthLatestEvents({ events, loading }: AuthLatestEventsProps) {
  if (loading) {
    return (
      <div className="space-y-3" aria-hidden>
        <EventSkeleton />
        <EventSkeleton />
      </div>
    );
  }

  if (events.length === 0) return null;

  return (
    <div className="space-y-3">
      {events.map((event) => {
        const dateStr = event.deadline_at ?? event.created_at;
        const { dayName, dayNumber } = formatDeadlineBadge(dateStr);
        const title = event.title?.trim() || "Evento sin título";
        const orgName = event.user_name?.trim() || "Organización";
        const subtypeLabel = event.subtype ? SUBTYPE_LABELS[event.subtype] : null;

        return (
          <div
            key={event.id}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm"
          >
            <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/10">
              <span className="text-[9px] font-bold uppercase leading-none">{dayName}</span>
              <span className="text-sm font-bold leading-tight">{dayNumber}</span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white/90">{title}</p>
              <p className="truncate text-xs text-white/60">
                {orgName}
                {subtypeLabel ? ` · ${subtypeLabel}` : ""}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

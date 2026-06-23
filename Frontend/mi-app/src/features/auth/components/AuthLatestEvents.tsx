import type { FeedPostOut } from "../../../types/post.types";
import { SUBTYPE_LABELS } from "../../../types/post.types";
import { formatDeadlineBadge } from "../../feed/lib/weeklyHighlightUtils";
import { TW_AUTH } from "../constants/authTheme";

type AuthLatestEventsProps = {
  events: FeedPostOut[];
  loading: boolean;
  maxVisible?: number;
  compact?: boolean;
};

function EventSkeleton({ compact }: { compact?: boolean }) {
  const cardClass = compact ? TW_AUTH.heroShowcaseCardCompact : TW_AUTH.heroShowcaseCard;

  return (
    <div className={`grid grid-cols-[auto_1fr] items-center gap-3.5 ${cardClass}`}>
      <div className="size-11 shrink-0 animate-pulse rounded-[0.85rem] bg-white/10" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3 w-3/4 animate-pulse rounded bg-white/10" />
        <div className="h-2.5 w-1/2 animate-pulse rounded bg-white/[0.06]" />
      </div>
    </div>
  );
}

export function AuthLatestEvents({
  events,
  loading,
  maxVisible = 2,
  compact = false,
}: AuthLatestEventsProps) {
  const visibleEvents = events.slice(0, maxVisible);
  const cardClass = compact ? TW_AUTH.heroShowcaseCardCompact : TW_AUTH.heroShowcaseCard;

  if (loading) {
    return (
      <div className="flex flex-col gap-3" aria-hidden>
        {Array.from({ length: maxVisible }, (_, index) => (
          <EventSkeleton key={index} compact={compact} />
        ))}
      </div>
    );
  }

  if (visibleEvents.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {visibleEvents.map((event) => {
        const dateStr = event.deadline_at ?? event.created_at;
        const { dayName, dayNumber } = formatDeadlineBadge(dateStr);
        const title = event.title?.trim() || "Evento sin título";
        const orgName = event.user_name?.trim() || "Organización";
        const subtypeLabel = event.subtype ? SUBTYPE_LABELS[event.subtype] : null;

        return (
          <div
            key={event.id}
            className={`grid grid-cols-[auto_1fr] items-center gap-3.5 ${cardClass}`}
          >
            <div className={TW_AUTH.heroEventDate}>
              <span className="text-[0.62rem] font-extrabold uppercase leading-none opacity-85">
                {dayName}
              </span>
              <span className="text-base font-extrabold leading-tight">{dayNumber}</span>
            </div>

            <div className="min-w-0">
              <p className="truncate text-[0.92rem] font-bold text-white max-sm:text-[0.88rem]">
                {title}
              </p>
              <p className="mt-0.5 truncate text-[0.76rem] text-white/[0.58] max-sm:text-[0.72rem]">
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

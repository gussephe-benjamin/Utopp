import { useCallback, useEffect, useRef, useState } from "react";
import type { OrganizationSummary } from "../../../api/users.api";
import { getOrgAvatarStyle } from "../../feed/lib/weeklyHighlightUtils";
import { resolveOrgImageUrl } from "../../../shared/lib/cloudinaryUrl";
import { TW_AUTH } from "../constants/authTheme";

type OrgCarouselProps = {
  organizations: OrganizationSummary[];
  loading: boolean;
  compact?: boolean;
};

type AnimState = "idle" | "exiting" | "entering";

const ROTATION_MS = 3500;
const EXIT_MS = 220;
const ENTER_MS = 300;
const BUFFER_MS = 50;
const MAX_DOTS = 5;
const TRANSITION_MS = EXIT_MS + ENTER_MS + BUFFER_MS;

/** Índices de org visibles como puntos (máx. MAX_DOTS), centrados en el slide actual. */
function getDotOrgIndices(orgCount: number, currentIndex: number): number[] {
  if (orgCount <= 1) return [];
  const dotCount = Math.min(orgCount, MAX_DOTS);
  const windowStart =
    orgCount <= MAX_DOTS
      ? 0
      : Math.min(
          Math.max(currentIndex - Math.floor(MAX_DOTS / 2), 0),
          orgCount - MAX_DOTS,
        );
  return Array.from({ length: dotCount }, (_, i) => windowStart + i);
}

function getAnimClass(state: AnimState): string {
  switch (state) {
    case "exiting":
      return "org-slide-out";
    case "entering":
      return "org-slide-in";
    default:
      return "";
  }
}

function OrgSkeleton({ compact }: { compact?: boolean }) {
  const cardClass = compact ? TW_AUTH.heroShowcaseCardCompact : TW_AUTH.heroShowcaseCard;

  return (
    <div className={`flex items-center justify-between gap-4 ${cardClass}`}>
      <div className="flex min-w-0 items-center gap-3.5">
        <div className="size-[42px] shrink-0 animate-pulse rounded-full bg-white/10" />
        <div className="h-3 w-32 animate-pulse rounded bg-white/10" />
      </div>
    </div>
  );
}

export function OrgCarousel({ organizations, loading, compact = false }: OrgCarouselProps) {
  const orgs = organizations;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animState, setAnimState] = useState<AnimState>("idle");
  const [isHovered, setIsHovered] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transitionTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const animStateRef = useRef<AnimState>("idle");
  const currentIndexRef = useRef(0);

  const cardClass = compact ? TW_AUTH.heroShowcaseCardCompact : TW_AUTH.heroShowcaseCard;
  const avatarClass = compact ? "size-9" : "size-[42px]";
  const avatarTextClass = compact ? "text-sm" : "text-base";

  const clearTransitionTimeouts = useCallback(() => {
    transitionTimeoutsRef.current.forEach(clearTimeout);
    transitionTimeoutsRef.current = [];
  }, []);

  const scheduleTimeout = useCallback((fn: () => void, delay: number) => {
    const id = setTimeout(fn, delay);
    transitionTimeoutsRef.current.push(id);
    return id;
  }, []);

  useEffect(() => {
    animStateRef.current = animState;
  }, [animState]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    setCurrentIndex(0);
    setAnimState("idle");
    animStateRef.current = "idle";
    currentIndexRef.current = 0;
    clearTransitionTimeouts();
  }, [orgs.length, clearTransitionTimeouts]);

  useEffect(() => clearTransitionTimeouts, [clearTransitionTimeouts]);

  const transitionToIndex = useCallback(
    (targetIndex: number) => {
      if (orgs.length <= 1) return;
      if (animStateRef.current !== "idle") return;
      if (targetIndex === currentIndexRef.current) return;

      clearTransitionTimeouts();
      setAnimState("exiting");
      animStateRef.current = "exiting";

      scheduleTimeout(() => {
        setCurrentIndex(targetIndex);
        currentIndexRef.current = targetIndex;
        setAnimState("entering");
        animStateRef.current = "entering";
      }, EXIT_MS);

      scheduleTimeout(() => {
        setAnimState("idle");
        animStateRef.current = "idle";
      }, TRANSITION_MS);
    },
    [orgs.length, clearTransitionTimeouts, scheduleTimeout],
  );

  const goToNext = useCallback(() => {
    const next = (currentIndexRef.current + 1) % orgs.length;
    transitionToIndex(next);
  }, [orgs.length, transitionToIndex]);

  const goToIndex = useCallback(
    (index: number) => {
      transitionToIndex(index);
    },
    [transitionToIndex],
  );

  useEffect(() => {
    if (orgs.length <= 1 || isHovered) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      if (animStateRef.current !== "idle") return;
      goToNext();
    }, ROTATION_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isHovered, orgs.length, goToNext]);

  if (loading) return <OrgSkeleton compact={compact} />;
  if (orgs.length === 0) return null;

  const safeIndex = currentIndex % orgs.length;
  const org = orgs[safeIndex];
  const name = org.full_name?.trim() || "Organización";
  const initial = name.charAt(0).toUpperCase();

  const visibleDotIndices = getDotOrgIndices(orgs.length, safeIndex);
  const showDots = orgs.length > 1;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="overflow-hidden rounded-2xl">
        <div
          className={`flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start ${cardClass} ${getAnimClass(animState)}`}
        >
          <div className="flex min-w-0 items-center gap-3.5">
            {org.profile_image_url ? (
              <img
                src={resolveOrgImageUrl(org.profile_image_url) ?? org.profile_image_url}
                alt=""
                aria-hidden
                className={`${avatarClass} shrink-0 rounded-full object-cover ring-2 ring-white/25`}
              />
            ) : (
              <div
                className={`flex ${avatarClass} shrink-0 items-center justify-center rounded-full ${avatarTextClass} font-extrabold text-white ring-2 ring-white/20 ${getOrgAvatarStyle(org.id)}`}
                aria-hidden
              >
                {initial}
              </div>
            )}

            <p className="truncate text-[0.92rem] font-bold text-white">{name}</p>
          </div>

          {showDots && (
            <div
              className="flex shrink-0 items-center gap-1.5 max-sm:self-start max-sm:pl-[3.3rem]"
              role="tablist"
            >
              {visibleDotIndices.map((orgIndex) => (
                <button
                  key={orgs[orgIndex].id}
                  type="button"
                  onClick={() => goToIndex(orgIndex)}
                  aria-label={`Ver organización ${orgIndex + 1}`}
                  aria-current={orgIndex === safeIndex ? "true" : undefined}
                  className={
                    orgIndex === safeIndex
                      ? TW_AUTH.heroCarouselDotActive
                      : TW_AUTH.heroCarouselDot
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

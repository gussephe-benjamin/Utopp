import { useCallback, useEffect, useRef, useState } from "react";
import type { OrganizationSummary } from "../../../api/users.api";
import { getOrgAvatarStyle } from "../../feed/lib/weeklyHighlightUtils";

type OrgCarouselProps = {
  organizations: OrganizationSummary[];
  loading: boolean;
};

type AnimState = "idle" | "exiting" | "entering";

const ROTATION_MS = 3500;
const EXIT_MS = 220;
const ENTER_MS = 300;
const BUFFER_MS = 50;
const MAX_DOTS = 6;
const TRANSITION_MS = EXIT_MS + ENTER_MS + BUFFER_MS;

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

function OrgSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/12 p-3 backdrop-blur-md">
      <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-white/25" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3 w-2/3 animate-pulse rounded bg-white/25" />
        <div className="h-2.5 w-1/3 animate-pulse rounded bg-white/15" />
      </div>
    </div>
  );
}

export function OrgCarousel({ organizations, loading }: OrgCarouselProps) {
  const orgs = organizations;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animState, setAnimState] = useState<AnimState>("idle");
  const [isHovered, setIsHovered] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transitionTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const animStateRef = useRef<AnimState>("idle");
  const currentIndexRef = useRef(0);

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

  if (loading) return <OrgSkeleton />;
  if (orgs.length === 0) return null;

  const safeIndex = currentIndex % orgs.length;
  const org = orgs[safeIndex];
  const name = org.full_name?.trim() || "Organización";
  const initial = name.charAt(0).toUpperCase();
  const metric =
    org.followers_count > 0
      ? `${org.followers_count} ${org.followers_count === 1 ? "seguidor" : "seguidores"}`
      : `${org.posts_count ?? 0} ${org.posts_count === 1 ? "publicación" : "publicaciones"}`;

  const visibleDots = orgs.slice(0, Math.min(orgs.length, MAX_DOTS));
  const showDots = orgs.length > 1;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="overflow-hidden rounded-xl">
        <div
          className={`flex items-center gap-3 rounded-2xl border border-white/20 bg-white/12 p-3 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] ${getAnimClass(animState)}`}
        >
          {org.profile_image_url ? (
            <img
              src={org.profile_image_url}
              alt=""
              aria-hidden
              className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white/25"
            />
          ) : (
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-bold ring-2 ring-white/20 ${getOrgAvatarStyle(org.id)}`}
              aria-hidden
            >
              {initial}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{name}</p>
            <p className="truncate text-xs text-white/70">{metric}</p>
          </div>

          {showDots && (
            <div className="ml-auto flex shrink-0 items-center gap-1" role="tablist">
              {visibleDots.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goToIndex(index)}
                  aria-label={`Ver organización ${index + 1}`}
                  aria-current={index === safeIndex ? "true" : undefined}
                  className={`block h-1.5 rounded-full transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                    index === safeIndex
                      ? "w-3 bg-white/90"
                      : "w-1.5 bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { ListFilter, Plus } from "lucide-react";
import { UtoppBrandMark } from "../../../shared/brand/UtoppBrandMark";
import { AppLink } from "../../../shared/navigation/AppLink";
import {
  TW_UTOPP_GRADIENT_BR,
  TW_UTOPP_GRADIENT_R,
  TW_UTOPP_RING_PROFILE,
} from "../../../shared/constants/brand";
import { distributeSegmentSlots } from "../utils/distributeSegmentSlots";

const PLUS_SIZE_PX = 40;
const BAR_HORIZONTAL_PADDING_PX = 12;

type FeedBottomBarProps = {
  isFeedActive?: boolean;
  onOpenFeedFilters?: () => void;
  feedCategoryFiltersActive?: boolean;
  onOpenCreate: () => void;
  canCreate: boolean;
  avatarUrl: string | null;
  avatarInitial: string;
  displayName: string;
  isProfileRoute: boolean;
  accountMenuTriggerRef?: RefObject<HTMLAnchorElement | null>;
  feedFiltersTriggerRef?: RefObject<HTMLButtonElement | null>;
};

function slotStyleFromPlusCenter(offsetPx: number, side: "left" | "right"): CSSProperties {
  const halfPlus = PLUS_SIZE_PX / 2;
  if (side === "left") {
    return {
      left: `calc(50% - ${halfPlus + offsetPx}px)`,
      top: "50%",
      transform: "translate(-50%, -50%)",
    };
  }
  return {
    left: `calc(50% + ${halfPlus + offsetPx}px)`,
    top: "50%",
    transform: "translate(-50%, -50%)",
  };
}

/**
 * Barra inferior móvil (< sm): + centrado; funcionalidades espaciadas de forma uniforme
 * en cada segmento entre el + y el borde (reglas par/impar en distributeSegmentSlots).
 */
export function FeedBottomBar({
  isFeedActive = false,
  onOpenFeedFilters,
  feedCategoryFiltersActive = false,
  onOpenCreate,
  canCreate,
  avatarUrl,
  avatarInitial,
  displayName,
  isProfileRoute,
  accountMenuTriggerRef,
  feedFiltersTriggerRef,
}: FeedBottomBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [segmentLength, setSegmentLength] = useState(0);

  const rightCount = onOpenFeedFilters ? 2 : 1;

  useLayoutEffect(() => {
    const el = barRef.current;
    if (!el) return;

    const measure = () => {
      const w = el.clientWidth;
      const halfPlus = PLUS_SIZE_PX / 2;
      const seg = w / 2 - halfPlus - BAR_HORIZONTAL_PADDING_PX;
      setSegmentLength(Math.max(0, seg));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const leftOffsets = useMemo(
    () => distributeSegmentSlots(segmentLength, 1),
    [segmentLength],
  );
  const rightOffsets = useMemo(
    () => distributeSegmentSlots(segmentLength, rightCount),
    [segmentLength, rightCount],
  );

  const createSlot = canCreate ? (
    <button
      type="button"
      onClick={onOpenCreate}
      title="Crear oportunidad"
      className={`w-10 h-10 flex items-center justify-center rounded-full ${TW_UTOPP_GRADIENT_R} text-white shadow-md hover:shadow-lg hover:brightness-[1.03] active:scale-[0.98] transition-all shrink-0`}
    >
      <Plus className="w-4 h-4 shrink-0 stroke-[2.5]" stroke="currentColor" aria-hidden />
      <span className="sr-only">Crear oportunidad</span>
    </button>
  ) : (
    <div className="w-10 h-10 shrink-0" aria-hidden />
  );

  const filterButton =
    onOpenFeedFilters && rightOffsets.length >= 2 ? (
      <button
        key="filter"
        ref={feedFiltersTriggerRef}
        type="button"
        onClick={onOpenFeedFilters}
        style={slotStyleFromPlusCenter(rightOffsets[0], "right")}
        className={`absolute z-[1] flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full transition-colors ${
          feedCategoryFiltersActive
            ? "shadow-md hover:brightness-[1.05]"
            : "text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100"
        }`}
        aria-label="Filtros del feed"
        title="Filtros"
      >
        {feedCategoryFiltersActive ? (
          <>
            <span
              className={`pointer-events-none absolute inset-0 ${TW_UTOPP_GRADIENT_R}`}
              aria-hidden
            />
            <span
              className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/25"
              aria-hidden
            />
            <ListFilter className="relative z-10 w-5 h-5 text-white" strokeWidth={2} />
          </>
        ) : (
          <ListFilter className="w-5 h-5" strokeWidth={2} />
        )}
      </button>
    ) : null;

  const avatarOffset = rightOffsets[rightOffsets.length - 1] ?? segmentLength / 2;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-white/95 backdrop-blur-md border-t border-gray-200/80 shadow-[0_-1px_12px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]"
      aria-label="Navegación principal"
    >
      <div ref={barRef} className="relative h-14 max-w-6xl mx-auto px-3">
        <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          {createSlot}
        </div>

        {leftOffsets[0] != null && (
          <div
            className="absolute z-[1] max-w-[calc(50%-3.5rem)] min-w-0"
            style={slotStyleFromPlusCenter(leftOffsets[0], "left")}
          >
            <UtoppBrandMark
              variant="header"
              to="/app/inicio"
              onClick={(event) => {
                if (isFeedActive) {
                  event.preventDefault()
                  window.location.assign(`${window.location.origin}/app/inicio`)
                }
              }}
              aria-label="Ir a inicio y recargar"
              className="min-w-0 max-w-full [&_span]:text-base [&_span]:truncate"
            />
          </div>
        )}

        {filterButton}

        <AppLink
          ref={accountMenuTriggerRef}
          to="/app/perfil"
          style={slotStyleFromPlusCenter(avatarOffset, "right")}
          className={`absolute z-[1] rounded-full p-0.5 shrink-0 transition-shadow ${
            isProfileRoute
              ? TW_UTOPP_RING_PROFILE
              : "ring-0 hover:ring-2 hover:ring-fuchsia-200/60 ring-offset-2"
          }`}
          aria-label="Ir a mi perfil"
          title={displayName}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-9 h-9 rounded-full object-cover bg-gray-100"
            />
          ) : (
            <div
              className={`w-9 h-9 rounded-full ${TW_UTOPP_GRADIENT_BR} flex items-center justify-center text-white text-sm font-bold`}
            >
              {avatarInitial}
            </div>
          )}
        </AppLink>
      </div>
    </nav>
  );
}

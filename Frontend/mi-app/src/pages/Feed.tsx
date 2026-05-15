import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { X } from "lucide-react";
import { getFeed } from "../api/feed.api";
import { getMyProfile } from "../api/users.api";
import { INTERESTS } from "../constants/interests";
import { TW_AUTH_FOOTER_LINK, TW_UTOPP_GRADIENT_R } from "../shared/constants/brand";
import { PostCard } from "../features/feed/components/PostCard";
import {
  getClampedRightPopoverStyle,
  type MenuPopoverAnchor,
} from "../features/dashboard/popoverAnchor";
import type { FeedPostOut, FeedResponse } from "../types/post.types";

const FILTER_POPOVER_FALLBACK: MenuPopoverAnchor = {
  placement: "above",
  bottom: 72,
  right: 12,
  minWidth: 40,
  maxHeightPx: 480,
};

const FILTER_POPOVER_FALLBACK_DESKTOP: MenuPopoverAnchor = {
  placement: "below",
  top: 64,
  right: 12,
  minWidth: 40,
};

export type FeedProps = {
  filtersSheetOpen?: boolean;
  onCloseFiltersSheet?: () => void;
  /** Posición del popover de filtros (anclado al botón de la barra). */
  filterPopoverAnchor?: MenuPopoverAnchor | null;
  /** Notifica si hay al menos una categoría seleccionada (para resaltar el botón en la barra). */
  onCategoryFiltersActiveChange?: (active: boolean) => void;
};

type FeedFiltersPanelProps = {
  statusFilter: string | undefined;
  setStatusFilter: (v: string | undefined) => void;
  sortOrder: "urgency" | "recent";
  setSortOrder: (v: "urgency" | "recent") => void;
  selectedTags: string[];
  setSelectedTags: Dispatch<SetStateAction<string[]>>;
};

function FeedFiltersPanel({
  statusFilter,
  setStatusFilter,
  sortOrder,
  setSortOrder,
  selectedTags,
  setSelectedTags,
}: FeedFiltersPanelProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-0">
        <div className="w-full flex justify-center items-center gap-2 flex-wrap py-0.5 px-1">
          {(
            [
              { value: undefined as undefined, label: "Todas" },
              { value: "vigente" as const, label: "Vigentes" },
              { value: "vencida" as const, label: "Vencidas" },
            ] as const
          ).map((opt) => {
            const active =
              opt.value === undefined ? statusFilter === undefined : statusFilter === opt.value;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => {
                  if (opt.value === undefined) setStatusFilter(undefined);
                  else setStatusFilter(statusFilter === opt.value ? undefined : opt.value);
                }}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                  active
                    ? `${TW_UTOPP_GRADIENT_R} text-white border-transparent shadow-sm`
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="flex justify-center py-2 px-4" aria-hidden>
          <div className="h-px w-full max-w-[14rem] bg-gradient-to-r from-transparent via-violet-200/85 to-transparent" />
        </div>

        <div className="w-full flex justify-center items-center gap-2 flex-wrap py-0.5 px-1">
          {(
            [
              { value: "recent" as const, label: "🕐 Recientes" },
              { value: "urgency" as const, label: "⌛ Urgencia" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSortOrder(opt.value)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                sortOrder === opt.value
                  ? `${TW_UTOPP_GRADIENT_R} text-white border-transparent shadow-sm`
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {selectedTags.length > 0 && (
        <div className="bg-white/70 rounded-xl border border-violet-100 p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-xs font-semibold text-gray-500">Filtros seleccionados</p>
            <button
              type="button"
              onClick={() => setSelectedTags([])}
              className={`text-xs font-semibold ${TW_AUTH_FOOTER_LINK} underline-offset-2`}
            >
              Limpiar
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedTags.map((tagId) => {
              const info = INTERESTS.find((x) => x.id === tagId);
              if (!info) return null;
              return (
                <button
                  key={tagId}
                  type="button"
                  onClick={() => setSelectedTags((prev) => prev.filter((t) => t !== tagId))}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${TW_UTOPP_GRADIENT_R} text-white border-transparent shadow-sm`}
                  title="Quitar filtro"
                >
                  <span>{info.icon}</span>
                  {info.label}
                  <span className="ml-1 opacity-90">×</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-500 mb-2">Categorías</p>
        <div className="flex flex-wrap gap-1.5">
          {INTERESTS.map((interest) => {
            const active = selectedTags.includes(interest.id);
            return (
              <button
                key={interest.id}
                type="button"
                onClick={() =>
                  setSelectedTags((prev) =>
                    active ? prev.filter((t) => t !== interest.id) : [...prev, interest.id],
                  )
                }
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  active
                    ? `${TW_UTOPP_GRADIENT_R} text-white border-transparent shadow-sm`
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <span>{interest.icon}</span>
                {interest.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Página Feed: lista paginada de posts publicados.
 * Filtros en sheet controlado por el padre (barra superior).
 */
export default function Feed({
  filtersSheetOpen = false,
  onCloseFiltersSheet = () => {},
  filterPopoverAnchor = null,
  onCategoryFiltersActiveChange,
}: FeedProps) {
  const [posts, setPosts] = useState<FeedPostOut[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<"urgency" | "recent">("urgency");

  useEffect(() => {
    onCategoryFiltersActiveChange?.(selectedTags.length > 0);
  }, [selectedTags]);

  useEffect(() => {
    getMyProfile()
      .then((d: { id: number }) => setCurrentUserId(d.id))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
  }, [statusFilter, selectedTags, sortOrder]);

  const fetchPage = useCallback(
    async (pageNum: number) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      try {
        const data: FeedResponse = await getFeed({
          page: pageNum,
          size: 10,
          time_status: statusFilter,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          sort: sortOrder === "recent" ? "recent" : undefined,
        });
        setPosts((prev) => (pageNum === 1 ? data.items : [...prev, ...data.items]));
        setHasMore(data.has_next);
        if (data.has_next) setPage(pageNum + 1);
      } catch (err) {
        console.error("Error cargando feed:", err);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [statusFilter, selectedTags, sortOrder],
  );

  useEffect(() => {
    const handlePublished = () => {
      setPage(1);
      setHasMore(true);
      fetchPage(1);
    };
    window.addEventListener("postPublished", handlePublished);
    return () => window.removeEventListener("postPublished", handlePublished);
  }, [fetchPage]);

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
        fetchPage(page);
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [fetchPage, hasMore, page]);

  const filterProps: FeedFiltersPanelProps = {
    statusFilter,
    setStatusFilter,
    sortOrder,
    setSortOrder,
    selectedTags,
    setSelectedTags,
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ overflowAnchor: "none" }}>
      <div className="w-full max-w-[550px] mx-auto p-4 space-y-4">
        <div className="pt-4 sm:pt-12">
          {(() => {
            const lastPinnedIdx = posts.reduce((acc, p, i) => (p.is_pinned ? i : acc), -1);
            return posts.map((post, i) => (
              <div key={post.id} className="mb-4 last:mb-0">
                <PostCard
                  post={post}
                  currentUserId={currentUserId}
                  onEdited={(updated) =>
                    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
                  }
                />
                {i === lastPinnedIdx && posts.length > lastPinnedIdx + 1 && (
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex-1 h-px bg-cyan-200" />
                    <span className="text-[10px] font-semibold text-cyan-600 uppercase tracking-widest whitespace-nowrap">
                      — Publicaciones generales —
                    </span>
                    <div className="flex-1 h-px bg-cyan-200" />
                  </div>
                )}
              </div>
            ));
          })()}
        </div>

        {!loading && posts.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-medium text-gray-700">Aún no hay publicaciones</p>
            <p className="text-sm text-gray-400 mt-1">Sé el primero en crear una publicación</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-4 text-sm text-gray-400">Cargando más...</div>
        )}
        <div ref={loaderRef} />
      </div>

      {filtersSheetOpen && (
        <>
          <div
            className="fixed inset-0 z-[65] bg-black/10"
            onClick={() => onCloseFiltersSheet()}
            aria-hidden
          />
          <div
            className={`fixed z-[66] flex min-w-0 flex-col overflow-hidden rounded-xl border border-gray-200/90 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] animate-in fade-in zoom-in-95 duration-150 ${
              (filterPopoverAnchor ?? FILTER_POPOVER_FALLBACK).placement === "above"
                ? "slide-in-from-bottom-1"
                : "slide-in-from-top-1"
            }`}
            style={getClampedRightPopoverStyle(
              filterPopoverAnchor ??
                (typeof window !== "undefined" && window.matchMedia("(min-width: 640px)").matches
                  ? FILTER_POPOVER_FALLBACK_DESKTOP
                  : FILTER_POPOVER_FALLBACK),
              { maxWidth: 480, margin: 8 },
            )}
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
                className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors shrink-0"
                aria-label="Cerrar filtros"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="min-h-0 w-full min-w-0 overflow-y-auto space-y-3 bg-violet-50/30 p-3 pb-5">
              <FeedFiltersPanel {...filterProps} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

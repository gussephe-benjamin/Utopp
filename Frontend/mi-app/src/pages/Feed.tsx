import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { X, SlidersHorizontal, Bell, Flame, Clock, Timer, GraduationCap, Building2, Inbox, Music, Trophy, Plane, Star } from "lucide-react";
import { getFeed } from "../api/feed.api";
import { getMyProfile } from "../api/users.api";
import { INTERESTS } from "../constants/interests";
import { TW_AUTH_FOOTER_LINK, TW_UTOPP_GRADIENT_R } from "../shared/constants/brand";
import { PostCard } from "../features/feed/components/PostCard";
import { LeftSidebar } from "../features/feed/components/LeftSidebar";
import { RightSidebar } from "../features/feed/components/RightSidebar";
import { FeedWelcomeBanner } from "../features/feed/components/FeedWelcomeBanner";
import { FeedQuickCreate } from "../features/feed/components/FeedQuickCreate";
import { FeedHorizontalFilters } from "../features/feed/components/FeedHorizontalFilters";
import {
  getClampedRightPopoverStyle,
  type MenuPopoverAnchor,
} from "../features/dashboard/popoverAnchor";
import type { FeedPostOut, FeedResponse } from "../types/post.types";
import { motion } from "framer-motion";

const FILTER_POPOVER_FALLBACK: MenuPopoverAnchor = { top: 64, right: 12, minWidth: 40 };

export type FeedProps = {
  filtersSheetOpen?: boolean;
  onCloseFiltersSheet?: () => void;
  /** Posición del popover de filtros (anclado al botón de la barra). */
  filterPopoverAnchor?: MenuPopoverAnchor | null;
  /** Notifica si hay al menos una categoría seleccionada (para resaltar el botón en la barra). */
  onCategoryFiltersActiveChange?: (active: boolean) => void;
  /** Callback para abrir el wizard de creación */
  onOpenCreate?: () => void;
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
              { value: "recent"  as const, label: "Recientes", Icon: Clock },
              { value: "urgency" as const, label: "Urgencia",  Icon: Timer },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSortOrder(opt.value)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                sortOrder === opt.value
                  ? `${TW_UTOPP_GRADIENT_R} text-white border-transparent shadow-sm`
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <opt.Icon className="w-3 h-3 shrink-0" />
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
              const InfoIcon = info.icon;
              return (
                <button
                  key={tagId}
                  type="button"
                  onClick={() => setSelectedTags((prev) => prev.filter((t) => t !== tagId))}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${TW_UTOPP_GRADIENT_R} text-white border-transparent shadow-sm`}
                  title="Quitar filtro"
                >
                  <InfoIcon className="w-3 h-3 shrink-0" />
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
            const IconComponent = interest.icon;
            return (
              <button
                key={interest.id}
                type="button"
                onClick={() =>
                  setSelectedTags((prev) =>
                    active ? prev.filter((t) => t !== interest.id) : [...prev, interest.id],
                  )
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  active
                    ? `${TW_UTOPP_GRADIENT_R} text-white border-transparent shadow-sm`
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <IconComponent className="w-3.5 h-3.5 shrink-0" />
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
  onOpenCreate = () => {},
}: FeedProps) {
  const [posts, setPosts] = useState<FeedPostOut[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>("Usuario");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userCareer, setUserCareer] = useState<string | null>(null);
  const [userCycle, setUserCycle] = useState<number | null>(null);
  const [userPostsCount, setUserPostsCount] = useState<number>(0);
  const [userFollowersCount, setUserFollowersCount] = useState<number>(0);
  const [userFollowingCount, setUserFollowingCount] = useState<number>(0);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<"urgency" | "recent">("urgency");

  useEffect(() => {
    onCategoryFiltersActiveChange?.(selectedTags.length > 0);
  }, [selectedTags]);

  useEffect(() => {
    getMyProfile()
      .then((d: {
        id: number;
        full_name?: string;
        profile_image_url?: string;
        career?: string;
        cycle?: number;
        posts_count?: number;
        followers_count?: number;
        following_count?: number;
      }) => {
        setCurrentUserId(d.id);
        if (d.full_name) setUserName(d.full_name.split(" ")[0]);
        if (d.profile_image_url) setAvatarUrl(d.profile_image_url);
        if (d.career) setUserCareer(d.career);
        if (d.cycle) setUserCycle(d.cycle);
        setUserPostsCount(d.posts_count ?? 0);
        setUserFollowersCount(d.followers_count ?? 0);
        setUserFollowingCount(d.following_count ?? 0);
      })
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
    <div className="min-h-screen bg-gray-50 flex justify-center" style={{ overflowAnchor: "none" }}>
      <div className="w-full max-w-[1320px] mx-auto px-0 md:px-4 flex gap-6 pt-0 md:pt-[80px] pb-8 items-start justify-center">
        
        <LeftSidebar
          userName={userName}
          avatarUrl={avatarUrl}
          career={userCareer}
          cycle={userCycle}
          postsCount={userPostsCount}
          followersCount={userFollowersCount}
          followingCount={userFollowingCount}
        />

        <div className="flex-1 w-full max-w-[620px] min-w-0 space-y-0 md:space-y-5">
          {/* Mobile custom header */}
          <div className="block md:hidden w-full bg-gradient-to-b from-[#2f55f6] via-[#614bf8] to-[#803ef8] rounded-b-[32px] px-6 pt-7 pb-7 text-white relative shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Hola, {userName}
                </h1>
                <p className="text-xs font-medium text-white/80 mt-0.5">Esto es para ti hoy</p>
              </div>
              
              <button className="relative flex items-center justify-center w-10 h-10 bg-white/15 hover:bg-white/20 text-white rounded-full border border-white/20 active:scale-95 transition-all shadow-sm">
                <Bell className="w-4.5 h-4.5" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-fuchsia-500 text-[9px] font-extrabold text-white ring-2 ring-[#2f55f6]">3</span>
              </button>
            </div>

            <div className="mt-5 relative flex items-center">
              <input
                type="text"
                placeholder="Buscar oportunidades..."
                className="block w-full py-2.5 pl-4 pr-10 rounded-2xl bg-white/15 text-white placeholder-white/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 text-xs transition-all"
              />
              <div className="absolute right-3.5 flex items-center pointer-events-none text-white/80">
                <SlidersHorizontal className="w-4.5 h-4.5 stroke-[2.5]" />
              </div>
            </div>
          </div>

          {/* Sección "🔥 No te pierdas" */}
          <div className="block md:hidden w-full pt-6 pb-2">
            <div className="flex items-center justify-between px-4 mb-3">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-500" />
                <h2 className="text-base font-bold text-gray-900">No te pierdas</h2>
              </div>
              <button className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1">
                Ver todo →
              </button>
            </div>
            
            {/* Carousel de Tarjetas */}
            <div className="flex gap-3.5 px-4 overflow-x-auto no-scrollbar pb-3 scroll-smooth snap-x snap-mandatory">
              {/* Tarjeta 1: Beca Europa */}
              <div className="flex-shrink-0 w-[150px] bg-white rounded-2xl border border-gray-100/90 shadow-sm overflow-hidden flex flex-col snap-start">
                <div className="h-[95px] w-full overflow-hidden relative bg-gray-100">
                  <img 
                    src="https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=300&q=80" 
                    alt="Beca Europa" 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = 'https://picsum.photos/seed/erasmus/300/200'; }}
                  />
                </div>
                <div className="p-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-fuchsia-500 uppercase tracking-wider block">Beca</span>
                    <h3 className="text-xs font-bold text-gray-900 leading-snug mt-0.5 line-clamp-2">Beca Europa — Erasmus+</h3>
                  </div>
                  <p className="text-[9px] font-semibold text-violet-600/80 mt-2">En 5 días</p>
                </div>
              </div>

              {/* Tarjeta 2: Festival Cultural UTEC */}
              <div className="flex-shrink-0 w-[150px] bg-white rounded-2xl border border-gray-100/90 shadow-sm overflow-hidden flex flex-col snap-start">
                <div className="h-[95px] w-full overflow-hidden relative bg-gray-100">
                  <img 
                    src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=300&q=80" 
                    alt="Festival Cultural" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-[#8b4af6] uppercase tracking-wider flex items-center gap-0.5">
                      <Music className="w-2.5 h-2.5" /> Festival
                    </span>
                    <h3 className="text-xs font-bold text-gray-900 leading-snug mt-0.5 line-clamp-2">Festival Cultural UTEC</h3>
                  </div>
                  <p className="text-[9px] font-semibold text-violet-600/80 mt-2">En 2 días</p>
                </div>
              </div>

              {/* Tarjeta 3: Hackathon Lima Tech 2025 */}
              <div className="flex-shrink-0 w-[150px] bg-white rounded-2xl border border-gray-100/90 shadow-sm overflow-hidden flex flex-col snap-start">
                <div className="h-[95px] w-full overflow-hidden relative bg-gray-100">
                  <img 
                    src="https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=300&q=80" 
                    alt="Hackathon Lima Tech" 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = 'https://picsum.photos/seed/hackathon/300/200'; }}
                  />
                </div>
                <div className="p-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-[#8b4af6] uppercase tracking-wider flex items-center gap-0.5">
                      <Trophy className="w-2.5 h-2.5" /> Hackathon
                    </span>
                    <h3 className="text-xs font-bold text-gray-900 leading-snug mt-0.5 line-clamp-2">Hackathon Lima Tech 2025</h3>
                  </div>
                  <p className="text-[9px] font-semibold text-violet-600/80 mt-2">Cierra en 7 días</p>
                </div>
              </div>

              {/* Tarjeta 4: Intercambio PUCP */}
              <div className="flex-shrink-0 w-[150px] bg-white rounded-2xl border border-gray-100/90 shadow-sm overflow-hidden flex flex-col snap-start">
                <div className="h-[95px] w-full overflow-hidden relative bg-gray-100">
                  <img 
                    src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=300&q=80" 
                    alt="Intercambio PUCP" 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = 'https://picsum.photos/seed/intercambio/300/200'; }}
                  />
                </div>
                <div className="p-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wider flex items-center gap-0.5">
                      <Plane className="w-2.5 h-2.5" /> Intercambio
                    </span>
                    <h3 className="text-xs font-bold text-gray-900 leading-snug mt-0.5 line-clamp-2">Intercambio PUCP — Canadá</h3>
                  </div>
                  <p className="text-[9px] font-semibold text-violet-600/80 mt-2">En 10 días</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile category navigation pills */}
          <div className="block md:hidden w-full py-2.5 px-4 overflow-x-auto no-scrollbar flex items-center gap-2">
            <button className="flex-shrink-0 flex items-center gap-1 px-3 py-2 bg-[#f1f3f7] text-[#5c6b73] font-semibold text-[11px] rounded-full hover:bg-gray-200 active:scale-95 transition-all whitespace-nowrap">
              <GraduationCap className="w-3.5 h-3.5 shrink-0" /> Académicos
            </button>
            <button className="flex-shrink-0 flex items-center gap-1 px-3 py-2 bg-[#2f55f6] text-white font-semibold text-[11px] rounded-full shadow-[0_4px_12px_rgba(47,85,246,0.25)] hover:brightness-105 active:scale-95 transition-all whitespace-nowrap">
              <Clock className="w-3.5 h-3.5 shrink-0" /> Mi disponibilidad
            </button>
            <button className="flex-shrink-0 flex items-center gap-1 px-3 py-2 bg-[#f1f3f7] text-[#5c6b73] font-semibold text-[11px] rounded-full hover:bg-gray-200 active:scale-95 transition-all whitespace-nowrap">
              <Building2 className="w-3.5 h-3.5 shrink-0" /> Mis orgs
            </button>
          </div>

          <div className="hidden md:block">
            <FeedWelcomeBanner userName={userName} newOpportunitiesCount={3} />
          </div>
          
          <div className="hidden md:block">
            <FeedQuickCreate avatarUrl={avatarUrl} onOpenWizard={onOpenCreate} />
          </div>
          
          <div className="hidden md:block pt-2">
            <FeedHorizontalFilters
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              selectedTags={selectedTags}
              setSelectedTags={setSelectedTags}
            />
          </div>

          <motion.div 
            initial="hidden"
            animate="show"
            variants={{
              show: { transition: { staggerChildren: 0.1 } }
            }}
            className="w-full space-y-4 pt-4 px-4 md:px-0"
          >
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
        </motion.div>

        {!loading && posts.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="flex justify-center mb-3">
              <Inbox className="w-12 h-12 text-gray-300" />
            </div>
            <p className="font-medium text-gray-700">Aún no hay publicaciones</p>
            <p className="text-sm text-gray-400 mt-1">Sé el primero en crear una publicación</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-4 text-sm text-gray-400">Cargando más...</div>
        )}
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

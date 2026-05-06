import { useCallback, useEffect, useRef, useState } from "react";
import { getFeed } from "../api/feed.api";
import { getMyProfile } from "../api/users.api";
import { INTERESTS } from "../constants/interests";
import { PostCard } from "../features/feed/components/PostCard";
import type { FeedPostOut, FeedResponse } from "../types/post.types";

/**
 * Página Feed: lista paginada de posts publicados.
 * Carga automáticamente más posts al hacer scroll (infinite scroll).
 * Escucha el evento 'postPublished' para recargar desde el inicio
 * cuando el usuario crea un nuevo post desde el wizard.
 */
export default function Feed() {
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
  const [showCategoryFilters, setShowCategoryFilters] = useState(true);

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

  return (
    <div className="min-h-screen bg-gray-50" style={{ overflowAnchor: "none" }}>
      <div className="w-full max-w-[550px] mx-auto p-4 space-y-4">
        {/* ─── Filtros feed: estilo “intereses” (selección crece hacia abajo) ─ */}
        <div className="sticky top-14 z-40 -mx-4 px-4 py-3 bg-violet-50/40 backdrop-blur-sm border-b border-violet-100/80 shadow-sm space-y-3">
          {/* Fila 1: alcance temporal + orden (píldoras; activo = gradiente marca) */}
          <div className="flex items-center gap-2 flex-wrap">
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
                      ? "bg-gradient-to-r from-blue-600 to-[#7C3AED] text-white border-transparent shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}

            <div className="w-px h-6 bg-gray-200 mx-0.5 hidden sm:block" />

            {(
              [
                { value: "urgency" as const, label: "⌛ Urgencia" },
                { value: "recent" as const, label: "🕐 Recientes" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSortOrder(opt.value)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                  sortOrder === opt.value
                    ? "bg-gradient-to-r from-blue-600 to-[#7C3AED] text-white border-transparent shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            ))}

            {/* Control para mostrar/ocultar filtros de categoría */}
            <button
              type="button"
              onClick={() => setShowCategoryFilters((v) => !v)}
              className="ml-auto px-3 py-1.5 text-xs font-semibold rounded-full border bg-white text-gray-600 border-gray-200 hover:bg-gray-50 transition-colors"
              title={showCategoryFilters ? "Ocultar categorías" : "Mostrar categorías"}
            >
              {showCategoryFilters ? "Ocultar categorías" : "Mostrar categorías"}
            </button>
          </div>

          {/* Fila 2: tags seleccionados (lista crece hacia abajo) */}
          {showCategoryFilters && selectedTags.length > 0 && (
            <div className="bg-white/70 rounded-xl border border-violet-100 p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-xs font-semibold text-gray-500">Filtros seleccionados</p>
                <button
                  type="button"
                  onClick={() => setSelectedTags([])}
                  className="text-xs font-semibold text-[#4F46E5] hover:text-[#7C3AED] underline-offset-2 hover:underline"
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
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all bg-gradient-to-r from-blue-600 to-[#7C3AED] text-white border-transparent shadow-sm"
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

          {/* Fila 3: tags disponibles (wrap; nunca hacia los costados) */}
          {showCategoryFilters && (
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
                          ? "bg-gradient-to-r from-blue-600 to-[#7C3AED] text-white border-transparent shadow-sm"
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
          )}
        </div>

        {/* ─── Lista de posts + separador tras fijados (misma lógica que antes) ─ */}
        <div className="pt-12">
          {(() => {
          const lastPinnedIdx = posts.reduce((acc, p, i) => (p.is_pinned ? i : acc), -1);
          return posts.map((post, i) => (
            <div key={post.id} className="mb-4 last:mb-0">
              <PostCard
                post={post}
                currentUserId={currentUserId}
                onEdited={(updated) => setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))}
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
    </div>
  );
}

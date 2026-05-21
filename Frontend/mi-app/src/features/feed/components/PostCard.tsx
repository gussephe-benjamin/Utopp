// ─── PostCard (feed): carrusel, enlaces, avatar, menú guardar/editar ───────
// Transiciones alineadas con la versión monolítica en `Feed` (hover, sombra, slide 350ms).

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  MoreVertical,
  Pencil,
  Pin,
  Eye,
  Heart,
  Share2,
  CheckCircle,
} from "lucide-react";
import { listImages, type PostImage } from "../../../api/post-images.api";
import { savePost, unsavePost } from "../../../api/saved-posts.api";
import EditPostWizard from "../../../components/EditPostWizard";
import PostDetailModal from "../../../components/PostDetailModal";
import type { FeedPostOut } from "../../../types/post.types";
import { POST_TYPE_LABELS, SUBTYPE_LABELS } from "../../../types/post.types";
import { formatDate, isExpired, timeAgo, timeRemaining } from "../../../shared/lib/date";
import { TYPE_GRADIENTS } from "../constants/typeGradients";
import { getDisplayName } from "../lib/display";
import { ScoreExplanation } from "./ScoreExplanation";
import { UserAvatar } from "./UserAvatar";


type PostCardProps = {
  post: FeedPostOut;
  currentUserId: number | null;
  onEdited: (updated: FeedPostOut) => void;
};

/**
 * Tarjeta de post del feed: carrusel, links, avatar, menú guardar/editar.
 */
export function PostCard({ post, currentUserId, onEdited }: PostCardProps) {
  const navigate = useNavigate();

  const SS_IDX = `utopp:carousel:idx:${post.id}`;
  const SS_IMGS = `utopp:carousel:imgs:${post.id}`;

  const [descExpanded, setDescExpanded] = useState(false);
  const [hasMoreDesc, setHasMoreDesc] = useState(() => post.description.length > 180);
  const descRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (descRef.current) {
      const isTruncated = descRef.current.scrollHeight > descRef.current.clientHeight;
      setHasMoreDesc(isTruncated);
    }
  }, [post.description]);

  // Nuevos estados para interacciones premium
  const [isLiked, setIsLiked] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Estadísticas mock deterministas basadas en el ID del post
  const viewsCount = useMemo(() => (post.id * 37 + 103) % 900 + 47, [post.id]);
  const savesCount = useMemo(() => (post.id * 13 + 41) % 150 + 12, [post.id]);
  const postulationsCount = useMemo(() => (post.id * 7 + 19) % 80 + 3, [post.id]);

  const handleLikeToggle = () => {
    setIsLiked((prev) => !prev);
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/app/post/${post.id}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => console.error("Error al copiar enlace:", err));
  };

  const getTagStyles = (tag: string) => {
    const lower = tag.toLowerCase();
    if (lower.includes("cultur") || lower.includes("art") || lower.includes("teatr") || lower.includes("cine")) {
      return "bg-purple-50 text-[#ba4ef8] border border-purple-100/70 font-bold px-3 py-0.5 text-xs rounded-full";
    }
    if (lower.includes("músic") || lower.includes("music") || lower.includes("band") || lower.includes("conciert")) {
      return "bg-blue-50 text-[#2f55f6] border border-blue-100/70 font-bold px-3 py-0.5 text-xs rounded-full";
    }
    if (lower.includes("deport") || lower.includes("futbol") || lower.includes("bask") || lower.includes("voley")) {
      return "bg-emerald-50 text-emerald-600 border border-emerald-100/70 font-bold px-3 py-0.5 text-xs rounded-full";
    }
    if (lower.includes("conferenc") || lower.includes("char") || lower.includes("ponenc") || lower.includes("taller")) {
      return "bg-indigo-50 text-indigo-600 border border-indigo-100/70 font-bold px-3 py-0.5 text-xs rounded-full";
    }
    if (lower.includes("urgente") || lower.includes("importante") || lower.includes("comunicado")) {
      return "bg-rose-50 text-rose-600 border border-rose-100/70 font-bold px-3 py-0.5 text-xs rounded-full";
    }
    return "bg-violet-50 text-violet-600 border border-violet-100/70 font-bold px-3 py-0.5 text-xs rounded-full";
  };

  const [images, setImages] = useState<PostImage[]>(() => {
    try {
      const saved = sessionStorage.getItem(SS_IMGS);
      return saved ? (JSON.parse(saved) as PostImage[]) : [];
    } catch {
      return [];
    }
  });
  const [imgIndex, setImgIndex] = useState(() => {
    try {
      return parseInt(sessionStorage.getItem(SS_IDX) ?? "0", 10) || 0;
    } catch {
      return 0;
    }
  });

  const setImgIndexSaved = (i: number) => {
    setImgIndex(i);
    try {
      sessionStorage.setItem(SS_IDX, String(i));
    } catch {
      /* noop */
    }
  };
  const [isSaved, setIsSaved] = useState(post.is_saved);
  const [menuOpen, setMenuOpen] = useState(false);
  const [savingPost, setSavingPost] = useState(false);
  const [extraMenuOpen, setExtraMenuOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(false);

  const isOwnPost = currentUserId !== null && post.user_id === currentUserId;
  const menuRef = useRef<HTMLDivElement>(null);
  const extraMenuRef = useRef<HTMLDivElement>(null);

  const gradient = TYPE_GRADIENTS[post.post_type] ?? TYPE_GRADIENTS.simple_post;

  useEffect(() => {
    if (post.images_count > 0) {
      listImages(post.id)
        .then((imgs) => {
          setImages(imgs);
          try {
            sessionStorage.setItem(SS_IMGS, JSON.stringify(imgs));
          } catch {
            /* noop */
          }
        })
        .catch(() => {
          /* noop */
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id, post.images_count]);

  useEffect(() => {
    if (!menuOpen && !extraMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (extraMenuOpen && extraMenuRef.current && !extraMenuRef.current.contains(e.target as Node)) {
        setExtraMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen, extraMenuOpen]);

  const handleSaveToggle = async () => {
    setSavingPost(true);
    try {
      if (isSaved) {
        await unsavePost(post.id);
        setIsSaved(false);
      } else {
        await savePost(post.id);
        setIsSaved(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingPost(false);
      setMenuOpen(false);
    }
  };

  const handleEditSaved = (updated: {
    id: number;
    title?: string;
    description: string;
    post_type: string;
    subtype?: string;
    status: string;
    time_status?: string;
    tags?: string[];
  }) => {
    onEdited({ ...post, ...updated } as FeedPostOut);
    setEditingPost(false);
  };

  const displayImages: { url: string }[] = useMemo(
    () =>
      images.length > 0
        ? images
        : post.images_count === 0 && post.image_url
          ? [{ url: post.image_url }]
          : [],
    [images, post.image_url, post.images_count],
  );
  const totalImages = displayImages.length;

  useEffect(() => {
    if (totalImages === 0) return;
    setImgIndex((prev) => {
      const clamped = prev >= totalImages ? 0 : prev;
      if (clamped !== prev)
        try {
          sessionStorage.setItem(SS_IDX, String(clamped));
        } catch {
          /* noop */
        }
      return clamped;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalImages]);

  const prevImg = () => setImgIndexSaved(Math.max(0, imgIndex - 1));
  const nextImg = () => setImgIndexSaved(Math.min(totalImages - 1, imgIndex + 1));

  return (
    <>
      {/* ─── Wizard de edición (mismo flujo que antes del split) ─────────── */}
      {editingPost && (
        <EditPostWizard
          post={{
            id: post.id,
            title: post.title,
            description: post.description,
            post_type: post.post_type,
            subtype: post.subtype,
            status: "published",
            tags: post.tags,
            deadline_at: post.deadline_at,
            created_at: post.created_at,
            is_pinned: post.is_pinned,
          }}
          onClose={() => setEditingPost(false)}
          onSaved={handleEditSaved}
        />
      )}
      {/* ─── Contenedor tarjeta: sombra suave + hover (micro-interacción feed) ─ */}
      {/* ─── Contenedor tarjeta: sombra suave + hover (micro-interacción feed) ─ */}
      <div
        className={`bg-white border rounded-[22px] shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:-translate-y-[1px] ${
          post.is_pinned
            ? "border-cyan-200 shadow-cyan-50/50 ring-1 ring-cyan-100/50"
            : "border-gray-100"
        }`}
      >
        {post.is_pinned && (
          <div className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-sky-400 via-cyan-500 to-blue-600 text-white text-xs font-bold shadow-sm">
            <Pin className="w-3 h-3" />
            Publicación destacada
            {post.pin_priority === 3 && <span className="ml-auto opacity-80 text-[10px]">UTEC Root</span>}
            {post.pin_priority === 2 && <span className="ml-auto opacity-80 text-[10px]">UTEC Admin</span>}
            {post.pin_priority === 1 && <span className="ml-auto opacity-80 text-[10px]">UTEC Oficina</span>}
          </div>
        )}

        {/* ─── Cabecera: avatar, autor, tags de categoría a la derecha, menú ────────────────────── */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <UserAvatar
              userName={post.user_name}
              userId={post.user_id}
              gradient={gradient}
              profileImageUrl={post.user_profile_image_url}
              currentUserId={currentUserId}
            />
            <div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    navigate(post.user_id === currentUserId ? "/app/perfil" : `/app/perfil/${post.user_id}`)
                  }
                  className="font-bold text-gray-900 hover:text-[#2f55f6] transition-colors text-sm leading-tight flex items-center gap-1.5"
                >
                  <span>{getDisplayName(post.user_name, post.user_id)}</span>
                  {post.user_name && (
                    post.user_name.includes("IEEE") ||
                    post.user_name.includes("UTEC Career") ||
                    post.user_name.includes("UTEC Emprende") ||
                    post.user_name.includes("TECHO")
                  ) && (
                    <svg className="w-3.5 h-3.5 text-blue-500 fill-current shrink-0" viewBox="0 0 24 24">
                      <title>Organización verificada</title>
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="flex items-center gap-1 mt-0.5 text-gray-400">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-[11px] font-semibold">{timeAgo(post.created_at)}</span>
                {post.user_email && (
                  <>
                    <span className="text-gray-300 text-xs">·</span>
                    <p className="text-[11px] font-medium text-gray-400 truncate max-w-[150px]">{post.user_email}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Etiquetas/Tags del post en formato píldora */}
            <div className="flex items-center gap-1.5">
              {post.tags && post.tags.length > 0 ? (
                post.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className={getTagStyles(tag)}>
                    {tag}
                  </span>
                ))
              ) : (
                <>
                  <span className="bg-gray-50 text-gray-600 border border-gray-100 font-semibold px-2.5 py-0.5 text-xs rounded-full">
                    {POST_TYPE_LABELS[post.post_type]}
                  </span>
                  {post.subtype && (
                    <span className="bg-purple-50 text-purple-600 border border-purple-100 font-semibold px-2.5 py-0.5 text-xs rounded-full">
                      {SUBTYPE_LABELS[post.subtype]}
                    </span>
                  )}
                </>
              )}
            </div>

            <ScoreExplanation />
            
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-20 overflow-hidden">
                  <button
                    type="button"
                    onClick={handleSaveToggle}
                    disabled={savingPost}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {isSaved ? (
                      <>
                        <BookmarkCheck className="w-4 h-4 text-[#2563EB]" /> Quitar de guardados
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4 text-gray-500" /> Guardar publicación
                      </>
                    )}
                  </button>
                  {isOwnPost && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setEditingPost(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
                    >
                      <Pencil className="w-4 h-4 text-gray-500" /> Editar publicación
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Título, Descripción y Deadline ─────────────────────────── */}
        <div className="px-4 pt-1.5 pb-3">
          {post.title && (
            <h3 className="font-extrabold text-gray-900 text-base sm:text-lg mb-1 leading-snug tracking-tight">
              {post.title}
            </h3>
          )}
          <p
            ref={descRef}
            className={`text-gray-600 text-sm leading-relaxed whitespace-pre-line font-medium mt-1 ${
              !descExpanded ? "line-clamp-3" : ""
            }`}
          >
            {post.description}
          </p>
          {hasMoreDesc && (
            <button
              type="button"
              onClick={() => setDescExpanded((v) => !v)}
              className="mt-1 text-xs font-semibold text-[#2f55f6] hover:text-[#ba4ef8] transition-colors"
            >
              {descExpanded ? "Ver menos" : "Ver más"}
            </button>
          )}

          {post.deadline_at && (
            <div className="flex items-center justify-between gap-2 mt-2.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>Fecha límite: {formatDate(post.deadline_at)}</span>
              </div>
              {post.deadline_at && isExpired(post.deadline_at) ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full shrink-0">
                  Vencido
                </span>
              ) : post.deadline_at && !isExpired(post.deadline_at) && timeRemaining(post.deadline_at) ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-fuchsia-600 bg-fuchsia-50 border border-fuchsia-100 px-2 py-0.5 rounded-full shrink-0">
                  <Clock className="w-3 h-3" />
                  {timeRemaining(post.deadline_at)}
                </span>
              ) : null}
            </div>
          )}
        </div>

        {post.images_count > 0 && images.length === 0 && (
          <div className="px-4 pb-3">
            <div className="w-full aspect-[16/9] bg-gray-100 animate-pulse rounded-2xl border border-gray-100" />
          </div>
        )}

        {/* ─── Carrusel: translateX + transition 350ms ease-in-out (original) ─ */}
        {totalImages > 0 && (
          <div className="px-4 pb-3">
            <div className="relative w-full aspect-[16/9] bg-gray-50 overflow-hidden rounded-2xl border border-gray-100/70 shadow-sm group">
              <div
                className="flex h-full will-change-transform"
                style={{
                  width: `${totalImages * 100}%`,
                  transform: `translateX(-${(imgIndex / totalImages) * 100}%)`,
                  transition: "transform 350ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                {displayImages.map((img, i) => {
                  const imgData = img as PostImage | { url: string };
                  const objPos =
                    "object_position" in imgData ? (imgData.object_position ?? "center center") : "center center";
                  const sc = "scale" in imgData ? (imgData.scale ?? 1) : 1;
                  return (
                    <img
                      key={i}
                      src={img.url}
                      alt={`Imagen ${i + 1}`}
                      className="h-full object-cover"
                      style={{
                        width: `${100 / totalImages}%`,
                        objectPosition: objPos,
                        transform: `scale(${sc})`,
                        transformOrigin: objPos,
                      }}
                    />
                  );
                })}
              </div>
              {totalImages > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevImg}
                    disabled={imgIndex === 0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-all duration-200 disabled:opacity-0 disabled:pointer-events-none opacity-0 group-hover:opacity-100 shadow-md"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={nextImg}
                    disabled={imgIndex === totalImages - 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-all duration-200 disabled:opacity-0 disabled:pointer-events-none opacity-0 group-hover:opacity-100 shadow-md"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm">
                    {displayImages.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setImgIndexSaved(i)}
                        className={`rounded-full transition-all duration-350 ${
                          i === imgIndex ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ─── Estadísticas de interacciones ─────────────────────────── */}
        <div className="px-4 pb-3 pt-1 flex items-center gap-4 text-xs font-semibold text-gray-400">
          <span className="flex items-center gap-1.5 hover:text-gray-600 transition-colors cursor-default">
            <Eye className="w-3.5 h-3.5 text-gray-400" />
            {viewsCount} vistas
          </span>
          <span className="flex items-center gap-1.5 hover:text-gray-600 transition-colors cursor-default">
            <Bookmark className="w-3.5 h-3.5 text-gray-400" />
            {savesCount} guardados
          </span>
          <span className="flex items-center gap-1.5 hover:text-gray-600 transition-colors cursor-default">
            <CheckCircle className="w-3.5 h-3.5 text-gray-400" />
            {postulationsCount} postulaciones
          </span>
        </div>

        {/* ─── Separador sutil ─────────────────────────── */}
        <div className="border-t border-gray-100/80 w-full" />

        {/* ─── Pie de tarjeta: iconos a la izquierda, Ver más a la derecha ─────────────────── */}
        <div className="px-5 py-4 flex justify-between items-center bg-white">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Corazón / Like */}
            <button
              type="button"
              onClick={handleLikeToggle}
              className={`p-2 rounded-full transition-all duration-300 hover:bg-red-50 flex items-center justify-center ${
                isLiked ? "text-red-500 scale-110" : "text-gray-400 hover:text-red-500 active:scale-95"
              }`}
              title={isLiked ? "Quitar me gusta" : "Me gusta"}
            >
              <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
            </button>

            {/* Guardar / Bookmark */}
            <button
              type="button"
              onClick={handleSaveToggle}
              disabled={savingPost}
              className={`p-2 rounded-full transition-all duration-300 hover:bg-blue-50 flex items-center justify-center ${
                isSaved ? "text-[#2f55f6] scale-110" : "text-gray-400 hover:text-[#2f55f6] active:scale-95"
              }`}
              title={isSaved ? "Quitar de guardados" : "Guardar publicación"}
            >
              {isSaved ? <BookmarkCheck className="w-5 h-5 fill-current" /> : <Bookmark className="w-5 h-5" />}
            </button>

            {/* Compartir / Share */}
            <div className="relative">
              <button
                type="button"
                onClick={handleShare}
                className="p-2 rounded-full text-gray-400 hover:bg-purple-50 hover:text-[#ba4ef8] active:scale-95 transition-all duration-300 flex items-center justify-center"
                title="Compartir publicación"
              >
                <Share2 className="w-5 h-5" />
              </button>
              {copied && (
                <span className="absolute left-1/2 -translate-x-1/2 -top-8 px-2 py-1 text-[10px] font-bold text-white bg-slate-800 rounded shadow-md animate-bounce whitespace-nowrap z-10">
                  ¡Copiado!
                </span>
              )}
            </div>
          </div>

          {/* Botón Ver más → */}
          <button
            type="button"
            onClick={() => setDetailOpen(true)}
            className="bg-gradient-to-r from-[#2f55f6] to-[#ba4ef8] hover:brightness-110 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-[0_4px_14px_rgba(47,85,246,0.25)] hover:shadow-[0_6px_20px_rgba(186,78,248,0.35)] active:scale-95 transition-all duration-300 flex items-center gap-1.5"
          >
            <span>Ver más</span>
            <span className="font-semibold text-sm sm:text-base leading-none">→</span>
          </button>
        </div>
      </div>

      {/* ─── Modal de Detalle Integrado ─── */}
      {detailOpen && (
        <PostDetailModal
          postId={post.id}
          onClose={() => setDetailOpen(false)}
        />
      )}
    </>
  );
}

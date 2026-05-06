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
} from "lucide-react";
import { listImages, type PostImage } from "../../../api/post-images.api";
import { listLinks } from "../../../api/post-links.api";
import { savePost, unsavePost } from "../../../api/saved-posts.api";
import EditPostWizard from "../../../components/EditPostWizard";
import type { FeedPostOut } from "../../../types/post.types";
import { POST_TYPE_LABELS, POST_TYPE_ICONS, SUBTYPE_LABELS } from "../../../types/post.types";
import { formatDate, isExpired, timeAgo, timeRemaining } from "../../../shared/lib/date";
import { TYPE_GRADIENTS } from "../constants/typeGradients";
import { getDisplayName } from "../lib/display";
import { ScoreExplanation } from "./ScoreExplanation";
import { UserAvatar } from "./UserAvatar";

interface PostLink {
  id: number;
  label: string;
  url: string;
  display_type: string;
  position: number;
}

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

  const MAX_DESC_CHARS = 500;
  const [descExpanded, setDescExpanded] = useState(false);

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
  const [links, setLinks] = useState<PostLink[]>([]);
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
    if (post.links_count > 0) {
      listLinks(post.id).then(setLinks).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id, post.images_count, post.links_count]);

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
      <div
        className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-shadow duration-300 ease-out hover:shadow-md ${
          post.is_pinned ? "border-cyan-300 shadow-cyan-100/80 ring-1 ring-cyan-200" : "border-gray-200"
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

        {/* ─── Cabecera: avatar, autor, chips tipo, menú ────────────────────── */}
        <div className="flex items-start justify-between px-4 pt-4 pb-4 sm:pb-3">
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
                  className="font-semibold text-gray-900 hover:text-[#4F46E5] transition-colors text-sm leading-tight"
                >
                  {getDisplayName(post.user_name, post.user_id)}
                </button>
                <span className="hidden sm:inline text-gray-300 text-xs">·</span>
                <span className="hidden sm:inline text-xs text-gray-400">{timeAgo(post.created_at)}</span>
              </div>
              {post.user_email && (
                <p className="text-xs text-gray-400 leading-tight mt-0.5">{post.user_email}</p>
              )}
              <p className="sm:hidden text-xs text-gray-400 leading-tight mt-0.5">{timeAgo(post.created_at)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex sm:flex-col gap-1 items-end">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {POST_TYPE_ICONS[post.post_type]} {POST_TYPE_LABELS[post.post_type]}
              </span>
              {post.subtype && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                  {SUBTYPE_LABELS[post.subtype]}
                </span>
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
                        <BookmarkCheck className="w-4 h-4 text-[#4F46E5]" /> Quitar de guardados
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

        <div className="flex gap-1 px-4 mb-2 sm:hidden items-center flex-wrap">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            {POST_TYPE_ICONS[post.post_type]} {POST_TYPE_LABELS[post.post_type]}
          </span>
          {post.subtype && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
              {SUBTYPE_LABELS[post.subtype]}
            </span>
          )}
        </div>

        {post.images_count > 0 && images.length === 0 && (
          <div className="w-full max-w-[500px] mx-auto aspect-[4/5] bg-gray-200 animate-pulse" />
        )}

        {/* ─── Carrusel: translateX + transition 350ms ease-in-out (original) ─ */}
        {totalImages > 0 && (
          <div className="relative w-full max-w-[500px] mx-auto aspect-[4/5] bg-gray-100 overflow-hidden">
            <div
              className="flex h-full will-change-transform"
              style={{
                width: `${totalImages * 100}%`,
                transform: `translateX(-${(imgIndex / totalImages) * 100}%)`,
                transition: "transform 350ms ease-in-out",
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
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={nextImg}
                  disabled={imgIndex === totalImages - 1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {displayImages.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setImgIndexSaved(i)}
                      className={`rounded-full transition-all ${i === imgIndex ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/60"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── Título, descripción, deadline, tags ─────────────────────────── */}
        <div className="px-4 pt-3 pb-2">
          {post.title && (
            <h3 className="font-bold text-gray-900 text-base mb-1 leading-snug">{post.title}</h3>
          )}
          {(() => {
            const needsTrunc = post.description.length > MAX_DESC_CHARS;
            const displayText =
              needsTrunc && !descExpanded ? post.description.slice(0, MAX_DESC_CHARS) + "…" : post.description;
            return (
              <>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{displayText}</p>
                {needsTrunc && (
                  <button
                    type="button"
                    onClick={() => setDescExpanded((v) => !v)}
                    className="mt-1 text-xs font-medium text-[#4F46E5] hover:text-[#7C3AED] transition-colors"
                  >
                    {descExpanded ? "Ver menos" : "Ver más"}
                  </button>
                )}
              </>
            );
          })()}

          {post.deadline_at && (
            <div className="flex items-center justify-between gap-2 mt-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
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
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
                  <Clock className="w-3 h-3" />
                  {timeRemaining(post.deadline_at)}
                </span>
              ) : null}
            </div>
          )}

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {post.tags.map((tag) => (
                <span key={tag} className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ─── Enlaces CTA (gradiente + secundarios + menú “más”) ───────────── */}
        {links.length > 0 && (
          <div className="px-4 pb-3 flex gap-2 items-stretch">
            {links[0] && (
              <a
                href={links[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center py-2.5 px-3 rounded-xl text-sm font-medium bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white shadow hover:shadow-md transition-all"
              >
                {links[0].label}
              </a>
            )}
            {links[1] && (
              <a
                href={links[1].url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center py-2.5 px-3 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-all"
              >
                {links[1].label}
              </a>
            )}
            {links.length > 2 && (
              <div className="relative" ref={extraMenuRef}>
                <button
                  type="button"
                  onClick={() => setExtraMenuOpen((v) => !v)}
                  className="py-2.5 px-2.5 rounded-xl bg-gray-100 border border-gray-200 text-gray-600 hover:bg-gray-200 transition-colors flex items-center justify-center"
                  title="Más enlaces"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {extraMenuOpen && (
                  <div className="absolute right-0 bottom-full mb-1 w-52 bg-white rounded-xl shadow-lg border border-gray-200 z-30 overflow-hidden">
                    {links.slice(2).map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setExtraMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-base">🔗</span>
                        <span className="truncate">{link.label}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

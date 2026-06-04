import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  MoreVertical,
  Pencil,
  Star,
  X,
  Archive,
} from "lucide-react";
import { motion } from "framer-motion";
import { listImages, type PostImage } from "../../../api/post-images.api";
import { listLinks } from "../../../api/post-links.api";
import { savePost, unsavePost } from "../../../api/saved-posts.api";
import { archivePost, unarchivePost } from "../../../api/posts.api";
import EditPostWizard from "../../../components/EditPostWizard";
import { POST_TYPE_LABELS, SUBTYPE_LABELS, type FeedPostOut } from "../../../types/post.types";
import { getWordTruncatedText } from "../../../shared/lib/wordCount";
import {
  aspectRatioValue,
  FEED_POST_CARD_MAX_WIDTH,
  normalizeAspectRatio,
} from "../../../shared/lib/aspectRatio";
import { formatDate, isExpired, timeAgo, timeRemaining } from "../../../shared/lib/date";
import { UTOPP_BRAND } from "../../../shared/constants/brand";
import { TYPE_GRADIENTS } from "../constants/typeGradients";
import { getDisplayName } from "../lib/display";
import { PostImageViewerModal } from "./PostImageViewerModal";
import { UserAvatar } from "./UserAvatar";
import { resolvePostImageUrl } from "../../../shared/lib/postImageUrl";
import { ProfileLink } from "../../profile/components/ProfileLink";

type PostCardProps = {
  post: FeedPostOut;
  currentUserId: number | null;
  onEdited: (updated: FeedPostOut) => void;
  onDeleted?: (id: number) => void;
};

type PostActionLink = {
  id: number;
  label: string;
  url: string;
  display_type?: string;
  position: number;
};

export function PostCard({ post, currentUserId, onEdited, onDeleted }: PostCardProps) {
  const SS_IDX = `utopp:carousel:idx:${post.id}`;
  const SS_IMGS = `utopp:carousel:imgs:${post.id}`;
  const ULTRA_WIDE_RATIO = 2.5;
  const WIDE_RATIO = 1.45;
  const TALL_RATIO = 0.78;
  const ULTRA_TALL_RATIO = 0.56;
  const SWIPE_THRESHOLD_PX = 40;

  const [descExpanded, setDescExpanded] = useState(false);
  const [currentImageRatio, setCurrentImageRatio] = useState<number | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [actionLinks, setActionLinks] = useState<PostActionLink[]>([]);
  const [extraLinksOpen, setExtraLinksOpen] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef<number>(0);
  const didSwipeRef = useRef(false);
  const [archiving, setArchiving] = useState(false);

  const handleArchiveToggle = async () => {
    if (archiving) return;
    if (post.status !== "archived") {
      const ok = window.confirm(
        "¿Estás seguro de que deseas archivar esta publicación? Dejará de mostrarse en el feed público y no podrás editarla."
      );
      if (!ok) return;
    }
    setArchiving(true);
    try {
      if (post.status === "archived") {
        const updated = await unarchivePost(post.id);
        onEdited({ ...post, ...updated } as FeedPostOut);
      } else {
        const updated = await archivePost(post.id);
        onEdited({ ...post, ...updated } as FeedPostOut);
      }
    } catch (e) {
      console.error("Error archiving/unarchiving post:", e);
    } finally {
      setArchiving(false);
    }
  };

  const visibleLinks = useMemo(() => actionLinks.slice(0, 3), [actionLinks]);
  const overflowLinks = useMemo(() => actionLinks.slice(3), [actionLinks]);
  const canEdit = currentUserId !== null && post.user_id === currentUserId;
  const showMoreLinksButton = overflowLinks.length > 0;

  const { truncatedText, needsToggle: needsDescriptionToggle } = useMemo(() => {
    return getWordTruncatedText(post.description, 30);
  }, [post.description]);

  const descriptionText =
    !descExpanded && needsDescriptionToggle
      ? truncatedText
      : post.description;

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
  const [savingPost, setSavingPost] = useState(false);
  const [editingPost, setEditingPost] = useState(false);

  const [participationMenuOpen, setParticipationMenuOpen] = useState(false);
  const participationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!participationMenuOpen) return;

    const handleClose = (e: MouseEvent | TouchEvent) => {
      if (participationRef.current && !participationRef.current.contains(e.target as Node)) {
        setParticipationMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClose);
    document.addEventListener("touchstart", handleClose);
    return () => {
      document.removeEventListener("mousedown", handleClose);
      document.removeEventListener("touchstart", handleClose);
    };
  }, [participationMenuOpen]);


  const gradient = TYPE_GRADIENTS[post.post_type] ?? TYPE_GRADIENTS.simple_post;

  useEffect(() => {
    if (post.images_count === 0) return

    let cancelled = false
    listImages(post.id)
      .then((imgs) => {
        if (cancelled) return
        setImages(imgs)
        try {
          sessionStorage.setItem(SS_IMGS, JSON.stringify(imgs))
        } catch {
          /* noop */
        }
      })
      .catch(() => {
        /* noop */
      })

    return () => {
      cancelled = true
    }
  }, [post.id, post.images_count])

  useEffect(() => {
    let cancelled = false;
    listLinks(post.id)
      .then((links) => {
        if (cancelled) return;
        const sorted = [...(links as PostActionLink[])].sort((a, b) => a.position - b.position);
        setActionLinks(sorted);
      })
      .catch(() => {
        if (!cancelled) setActionLinks([]);
      });
    return () => {
      cancelled = true;
    };
  }, [post.id]);

  const handleSaveToggle = async () => {
    if (savingPost) return;
    setSavingPost(true);
    try {
      if (isSaved) {
        await unsavePost(post.id);
        setIsSaved(false);
        onDeleted?.(post.id);
      } else {
        await savePost(post.id);
        setIsSaved(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingPost(false);
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
        : post.image_url
          ? [{ url: post.image_url }]
          : [],
    [images, post.image_url],
  );
  const resolvedDisplayImages = useMemo(
    () => displayImages.map((image) => ({ ...image, url: resolvePostImageUrl(image.url) })),
    [displayImages],
  );
  const totalImages = resolvedDisplayImages.length;

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

  useEffect(() => {
    if (totalImages === 0) {
      setCurrentImageRatio(null);
      return;
    }

    const currentImage = resolvedDisplayImages[imgIndex];
    if (!currentImage?.url) return;

    let cancelled = false;
    const image = new Image();

    image.onload = () => {
      if (cancelled || image.naturalWidth <= 0 || image.naturalHeight <= 0) return;
      setCurrentImageRatio(image.naturalWidth / image.naturalHeight);
    };
    image.onerror = () => {
      if (!cancelled) setCurrentImageRatio(null);
    };

    image.src = currentImage.url;
    return () => {
      cancelled = true;
    };
  }, [resolvedDisplayImages, imgIndex, totalImages]);

  useEffect(() => {
    if (!extraLinksOpen) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExtraLinksOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [extraLinksOpen]);

  const prevImg = () => setImgIndexSaved(Math.max(0, imgIndex - 1));
  const nextImg = () => setImgIndexSaved(Math.min(totalImages - 1, imgIndex + 1));

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (totalImages <= 1) return;
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
    touchDeltaXRef.current = 0;
    didSwipeRef.current = false;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null || totalImages <= 1) return;
    const currentX = event.touches[0]?.clientX;
    if (typeof currentX !== "number") return;
    touchDeltaXRef.current = currentX - touchStartXRef.current;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || totalImages <= 1) return;
    const delta = touchDeltaXRef.current;
    if (Math.abs(delta) >= SWIPE_THRESHOLD_PX) {
      if (delta < 0 && imgIndex < totalImages - 1) nextImg();
      if (delta > 0 && imgIndex > 0) prevImg();
      didSwipeRef.current = true;
    }
    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;
  };

  const handleMediaClick = () => {
    if (didSwipeRef.current) {
      didSwipeRef.current = false;
      return;
    }
    setViewerOpen(true);
  };
  const mediaPresentation = useMemo(() => {
    // Formato fijo estilo Instagram persistido en el post: el frame usa ese ratio
    // exacto con object-cover + object_position/scale guardados.
    if (post.aspect_ratio) {
      const fixedRatio = aspectRatioValue(normalizeAspectRatio(post.aspect_ratio));
      return {
        objectFit: "cover" as const,
        mediaAspectRatio: fixedRatio,
        minMediaHeight: 0,
        maxMediaHeight: undefined as number | undefined,
      };
    }

    const ratio = currentImageRatio;
    if (!ratio || !Number.isFinite(ratio)) {
      return {
        objectFit: "contain" as const,
        mediaAspectRatio: 16 / 9,
        minMediaHeight: 220,
        maxMediaHeight: 520,
      };
    }

    if (ratio >= ULTRA_WIDE_RATIO) {
      return {
        objectFit: "cover" as const,
        mediaAspectRatio: 2.2,
        minMediaHeight: 220,
        maxMediaHeight: 340,
      };
    }

    if (ratio >= WIDE_RATIO) {
      return {
        objectFit: "contain" as const,
        mediaAspectRatio: ratio,
        minMediaHeight: 220,
        maxMediaHeight: 460,
      };
    }

    if (ratio >= 1) {
      return {
        objectFit: "contain" as const,
        mediaAspectRatio: ratio,
        minMediaHeight: 250,
        maxMediaHeight: 620,
      };
    }

    if (ratio >= TALL_RATIO) {
      return {
        objectFit: "contain" as const,
        mediaAspectRatio: ratio,
        minMediaHeight: 300,
        maxMediaHeight: 760,
      };
    }

    if (ratio >= ULTRA_TALL_RATIO) {
      return {
        objectFit: "contain" as const,
        mediaAspectRatio: ratio,
        minMediaHeight: 360,
        maxMediaHeight: 900,
      };
    }

    return {
      objectFit: "contain" as const,
      mediaAspectRatio: ratio,
      minMediaHeight: 420,
      maxMediaHeight: 980,
    };
  }, [currentImageRatio, post.aspect_ratio]);

  const hasDeadline = Boolean(post.deadline_at);
  const deadlineExpired = post.deadline_at ? isExpired(post.deadline_at) : false;
  const deadlineRemaining = post.deadline_at ? timeRemaining(post.deadline_at) : null;

  return (
    <>
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
            aspect_ratio: post.aspect_ratio,
          }}
          onClose={() => setEditingPost(false)}
          onSaved={handleEditSaved}
        />
      )}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20, scale: 0.98 },
          show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
        }}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className={`relative mx-auto h-auto w-full overflow-hidden rounded-[22px] border bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)] ${
          post.is_pinned
            ? "border-amber-200/75 shadow-[0_4px_24px_rgba(245,158,11,0.04)] ring-1 ring-amber-100/30"
            : "border-gray-100"
        } ${post.status === "archived" ? "opacity-75" : ""}`}
        style={{ maxWidth: `${FEED_POST_CARD_MAX_WIDTH}px` }}
      >
        {canEdit && (
          <div className="flex items-center justify-end gap-2 border-b border-gray-100/80 bg-gray-50/70 px-4 py-2">
            <button
              type="button"
              onClick={() => setEditingPost(true)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-white hover:text-[#2f55f6] active:scale-[0.98]"
              title="Editar publicación"
              aria-label="Editar publicación"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </button>
            <button
              type="button"
              onClick={handleArchiveToggle}
              disabled={archiving}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors active:scale-[0.98] ${
                post.status === "archived"
                  ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                  : "text-gray-600 hover:bg-white hover:text-amber-600"
              }`}
              title={post.status === "archived" ? "Desarchivar publicación" : "Archivar publicación"}
              aria-label={post.status === "archived" ? "Desarchivar publicación" : "Archivar publicación"}
            >
              {archiving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Archive className="h-3.5 w-3.5" />
              )}
              {post.status === "archived" ? "Desarchivar" : "Archivar"}
            </button>
          </div>
        )}

        {post.is_pinned && (
          <div className="px-4 pt-3.5 flex">
            <span className="inline-flex items-center gap-1.5 bg-[#fff6e6] border border-[#ffe0b2] text-[#b25e00] text-[10px] sm:text-xs font-extrabold px-3 py-1 rounded-full shadow-sm">
              <Star className="w-3 h-3 fill-current shrink-0" /> Publicación destacada
            </span>
          </div>
        )}

        <div className="flex items-start justify-between gap-4 px-4 pb-3 pt-4">
          <div className="flex min-w-0 items-center gap-3">
            <UserAvatar
              userName={post.user_name}
              userId={post.user_id}
              gradient={gradient}
              profileImageUrl={post.user_profile_image_url}
              currentUserId={currentUserId}
            />
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <ProfileLink
                  userId={post.user_id}
                  currentUserId={currentUserId}
                  className="flex min-w-0 items-center gap-1.5 text-left text-sm font-bold leading-tight text-gray-900 transition-colors hover:text-[#2f55f6]"
                >
                  <span className="truncate">{getDisplayName(post.user_name, post.user_id)}</span>
                  {post.user_name && (
                    post.user_name.includes("IEEE") ||
                    post.user_name.includes("TECHO")
                  ) && (
                    <svg className="w-3.5 h-3.5 text-blue-500 fill-current shrink-0" viewBox="0 0 24 24">
                      <title>Organización verificada</title>
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  )}
                </ProfileLink>
              </div>
              {post.user_email ? (
                <p className="mt-0.5 truncate text-xs font-medium text-gray-500">{post.user_email}</p>
              ) : null}
              <div className="mt-1 flex items-center gap-1 text-gray-400">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-[11px] font-semibold">{timeAgo(post.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="max-w-[48%] shrink-0 text-right">
            <div className="flex flex-wrap justify-end gap-1.5">
              {post.status === "archived" && (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                  Archivado
                </span>
              )}
              <span className="rounded-full border border-gray-100 bg-gray-50 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                {POST_TYPE_LABELS[post.post_type]}
              </span>
              {post.subtype ? (
                <span className="rounded-full border border-purple-100 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                  {SUBTYPE_LABELS[post.subtype]}
                </span>
              ) : null}
            </div>
            {hasDeadline ? (
              <div className="mt-6 flex flex-col items-end gap-1">
                {deadlineExpired ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600">
                    Venció el {formatDate(post.deadline_at!)}
                  </span>
                ) : deadlineRemaining ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-fuchsia-100 bg-fuchsia-50 px-2.5 py-1 text-[11px] font-semibold text-fuchsia-600">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(post.deadline_at!)} · {deadlineRemaining}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                    Límite: {formatDate(post.deadline_at!)}
                  </span>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="px-4 pb-3 pt-1.5">
          {post.title ? (
            <h3 className="mb-1 text-base font-extrabold leading-snug tracking-tight text-gray-900 sm:text-lg">
              {post.title}
            </h3>
          ) : null}
          <p 
            onClick={needsDescriptionToggle ? () => setDescExpanded((v) => !v) : undefined}
            className={`mt-1 whitespace-pre-line text-sm font-medium leading-relaxed text-gray-600 ${
              needsDescriptionToggle ? "cursor-pointer hover:text-gray-800 transition-colors select-none" : ""
            }`}
          >
            {descriptionText}
          </p>
          {needsDescriptionToggle ? (
            <button
              type="button"
              onClick={() => setDescExpanded((v) => !v)}
              className="mt-1 text-xs font-semibold text-[#2f55f6] transition-colors hover:text-[#ba4ef8]"
            >
              {descExpanded ? "Ver menos" : "Ver más"}
            </button>
          ) : null}
        </div>

        {post.images_count > 0 && images.length === 0 && (
          <div className="px-4 pb-3">
            <div className="w-full animate-pulse rounded-2xl border border-gray-100 bg-gray-100" style={{ aspectRatio: "16 / 9" }} />
          </div>
        )}

        {totalImages > 0 && (
          <div className="px-4 pb-3">
            <div
              className="group relative w-full overflow-hidden rounded-2xl border border-gray-100/70 bg-gray-50 shadow-sm"
              style={{
                aspectRatio: String(mediaPresentation.mediaAspectRatio),
                ...(mediaPresentation.minMediaHeight > 0
                  ? { minHeight: `${mediaPresentation.minMediaHeight}px` }
                  : {}),
                ...(mediaPresentation.maxMediaHeight != null
                  ? { maxHeight: `${mediaPresentation.maxMediaHeight}px` }
                  : {}),
              }}
              onClick={handleMediaClick}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="flex h-full will-change-transform"
                style={{
                  width: `${totalImages * 100}%`,
                  transform: `translateX(-${(imgIndex / totalImages) * 100}%)`,
                  transition: "transform 520ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                {resolvedDisplayImages.map((img, i) => {
                  const imgData = img as PostImage | { url: string };
                  const objPos =
                    "object_position" in imgData ? (imgData.object_position ?? "center center") : "center center";
                  const sc = "scale" in imgData ? (imgData.scale ?? 1) : 1;
                  const imageTransform =
                    mediaPresentation.objectFit === "cover" && Number.isFinite(sc) && sc !== 1
                      ? `scale(${sc})`
                      : undefined;
                  return (
                    <div key={i} className="h-full flex-none shrink-0" style={{ width: `${100 / totalImages}%` }}>
                      <img
                        src={img.url}
                        alt={`Imagen ${i + 1}`}
                        className={`h-full w-full ${mediaPresentation.objectFit === "cover" ? "object-cover" : "object-contain"}`}
                        style={{
                          objectPosition: objPos,
                          transform: imageTransform,
                          transformOrigin: objPos,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              {totalImages > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      prevImg();
                    }}
                    disabled={imgIndex === 0}
                    aria-label="Imagen anterior"
                    onMouseDown={(event) => event.stopPropagation()}
                    className="absolute left-3 top-1/2 z-10 -translate-y-1/2 w-8 h-8 bg-black/45 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none shadow-md"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      nextImg();
                    }}
                    disabled={imgIndex === totalImages - 1}
                    aria-label="Imagen siguiente"
                    onMouseDown={(event) => event.stopPropagation()}
                    className="absolute right-3 top-1/2 z-10 -translate-y-1/2 w-8 h-8 bg-black/45 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none shadow-md"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm">
                    {resolvedDisplayImages.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setImgIndexSaved(i);
                        }}
                        onMouseDown={(event) => event.stopPropagation()}
                        className={`rounded-full transition-all duration-350 ${
                          i === imgIndex ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
                        }`}
                      />
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}

        {post.tags && post.tags.length > 0 ? (
          <div className="px-4 pb-3">
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <span key={tag} className={getTagStyles(tag)}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="border-t border-gray-100/80 w-full" />

        <div className="flex items-center justify-between gap-4 rounded-b-[22px] bg-white px-4 py-3.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveToggle}
              className={`inline-flex h-8 w-8 items-center justify-center transition-colors ${
                isSaved
                  ? "text-[#2f55f6]"
                  : "text-gray-400 hover:text-[#9333EA]"
              } ${savingPost ? "opacity-80" : ""} active:scale-95`}
              title={isSaved ? "Quitar de guardados" : "Guardar publicación"}
              aria-label={isSaved ? "Quitar de guardados" : "Guardar publicación"}
            >
              {savingPost ? (
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: UTOPP_BRAND.blue }} />
              ) : isSaved ? (
                <BookmarkCheck className="h-5 w-5" style={{ color: UTOPP_BRAND.blue }} />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
            </button>

          </div>

          <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
            {visibleLinks.map((link, index) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={
                  index === 0
                    ? "inline-flex max-w-[160px] items-center justify-center truncate rounded-full bg-gradient-to-r from-[#2f55f6] to-[#ba4ef8] px-4 py-2 text-xs font-bold text-white shadow-[0_4px_14px_rgba(47,85,246,0.25)] transition-all duration-300 hover:brightness-110 hover:shadow-[0_6px_20px_rgba(186,78,248,0.35)] sm:text-sm"
                    : "inline-flex max-w-[160px] items-center justify-center truncate rounded-full border border-gray-200 bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-200 sm:text-sm"
                }
                title={link.label}
              >
                <span className="truncate">{link.label}</span>
              </a>
            ))}
            {showMoreLinksButton ? (
              <button
                type="button"
                onClick={() => setExtraLinksOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900 active:scale-95"
                title="Ver enlaces adicionales"
                aria-label="Ver enlaces adicionales"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
        {extraLinksOpen ? (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/35 p-4"
            onClick={() => setExtraLinksOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Enlaces adicionales"
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-4 shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">Enlaces adicionales</h3>
                <button
                  type="button"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
                  onClick={() => setExtraLinksOpen(false)}
                  aria-label="Cerrar enlaces adicionales"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                {overflowLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                  >
                    <span className="block truncate">{link.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </motion.div>

      {viewerOpen ? (
        <PostImageViewerModal
          images={resolvedDisplayImages.map((image) => {
            const imageData = image as PostImage | { url: string };
            return {
              url: image.url,
              objectPosition: "object_position" in imageData ? (imageData.object_position ?? "center center") : "center center",
              scale: "scale" in imageData ? (imageData.scale ?? 1) : 1,
            };
          })}
          initialIndex={imgIndex}
          onClose={() => setViewerOpen(false)}
        />
      ) : null}
    </>
  );
}

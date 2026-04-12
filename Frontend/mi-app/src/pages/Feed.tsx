import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Info, MoreVertical, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Pencil, Filter, Clock } from 'lucide-react'
import { getFeed } from '../api/feed.api'
import { listImages, type PostImage } from '../api/post-images.api'
import { listLinks } from '../api/post-links.api'
import { savePost, unsavePost } from '../api/saved-posts.api'
import { getMyProfile } from '../api/users.api'
import EditPostWizard from '../components/EditPostWizard'
import { INTERESTS } from '../constants/interests'
import {
  type FeedPostOut,
  type FeedResponse,
  POST_TYPE_LABELS,
  POST_TYPE_ICONS,
  SUBTYPE_LABELS,
} from '../types/post.types'

// ── Helpers de UI ────────────────────────────────────────

/** Avatar del usuario: muestra foto de Cloudinary si está en localStorage, si no iniciales */
const UserAvatar = ({ userName, userId, gradient, profileImageUrl, currentUserId }: { userName?: string; userId?: number; gradient: string; profileImageUrl?: string; currentUserId?: number | null }) => {
  const navigate = useNavigate()
  const avatarUrl = profileImageUrl ?? (userId ? localStorage.getItem(`avatar_${userId}`) : null)
  const initial = (userName ?? 'U').charAt(0).toUpperCase()
  const handleClick = () => {
    if (!userId) return
    navigate(userId === currentUserId ? '/app/perfil' : `/app/perfil/${userId}`)
  }
  if (avatarUrl) {
    return (
      <button onClick={handleClick} className="shrink-0 rounded-full focus:outline-none">
        <img
          src={avatarUrl}
          alt={userName ?? 'Usuario'}
          className="w-10 h-10 rounded-full object-cover border border-gray-200 hover:opacity-90 transition-opacity"
        />
      </button>
    )
  }
  return (
    <button
      onClick={handleClick}
      className={`w-10 h-10 ${gradient} rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 hover:opacity-90 transition-opacity focus:outline-none`}
    >
      {initial}
    </button>
  )
}

/** Devuelve el nombre visible del usuario o un fallback */
const getDisplayName = (userName?: string, userId?: number) => {
  if (userName?.trim()) return userName
  return userId ? `Usuario ${userId}` : 'Usuario Anónimo'
}

/** Formatea una fecha ISO a texto legible en español */
const formatDate = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

/** Determina si una fecha ya venció (client-side, ignora time_status almacenado) */
function isExpired(iso?: string): boolean {
  if (!iso) return false
  return new Date(iso).getTime() <= Date.now()
}

/** Convierte fecha ISO a tiempo relativo en español */
function timeAgo(iso?: string): string {
  if (!iso) return ''
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60)       return 'hace un momento'
  if (diff < 3600)     return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400)    return `hace ${Math.floor(diff / 3600)} h`
  if (diff < 604800)   return `hace ${Math.floor(diff / 86400)} días`
  if (diff < 2592000)  return `hace ${Math.floor(diff / 604800)} sem`
  return `hace ${Math.floor(diff / 2592000)} meses`
}

/** Retorna texto de tiempo restante hasta una fecha futura */
function timeRemaining(iso?: string): string | null {
  if (!iso) return null
  const diff = Math.floor((new Date(iso).getTime() - Date.now()) / 1000)
  if (diff <= 0) return null
  if (diff < 3600)    return `${Math.floor(diff / 60)}min`
  if (diff < 86400)   return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}min`
  if (diff < 604800)  return `${Math.floor(diff / 86400)}d ${Math.floor((diff % 86400) / 3600)}h`
  return `${Math.floor(diff / 604800)} sem`
}

interface PostLink  { id: number; label: string; url: string; display_type: string; position: number }

// ── Componente de explicación de relevancia ───────────────

/**
 * Botón de información que explica al usuario por qué se le muestra este post.
 * Muestra un popover con los factores de relevancia del algoritmo.
 */

const ScoreExplanation = ({ score }: { score?: number }) => {
  const [show, setShow] = useState(false)
  if (!score) return null

  const factors = [
    { name: 'Intereses', pct: 40 },
    { name: 'Proximidad social', pct: 25 },
    { name: 'Recencia', pct: 20 },
    { name: 'Ciclo académico', pct: 10 },
    { name: 'Disponibilidad', pct: 5 },
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setShow(v => !v)}
        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        title="¿Por qué te recomendamos esto?"
      >
        <Info className="w-4 h-4 text-gray-400" />
      </button>
      {show && (
        <div className="absolute top-full right-0 w-72 bg-white rounded-lg shadow-lg p-4 z-50 border border-gray-200">
          <h4 className="font-semibold mb-3 text-gray-900 text-sm">¿Por qué te lo recomendamos?</h4>
          <div className="space-y-2">
            {factors.map(f => (
              <div key={f.name} className="flex justify-between items-center">
                <span className="text-xs text-gray-700">{f.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-1.5">
                    <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${f.pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-400">{f.pct}%</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between text-xs">
            <span className="text-gray-500">Score total</span>
            <span className="font-bold text-purple-600">{score.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tarjeta de post unificada ────────────────────────────

/**
 * PostCard: renderiza cualquier tipo de post del feed usando el schema FeedPostOut.
 * Incluye carrusel de imágenes (carga lazy), botones de links, avatar real,
 * email + tiempo relativo, menú de guardar post.
 */
const PostCard = ({ post, currentUserId, onEdited }: { post: FeedPostOut; currentUserId: number | null; onEdited: (updated: FeedPostOut) => void }) => {
  const navigate = useNavigate()

  // ── Claves de sessionStorage para este post ───────────
  const SS_IDX  = `utopp:carousel:idx:${post.id}`
  const SS_IMGS = `utopp:carousel:imgs:${post.id}`

  // ── Estado local del post card ────────────────────────
  const MAX_DESC_CHARS = 500
  const [descExpanded, setDescExpanded] = useState(false)

  const [images, setImages] = useState<PostImage[]>(() => {
    try {
      const saved = sessionStorage.getItem(SS_IMGS)
      return saved ? (JSON.parse(saved) as PostImage[]) : []
    } catch { return [] }
  })
  const [imgIndex, setImgIndex] = useState(() => {
    try { return parseInt(sessionStorage.getItem(SS_IDX) ?? '0', 10) || 0 }
    catch { return 0 }
  })

  const setImgIndexSaved = (i: number) => {
    setImgIndex(i)
    try { sessionStorage.setItem(SS_IDX, String(i)) } catch { /* noop */ }
  }
  const [links, setLinks] = useState<PostLink[]>([])
  const [isSaved, setIsSaved]           = useState(post.is_saved)
  const [menuOpen, setMenuOpen]         = useState(false)
  const [savingPost, setSavingPost]     = useState(false)
  const [extraMenuOpen, setExtraMenuOpen] = useState(false)
  const [editingPost, setEditingPost]   = useState(false)

  const isOwnPost = currentUserId !== null && post.user_id === currentUserId
  const menuRef                         = useRef<HTMLDivElement>(null)
  const extraMenuRef                    = useRef<HTMLDivElement>(null)

  // Gradientes de color por tipo de post para el avatar de usuario
  const typeGradients: Record<string, string> = {
    international_opportunity: 'bg-gradient-to-br from-blue-500 to-cyan-500',
    event:                     'bg-gradient-to-br from-purple-500 to-pink-500',
    academic_project:          'bg-gradient-to-br from-green-500 to-emerald-500',
    announcement:              'bg-gradient-to-br from-orange-500 to-red-500',
    simple_post:               'bg-gradient-to-br from-gray-500 to-slate-500',
  }
  const gradient = typeGradients[post.post_type] ?? typeGradients.simple_post

  // Carga lazy de imágenes y links al montar
  useEffect(() => {
    if (post.images_count > 0) {
      listImages(post.id).then(imgs => {
        setImages(imgs)
        try { sessionStorage.setItem(SS_IMGS, JSON.stringify(imgs)) } catch { /* noop */ }
      }).catch(() => { /* noop */ })
    }
    if (post.links_count > 0) {
      listLinks(post.id).then(setLinks).catch(() => {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id, post.images_count, post.links_count])

  // Cierra los menús al hacer clic fuera
  useEffect(() => {
    if (!menuOpen && !extraMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
      if (extraMenuOpen && extraMenuRef.current && !extraMenuRef.current.contains(e.target as Node)) {
        setExtraMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen, extraMenuOpen])

  // ── Acciones ─────────────────────────────────────────
  const handleSaveToggle = async () => {
    setSavingPost(true)
    try {
      if (isSaved) { await unsavePost(post.id); setIsSaved(false) }
      else         { await savePost(post.id);   setIsSaved(true)  }
    } catch (e) { console.error(e) }
    finally { setSavingPost(false); setMenuOpen(false) }
  }

  const handleEditSaved = (updated: { id: number; title?: string; description: string; post_type: string; subtype?: string; status: string; time_status?: string; tags?: string[] }) => {
    onEdited({ ...post, ...updated } as import('../types/post.types').FeedPostOut)
    setEditingPost(false)
  }

  // Si el post tiene imágenes con datos de recorte, usarlas directamente.
  // Si no hay imágenes cargadas aún pero images_count > 0, mostrar skeleton (no fallback sin crop).
  // Solo usar post.image_url si images_count === 0 (post sin galería adicional).
  const displayImages: { url: string }[] = useMemo(
    () => images.length > 0
      ? images
      : post.images_count === 0 && post.image_url
        ? [{ url: post.image_url }]
        : [],
    [images, post.image_url, post.images_count],
  )
  const totalImages = displayImages.length

  // Mantiene el índice dentro del rango cuando cambia la lista
  useEffect(() => {
    if (totalImages === 0) return
    setImgIndex(prev => {
      const clamped = prev >= totalImages ? 0 : prev
      if (clamped !== prev) try { sessionStorage.setItem(SS_IDX, String(clamped)) } catch { /* noop */ }
      return clamped
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalImages])

  const prevImg = () => setImgIndexSaved(Math.max(0, imgIndex - 1))
  const nextImg = () => setImgIndexSaved(Math.min(totalImages - 1, imgIndex + 1))

  return (
    <>
    {editingPost && (
      <EditPostWizard
        post={{ id: post.id, title: post.title, description: post.description, post_type: post.post_type, subtype: post.subtype, status: 'published', tags: post.tags, created_at: post.created_at }}
        onClose={() => setEditingPost(false)}
        onSaved={handleEditSaved}
      />
    )}
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

      {/* ── Header: avatar + nombre + email + tiempo + badges + menú ── */}
      <div className="flex items-start justify-between px-4 pt-4 pb-4 sm:pb-3">
        <div className="flex items-center gap-3">
          <UserAvatar userName={post.user_name} userId={post.user_id} gradient={gradient} profileImageUrl={post.user_profile_image_url} currentUserId={currentUserId} />
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(post.user_id === currentUserId ? '/app/perfil' : `/app/perfil/${post.user_id}`)}
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
            <p className="sm:hidden text-xs text-gray-400 leading-tight mt-0.5">
              {timeAgo(post.created_at)}
            </p>
          </div>
        </div>

        {/* Badges + menú ⋮ */}
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
          {/* Tres puntos — menú de opciones */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-20 overflow-hidden">
                <button
                  onClick={handleSaveToggle}
                  disabled={savingPost}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {isSaved
                    ? <><BookmarkCheck className="w-4 h-4 text-[#4F46E5]" /> Quitar de guardados</>
                    : <><Bookmark className="w-4 h-4 text-gray-500" /> Guardar publicación</>
                  }
                </button>
                {isOwnPost && (
                  <button
                    onClick={() => { setMenuOpen(false); setEditingPost(true) }}
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

      {/* ── Tipo/Subtipo en móvil (en fila) ───────────────── */}
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

      {/* ── Skeleton mientras cargan imágenes con datos de recorte ── */}
      {post.images_count > 0 && images.length === 0 && (
        <div className="w-full max-w-[500px] mx-auto aspect-[4/5] bg-gray-200 animate-pulse" />
      )}

      {/* ── Carrusel de imágenes (slide CSS) ────────────────────────── */}
      {totalImages > 0 && (
        <div className="relative w-full max-w-[500px] mx-auto aspect-[4/5] bg-gray-100 overflow-hidden">
          {/* Fila de imágenes: slide via translateX */}
          <div
            className="flex h-full"
            style={{
              width: `${totalImages * 100}%`,
              transform: `translateX(-${(imgIndex / totalImages) * 100}%)`,
              transition: 'transform 350ms ease-in-out',
            }}
          >
            {displayImages.map((img, i) => {
              const imgData = img as PostImage | { url: string }
              const objPos = 'object_position' in imgData ? (imgData.object_position ?? 'center center') : 'center center'
              const sc     = 'scale' in imgData ? (imgData.scale ?? 1) : 1
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
              )
            })}
          </div>
          {/* Flechas de navegación */}
          {totalImages > 1 && (
            <>
              <button
                onClick={prevImg}
                disabled={imgIndex === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextImg}
                disabled={imgIndex === totalImages - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              {/* Dots indicadores */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {displayImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIndexSaved(i)}
                    className={`rounded-full transition-all ${i === imgIndex ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/60'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Contenido: título, descripción, deadline, tags ─ */}
      <div className="px-4 pt-3 pb-2">
        {post.title && (
          <h3 className="font-bold text-gray-900 text-base mb-1 leading-snug">{post.title}</h3>
        )}
        {(() => {
          const needsTrunc = post.description.length > MAX_DESC_CHARS
          const displayText = needsTrunc && !descExpanded
            ? post.description.slice(0, MAX_DESC_CHARS) + '…'
            : post.description
          return (
            <>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                {displayText}
              </p>
              {needsTrunc && (
                <button
                  onClick={() => setDescExpanded(v => !v)}
                  className="mt-1 text-xs font-medium text-[#4F46E5] hover:text-[#7C3AED] transition-colors"
                >
                  {descExpanded ? 'Ver menos' : 'Ver más'}
                </button>
              )}
            </>
          )
        })()}

        {post.deadline_at && (
          <div className="flex items-center justify-between gap-2 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
            {post.tags.map(tag => (
              <span key={tag} className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* ── Botones CTA + overflow de links extra ──────── */}
      {links.length > 0 && (
        <div className="px-4 pb-3 flex gap-2 items-stretch">
          {/* Link 0: botón primario gradiente */}
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
          {/* Link 1: botón secundario gris */}
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
          {/* Botón overflow ⋮ para links[2+] */}
          {links.length > 2 && (
            <div className="relative" ref={extraMenuRef}>
              <button
                onClick={() => setExtraMenuOpen(v => !v)}
                className="py-2.5 px-2.5 rounded-xl bg-gray-100 border border-gray-200 text-gray-600 hover:bg-gray-200 transition-colors flex items-center justify-center"
                title="Más enlaces"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {extraMenuOpen && (
                <div className="absolute right-0 bottom-full mb-1 w-52 bg-white rounded-xl shadow-lg border border-gray-200 z-30 overflow-hidden">
                  {links.slice(2).map(link => (
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
  )
}

// ── Decoradores SVG del banner ─────────────────────────────

const SparkleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2 L13.2 10.8 L22 12 L13.2 13.2 L12 22 L10.8 13.2 L2 12 L10.8 10.8 Z" />
  </svg>
)

const DiamondIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3 L20 10 L12 22 L4 10 Z" fill="currentColor" />
    <path d="M12 3 L20 10 L12 22 L4 10 Z" fill="white" opacity="0.18" />
    <path d="M4 10 L12 3 L20 10" fill="white" opacity="0.12" />
  </svg>
)

// ── Componente principal del Feed ─────────────────────────────────────────────

/**
 * Página Feed: lista paginada de posts publicados.
 * Carga automáticamente más posts al hacer scroll (infinite scroll).
 * Escucha el evento 'postPublished' para recargar desde el inicio
 * cuando el usuario crea un nuevo post desde el wizard.
 */
export default function Feed() {
  const [posts, setPosts] = useState<FeedPostOut[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const loaderRef = useRef<HTMLDivElement | null>(null)

  // ── Filtros ──────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showTagFilter, setShowTagFilter] = useState(false)
  const [sortOrder, setSortOrder] = useState<'urgency' | 'recent'>('urgency')

  useEffect(() => {
    getMyProfile().then((d: { id: number }) => setCurrentUserId(d.id)).catch(() => {})
  }, [])

  // Reset feed when filters change
  useEffect(() => {
    setPosts([])
    setPage(1)
    setHasMore(true)
  }, [statusFilter, selectedTags, sortOrder])

  /** Carga una página del feed y la agrega al estado */
  const fetchPage = useCallback(async (pageNum: number) => {
    if (loading) return
    setLoading(true)
    try {
      const data: FeedResponse = await getFeed({
        page: pageNum,
        size: 10,
        time_status: statusFilter,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        sort: sortOrder === 'recent' ? 'recent' : undefined,
      })
      setPosts(prev => pageNum === 1 ? data.items : [...prev, ...data.items])
      setHasMore(data.has_next)
      if (data.has_next) setPage(pageNum + 1)
    } catch (err) {
      console.error('Error cargando feed:', err)
    } finally {
      setLoading(false)
    }
  }, [loading, statusFilter, selectedTags, sortOrder])

  // Escucha el evento global emitido por PublicationWizard al publicar.
  // Recarga el feed desde la página 1 para mostrar el nuevo post.
  useEffect(() => {
    const handlePublished = () => {
      setPage(1)
      setHasMore(true)
      fetchPage(1)
    }
    window.addEventListener('postPublished', handlePublished)
    return () => window.removeEventListener('postPublished', handlePublished)
  }, [fetchPage])

  // Infinite scroll: observa el div loader al final de la lista
  useEffect(() => {
    const el = loaderRef.current
    if (!el) return
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        fetchPage(page)
      }
    })
    io.observe(el)
    return () => io.disconnect()
  }, [fetchPage, hasMore, loading, page])

  return (
    <div className="min-h-screen bg-gray-50" style={{ overflowAnchor: 'none' }}>
      <div className="w-full max-w-[550px] mx-auto p-4 space-y-4">

        {/* ── Banner ornamental Utopp ─────────────────────── */}
        <div
          className="relative w-full rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: 'radial-gradient(ellipse at 50% 35%, #7C3AED 0%, #4C1D95 38%, #1e1b4b 72%, #0f172a 100%)',
            height: '188px',
          }}
        >
          {/* Glow blobs de fondo */}
          <div
            className="absolute w-64 h-64 rounded-full blur-3xl opacity-40 -top-16 -left-12 pointer-events-none"
            style={{ background: '#7C3AED' }}
          />
          <div
            className="absolute w-64 h-64 rounded-full blur-3xl opacity-35 -bottom-16 -right-12 pointer-events-none"
            style={{ background: '#1D4ED8' }}
          />
          <div
            className="absolute w-40 h-40 rounded-full blur-2xl opacity-20 top-4 right-1/3 pointer-events-none"
            style={{ background: '#EC4899' }}
          />

          {/* Estrellas de 4 puntas */}
          <SparkleIcon className="absolute top-4  left-7   w-5 h-5 text-blue-200   opacity-85" />
          <SparkleIcon className="absolute top-3  right-10 w-7 h-7 text-purple-200 opacity-90" />
          <SparkleIcon className="absolute bottom-5 left-16 w-4 h-4 text-blue-300  opacity-75" />
          <SparkleIcon className="absolute bottom-4 right-7  w-5 h-5 text-pink-200  opacity-85" />
          <SparkleIcon className="absolute top-[45%] left-5  w-3 h-3 text-white     opacity-60" />
          <SparkleIcon className="absolute top-[45%] right-5 w-3 h-3 text-white     opacity-60" />
          <SparkleIcon className="absolute top-6 left-1/3   w-2.5 h-2.5 text-blue-100 opacity-50" />
          <SparkleIcon className="absolute bottom-7 right-1/3 w-2 h-2 text-purple-100 opacity-55" />

          {/* Diamantes cristal */}
          <DiamondIcon className="absolute top-4   right-20 w-9  h-9  text-purple-300 opacity-55" />
          <DiamondIcon className="absolute bottom-4 left-9   w-11 h-11 text-blue-400  opacity-45" />
          <DiamondIcon className="absolute top-10  left-1/4  w-5  h-5  text-pink-300  opacity-35" />

          {/* Micro-dots brillantes */}
          <div className="absolute top-8  left-[38%] w-2   h-2   rounded-full bg-blue-300  opacity-70 blur-[1px] pointer-events-none" />
          <div className="absolute bottom-9 right-[38%] w-1.5 h-1.5 rounded-full bg-purple-200 opacity-75 pointer-events-none" />
          <div className="absolute top-14 right-[30%] w-1   h-1   rounded-full bg-white     opacity-80 pointer-events-none" />
          <div className="absolute top-5  left-[55%] w-1   h-1   rounded-full bg-blue-200  opacity-65 pointer-events-none" />
          <div className="absolute bottom-6 left-[45%] w-1.5 h-1.5 rounded-full bg-pink-200 opacity-60 pointer-events-none" />

          {/* Texto principal centrado */}
          <div className="absolute inset-0 flex items-center justify-center">
            <h1
              className="font-black select-none leading-none"
              style={{
                fontFamily: "'Cinzel', 'Georgia', serif",
                fontSize: 'clamp(2.8rem, 8vw, 4.5rem)',
                letterSpacing: '0.1em',
                background: 'linear-gradient(135deg, #93C5FD 0%, #C4B5FD 35%, #F9A8D4 65%, #E9D5FF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter:
                  'drop-shadow(0 0 12px rgba(167,139,250,0.95)) ' +
                  'drop-shadow(0 0 28px rgba(96,165,250,0.75)) ' +
                  'drop-shadow(0 2px 6px rgba(0,0,0,0.6))',
              }}
            >
              Utopp
            </h1>
          </div>
        </div>

        {/* ── Barra de filtros (sticky) ───────────────── */}
        <div className="sticky top-0 z-30 -mx-4 px-4 py-2 bg-gray-50/95 backdrop-blur-sm border-b border-gray-100 shadow-sm space-y-2">
          {/* Status pills + sort + tag toggle */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {([
              { value: undefined, label: 'Todas' },
              { value: 'vigente', label: 'Vigentes' },
              { value: 'vencida', label: 'Vencidas' },
            ] as const).map(opt => (
              <button
                key={opt.label}
                onClick={() => setStatusFilter(statusFilter === opt.value ? undefined : opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  statusFilter === opt.value
                    ? 'bg-[#4F46E5] text-white border-[#4F46E5]'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}

            {/* Separador visual */}
            <div className="w-px h-5 bg-gray-200 mx-0.5" />

            {/* Sort: Urgencia / Más recientes */}
            {([
              { value: 'urgency' as const, label: '⚡ Urgencia' },
              { value: 'recent' as const,  label: '🕐 Recientes' },
            ]).map(opt => (
              <button
                key={opt.value}
                onClick={() => setSortOrder(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  sortOrder === opt.value
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}

            <button
              onClick={() => setShowTagFilter(v => !v)}
              className={`ml-auto p-1.5 rounded-full border transition-colors ${
                showTagFilter || selectedTags.length > 0
                  ? 'bg-purple-50 border-purple-300 text-purple-600'
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
              title="Filtrar por tags"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          {/* Tag chips */}
          {showTagFilter && (
            <div className="flex flex-wrap gap-1.5 bg-white rounded-xl border border-gray-200 p-3">
              {INTERESTS.map(interest => {
                const active = selectedTags.includes(interest.id)
                return (
                  <button
                    key={interest.id}
                    onClick={() => setSelectedTags(prev =>
                      active ? prev.filter(t => t !== interest.id) : [...prev, interest.id]
                    )}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      active
                        ? 'bg-purple-100 text-purple-700 border border-purple-300'
                        : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <span>{interest.icon}</span>
                    {interest.label}
                  </button>
                )
              })}
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="text-xs text-gray-400 hover:text-gray-600 ml-1"
                >
                  Limpiar
                </button>
              )}
            </div>
          )}
        </div>

        {/* Lista de posts */}
        {posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={currentUserId}
            onEdited={updated => setPosts(prev => prev.map(p => p.id === updated.id ? updated : p))}
          />
        ))}

        {/* Estado vacío */}
        {!loading && posts.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-medium text-gray-700">Aún no hay publicaciones</p>
            <p className="text-sm text-gray-400 mt-1">Sé el primero en crear una publicación</p>
          </div>
        )}

        {/* Loader de paginación */}
        {loading && (
          <div className="text-center py-4 text-sm text-gray-400">Cargando más...</div>
        )}
        <div ref={loaderRef} />
      </div>
    </div>
  )
}
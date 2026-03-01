import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Info, MoreVertical, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import { getFeed } from '../api/feed.api'
import { listImages, type PostImage } from '../api/post-images.api'
import { listLinks } from '../api/post-links.api'
import { savePost, unsavePost } from '../api/saved-posts.api'
import {
  type FeedPostOut,
  type FeedResponse,
  POST_TYPE_LABELS,
  POST_TYPE_ICONS,
  SUBTYPE_LABELS,
} from '../types/post.types'

// ── Helpers de UI ────────────────────────────────────────

/** Avatar del usuario: muestra foto de Cloudinary si está en localStorage, si no iniciales */
const UserAvatar = ({ userName, userId, gradient }: { userName?: string; userId?: number; gradient: string }) => {
  const avatarUrl = userId ? localStorage.getItem(`avatar_${userId}`) : null
  const initial = (userName ?? 'U').charAt(0).toUpperCase()
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={userName ?? 'Usuario'}
        className="w-10 h-10 rounded-full object-cover border border-gray-200"
      />
    )
  }
  return (
    <div className={`w-10 h-10 ${gradient} rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0`}>
      {initial}
    </div>
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
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso))
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
const PostCard = ({ post }: { post: FeedPostOut }) => {
  const navigate = useNavigate()

  // ── Estado local del post card ────────────────────────
  const [images, setImages]           = useState<PostImage[]>([])
  const [imgIndex, setImgIndex]       = useState(0)
  const [links, setLinks]             = useState<PostLink[]>([])
  const [isSaved, setIsSaved]           = useState(post.is_saved)
  const [menuOpen, setMenuOpen]         = useState(false)
  const [savingPost, setSavingPost]     = useState(false)
  const [extraMenuOpen, setExtraMenuOpen] = useState(false)
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
      listImages(post.id).then(setImages).catch(() => {})
    }
    if (post.links_count > 0) {
      listLinks(post.id).then(setLinks).catch(() => {})
    }
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

  const prevImg = () => setImgIndex(i => (i - 1 + images.length) % images.length)
  const nextImg = () => setImgIndex(i => (i + 1) % images.length)

  // Determinar qué imagen mostrar: si las lazy-images cargaron úsalas, si no usa image_url
  const displayImages: { url: string }[] =
    images.length > 0 ? images : post.image_url ? [{ url: post.image_url }] : []
  const currentImgUrl = displayImages[imgIndex]?.url

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

      {/* ── Header: avatar + nombre + email + tiempo + badges + menú ── */}
      <div className="flex items-start justify-between px-4 pt-4 pb-4 sm:pb-3">
        <div className="flex items-center gap-3">
          <UserAvatar userName={post.user_name} userId={post.user_id} gradient={gradient} />
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/app/perfil/${post.user_id}`)}
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

      {/* ── Carrusel de imágenes ────────────────────────── */}
      {currentImgUrl && (
        <div className="relative w-full max-w-[500px] mx-auto aspect-[4/5] bg-gray-100 overflow-hidden">
          <img
            src={currentImgUrl}
            alt={`Imagen ${imgIndex + 1}`}
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            style={(() => {
              const imgData = displayImages[imgIndex] as PostImage | { url: string }
              const objPos = 'object_position' in imgData ? (imgData.object_position ?? 'center center') : 'center center'
              const sc     = 'scale' in imgData ? (imgData.scale ?? 1) : 1
              return {
                objectPosition: objPos,
                transform: `scale(${sc})`,
                transformOrigin: objPos,
              }
            })()}
          />
          {/* Flechas de navegación (solo si hay más de 1 imagen cargada) */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={prevImg}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextImg}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              {/* Dots indicadores */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {displayImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIndex(i)}
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
        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line line-clamp-4">
          {post.description}
        </p>

        {post.deadline_at && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>
              Fecha límite: {formatDate(post.deadline_at)}
              {post.time_status === 'out_of_time' && (
                <span className="ml-1 text-red-500 font-medium">(Vencido)</span>
              )}
            </span>
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
  )
}

// ── Componente principal del Feed ─────────────────────────

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
  const loaderRef = useRef<HTMLDivElement | null>(null)

  /** Carga una página del feed y la agrega al estado */
  const fetchPage = useCallback(async (pageNum: number) => {
    if (loading) return
    setLoading(true)
    try {
      const data: FeedResponse = await getFeed({ page: pageNum, size: 10 })
      setPosts(prev => pageNum === 1 ? data.items : [...prev, ...data.items])
      setHasMore(data.has_next)
      if (data.has_next) setPage(pageNum + 1)
    } catch (err) {
      console.error('Error cargando feed:', err)
    } finally {
      setLoading(false)
    }
  }, [loading])

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
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-[550px] mx-auto p-4 space-y-4">

        {/* Header del feed — branding Utopp */}
        <div className="bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6] rounded-2xl shadow-md px-6 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg border-2 border-white/30 shrink-0">
            <img src="/utopp-logo.png" alt="Utopp" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight leading-none">Utopp</h1>
            <p className="text-indigo-200 text-xs mt-0.5">Publicaciones de la comunidad UTEC</p>
          </div>
        </div>

        {/* Lista de posts */}
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
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

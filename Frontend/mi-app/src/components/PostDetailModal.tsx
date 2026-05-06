import { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { X, Bookmark, ChevronLeft, ChevronRight, Calendar, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getPost } from '../api/posts.api'
import { unsavePost } from '../api/saved-posts.api'
import { POST_TYPE_LABELS, POST_TYPE_ICONS, SUBTYPE_LABELS } from '../types/post.types'

interface PostImageOut {
  id: number
  url: string
  position: number
  object_position?: string | null
  scale?: number | null
}

interface PostLinkOut {
  id: number
  label: string
  url: string
  type: string
  display_type: string
  position: number
}

interface PostUserOut {
  id: number
  full_name?: string | null
  email: string
  profile_image_url?: string | null
}

interface PostDetail {
  id: number
  user_id: number
  title?: string | null
  description: string
  post_type: string
  subtype?: string | null
  status: string
  time_status: string
  tags?: string[] | null
  deadline_at?: string | null
  created_at: string
  user?: PostUserOut | null
  images: PostImageOut[]
  links: PostLinkOut[]
}

interface PostDetailModalProps {
  postId: number | null
  onClose: () => void
  onUnsaved?: (id: number) => void
}

const formatDate = (iso?: string | null) => {
  if (!iso) return ''
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(iso))
}

const timeAgo = (iso?: string) => {
  if (!iso) return ''
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60)      return 'hace un momento'
  if (diff < 3600)    return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400)   return `hace ${Math.floor(diff / 3600)} h`
  if (diff < 604800)  return `hace ${Math.floor(diff / 86400)} días`
  return `hace ${Math.floor(diff / 604800)} sem`
}

const MAX_DESC_CHARS = 1000

export default function PostDetailModal({ postId, onClose, onUnsaved }: PostDetailModalProps) {
  const navigate = useNavigate()
  const [post, setPost]             = useState<PostDetail | null>(null)
  const [loading, setLoading]       = useState(false)
  const [imgIdx, setImgIdx]         = useState(0)
  const [unsaving, setUnsaving]     = useState(false)
  const [descExpanded, setDescExpanded] = useState(false)

  useEffect(() => {
    if (!postId) { setPost(null); return }
    let cancelled = false
    setLoading(true)
    setImgIdx(0)
    setDescExpanded(false)
    getPost(postId)
      .then(d => { if (!cancelled) setPost(d as PostDetail) })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [postId])

  useEffect(() => {
    if (!postId) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [postId, onClose])

  const handleUnsave = async () => {
    if (!post) return
    setUnsaving(true)
    try {
      await unsavePost(post.id)
      onUnsaved?.(post.id)
      onClose()
    } catch (e) { console.error(e) }
    finally { setUnsaving(false) }
  }

  if (!postId) return null

  const sortedImages = post ? [...post.images].sort((a, b) => a.position - b.position) : []
  const sortedLinks  = post ? [...post.links].sort((a, b) => a.position - b.position) : []
  const totalImgs    = sortedImages.length

  const prevImg = () => setImgIdx(i => Math.max(0, i - 1))
  const nextImg = () => setImgIdx(i => Math.min(totalImgs - 1, i + 1))

  const typeLabel = post ? POST_TYPE_LABELS[post.post_type as keyof typeof POST_TYPE_LABELS] : ''
  const typeIcon  = post ? POST_TYPE_ICONS[post.post_type as keyof typeof POST_TYPE_ICONS]  : ''

  const mainLink    = sortedLinks[0]
  const secondLink  = sortedLinks[1]
  const extraLinks  = sortedLinks.slice(2)

  const deadline = post?.deadline_at
  const isExpired = post?.time_status === 'out_of_time'

  const userName = post?.user?.full_name || post?.user?.email || 'Usuario'

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[75] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[550px] max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {post && (
              <>
                <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                  {typeIcon} {typeLabel}
                </span>
                {post.subtype && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-medium">
                    {SUBTYPE_LABELS[post.subtype as keyof typeof SUBTYPE_LABELS]}
                  </span>
                )}
                {isExpired && (
                  <span className="text-xs bg-red-100 text-red-600 px-2.5 py-1 rounded-full font-medium">Vencido</span>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {post && onUnsaved && (
              <button
                onClick={handleUnsave}
                disabled={unsaving}
                className="p-2 rounded-xl text-[#4F46E5] hover:bg-indigo-50 transition-colors disabled:opacity-40"
                title="Quitar de guardados"
              >
                <Bookmark className="w-4 h-4 fill-current" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-purple-500 rounded-full animate-spin" />
              <span className="text-sm">Cargando publicación...</span>
            </div>
          )}

          {post && !loading && (
            <div className="space-y-0">
              {/* Author row */}
              <div className="px-5 pt-4 pb-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const target = post.user_id
                    navigate(target ? `/app/perfil/${target}` : '/app/perfil')
                    onClose()
                  }}
                  className="flex items-center gap-3 min-w-0 text-left hover:opacity-90 transition-opacity"
                  title="Ver perfil del autor"
                >
                  {post.user?.profile_image_url ? (
                    <img
                      src={post.user.profile_image_url}
                      alt={userName}
                      className="w-9 h-9 rounded-full object-cover shrink-0 border border-gray-200"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                    <p className="text-xs text-gray-400">{timeAgo(post.created_at)}</p>
                  </div>
                </button>
              </div>

              {/* Image carousel (slide CSS) */}
              {totalImgs > 0 && (
                <div className="relative w-full bg-black overflow-hidden" style={{ aspectRatio: '1/1', maxHeight: '55vh' }}>
                  {/* Fila de imágenes: slide via translateX */}
                  <div
                    className="flex h-full"
                    style={{
                      width: `${totalImgs * 100}%`,
                      transform: `translateX(-${(imgIdx / totalImgs) * 100}%)`,
                      transition: 'transform 350ms ease-in-out',
                    }}
                  >
                    {sortedImages.map((img, i) => (
                      <img
                        key={i}
                        src={img.url}
                        alt={`Imagen ${i + 1}`}
                        className="h-full object-cover"
                        style={{
                          width: `${100 / totalImgs}%`,
                          objectPosition: img.object_position ?? 'center center',
                          transform: `scale(${img.scale ?? 1})`,
                          transformOrigin: 'center center',
                        }}
                      />
                    ))}
                  </div>
                  {totalImgs > 1 && (
                    <>
                      <button
                        onClick={prevImg}
                        disabled={imgIdx === 0}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={nextImg}
                        disabled={imgIdx === totalImgs - 1}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {sortedImages.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setImgIdx(i)}
                            className={`rounded-full transition-all ${i === imgIdx ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/60'}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Text content */}
              <div className="px-5 pt-4 pb-2 space-y-2">
                {post.title && (
                  <h2 className="text-base font-bold text-gray-900 leading-snug">{post.title}</h2>
                )}
                {(() => {
                  const needsTrunc = post.description.length > MAX_DESC_CHARS
                  const displayText = needsTrunc && !descExpanded
                    ? post.description.slice(0, MAX_DESC_CHARS) + '…'
                    : post.description
                  return (
                    <>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{displayText}</p>
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
              </div>

              {/* Deadline */}
              {deadline && (
                <div className="px-5 py-2">
                  <div className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium ${
                    isExpired ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
                  }`}>
                    <Calendar className="w-3 h-3" />
                    {isExpired ? 'Vencido · ' : 'Fecha límite: '}
                    {formatDate(deadline)}
                  </div>
                </div>
              )}

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="px-5 py-2 flex flex-wrap gap-1.5">
                  {post.tags.map(t => (
                    <span key={t} className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">#{t}</span>
                  ))}
                </div>
              )}

              {/* Links */}
              {sortedLinks.length > 0 && (
                <div className="px-5 pt-2 pb-5 flex items-center gap-2 flex-wrap">
                  {mainLink && (
                    <a
                      href={mainLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 flex-1 min-w-0 justify-center py-2.5 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white hover:opacity-90 transition-opacity"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{mainLink.label}</span>
                    </a>
                  )}
                  {secondLink && (
                    <a
                      href={secondLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center py-2.5 px-3 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors"
                    >
                      {secondLink.label}
                    </a>
                  )}
                  {extraLinks.length > 0 && (
                    <div className="w-full space-y-1.5 mt-1">
                      {extraLinks.map(link => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <span className="text-base">🔗</span>
                          <span className="truncate">{link.label}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!sortedLinks.length && <div className="pb-4" />}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

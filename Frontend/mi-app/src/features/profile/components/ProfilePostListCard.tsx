import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Archive, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { archivePost, deletePost } from '../../../api/posts.api'
import { listImages, type PostImage } from '../../../api/post-images.api'
import { POST_TYPE_ICONS, POST_TYPE_LABELS, SUBTYPE_LABELS } from '../../../types/post.types'
import { STATUS_BADGE } from '../constants/profileOptions'
import type { PostItem } from '../types'
import { ConfirmModal } from './ConfirmModal'

export function ProfilePostListCard({
  post,
  onUpdated,
  onDeleted,
  onEdit,
  /** Solo el dueño del perfil debe ver editar / archivar / eliminar */
  showActions = true,
  /** Acciones extra (por ejemplo: quitar de guardados) */
  extraActions,
  /** Navegación opcional al tocar la card (ej. abrir detalle en guardadas). */
  onCardClick,
  /** Badge temporal opcional (ej. Vencido, Cierra hoy). */
  timeBadge,
}: {
  post: PostItem
  onUpdated: (p: PostItem) => void
  onDeleted: (id: number) => void
  onEdit: (id: number) => void
  showActions?: boolean
  extraActions?: ReactNode
  onCardClick?: () => void
  timeBadge?: { label: string; tone: 'expired' | 'warning' }
}) {
  const [confirm, setConfirm] = useState<null | 'archive' | 'delete'>(null)
  const [images, setImages] = useState<PostImage[]>([])
  const [imgIndex, setImgIndex] = useState(0)

  const isArchived = post.status === 'archived'

  useEffect(() => {
    let cancelled = false
    listImages(post.id)
      .then((imgs) => {
        if (!cancelled) setImages(imgs as PostImage[])
      })
      .catch(() => {
        if (!cancelled) setImages([])
      })
    return () => {
      cancelled = true
    }
  }, [post.id])

  const displayImages = useMemo(
    () => (images.length > 0 ? images : post.image_url ? [{ id: -1, url: post.image_url, position: 0 }] : []),
    [images, post.image_url],
  )
  const totalImages = displayImages.length

  const handleArchive = async () => {
    try {
      const updated = await archivePost(post.id)
      onUpdated({ ...post, ...updated })
    }
    catch (e) { console.error(e) }
    finally { setConfirm(null) }
  }

  const handleDelete = async () => {
    try {
      await deletePost(post.id)
      onDeleted(post.id)
    }
    catch (e) { console.error(e) }
    finally { setConfirm(null) }
  }

  return (
    <>
      {confirm === 'archive' && (
        <ConfirmModal
          title="Archivar publicación"
          message="El post dejará de aparecer en el feed y no podrás editarlo. ¿Continuar?"
          onConfirm={handleArchive}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === 'delete' && (
        <ConfirmModal
          title="Eliminar publicación"
          message="Esta acción es permanente. El post se eliminará completamente. ¿Estás seguro?"
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
          danger
        />
      )}

      <div
        className={`bg-white md:bg-white border-b border-gray-150 md:border md:rounded-[22px] -mx-4 px-4 py-5 md:mx-0 md:p-4 space-y-3 shadow-none md:shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden transition-all md:hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)] ${isArchived ? 'opacity-60' : ''} ${onCardClick ? 'cursor-pointer' : ''}`}
        onClick={onCardClick}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                {(() => {
                  const TypeIcon = POST_TYPE_ICONS[post.post_type as keyof typeof POST_TYPE_ICONS]
                  return TypeIcon ? <TypeIcon className="w-3 h-3 text-gray-500" /> : null
                })()}
                {POST_TYPE_LABELS[post.post_type as keyof typeof POST_TYPE_LABELS]}
              </span>
              {post.subtype && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                  {SUBTYPE_LABELS[post.subtype as keyof typeof SUBTYPE_LABELS]}
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[post.status]?.color ?? 'bg-gray-100 text-gray-500'}`}>
                {STATUS_BADGE[post.status]?.label ?? post.status}
              </span>
            </div>

            {post.title && <p className="font-semibold text-gray-900 text-sm">{post.title}</p>}
            <p className="text-gray-600 text-sm line-clamp-2">{post.description}</p>
          </div>

          {!isArchived && (showActions || extraActions) && (
            <div className="flex items-center gap-1 shrink-0">
              {extraActions}
              {showActions && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); onEdit(post.id) }} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors" title="Editar">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setConfirm('archive') }} className="p-1.5 rounded-lg text-gray-400 hover:bg-yellow-50 hover:text-yellow-600 transition-colors" title="Archivar">
                    <Archive className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setConfirm('delete') }} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="Eliminar">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Carrusel de imágenes para publicaciones con multimedia */}
        {totalImages > 0 && (
          <div className="relative w-full rounded-xl overflow-hidden bg-gray-100">
            <div
              className="flex h-64 sm:h-80 will-change-transform"
              style={{
                width: `${totalImages * 100}%`,
                transform: `translateX(-${(imgIndex / totalImages) * 100}%)`,
                transition: 'transform 350ms ease-in-out',
              }}
            >
              {displayImages.map((img, i) => (
                <img
                  key={`${post.id}-${i}`}
                  src={img.url}
                  alt={`Imagen ${i + 1}`}
                  className="h-full object-cover"
                  style={{ width: `${100 / totalImages}%` }}
                />
              ))}
            </div>

            {totalImages > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setImgIndex((prev) => Math.max(0, prev - 1)) }}
                  disabled={imgIndex === 0}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setImgIndex((prev) => Math.min(totalImages - 1, prev + 1)) }}
                  disabled={imgIndex === totalImages - 1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.map(t => (
              <span key={t} className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">#{t}</span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-gray-400">
            {new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(post.created_at))}
          </p>
          {timeBadge ? (
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
              timeBadge.tone === 'expired' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
            }`}>
              {timeBadge.label}
            </span>
          ) : null}
        </div>
      </div>
    </>
  )
}

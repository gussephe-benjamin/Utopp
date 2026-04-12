import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react'
import { getMyProfile } from '../api/users.api'
import {
  type PostType,
  type SubPostType,
  type WizardImage,
  type WizardLink,
  POST_TYPE_LABELS,
  POST_TYPE_ICONS,
  SUBTYPE_LABELS,
} from '../types/post.types'

interface Step5PreviewProps {
  postType: PostType
  subtype: SubPostType | ''
  title: string
  description: string
  deadline_at: string
  images: WizardImage[]
  links: WizardLink[]
}

/** Formato legible de fecha ISO (date o datetime-local) */
function formatDate(isoDate: string): string {
  if (!isoDate) return ''
  const d = new Date(isoDate)
  if (isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric',
  }).format(d)
}

/**
 * Paso de preview: replica pixel-perfecta del PostCard del feed.
 * Mismo layout responsive, overflow link button, avatar real, escala de imagen.
 */
export default function Step5Preview({
  postType, subtype, title, description, deadline_at, images, links,
}: Step5PreviewProps) {
  const [currentImage, setCurrentImage]   = useState(0)
  const [userName, setUserName]           = useState<string | null>(null)
  const [userEmail, setUserEmail]         = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl]         = useState<string | null>(null)
  const [extraMenuOpen, setExtraMenuOpen] = useState(false)
  const [descExpanded, setDescExpanded]   = useState(false)
  const extraMenuRef                      = useRef<HTMLDivElement>(null)

  const MAX_DESC_CHARS = 500

  useEffect(() => {
    getMyProfile()
      .then(profile => {
        setUserName(profile.full_name || profile.email)
        setUserEmail(profile.email ?? null)
        const saved = localStorage.getItem(`avatar_${profile.id}`)
        if (saved) setAvatarUrl(saved)
      })
      .catch(() => setUserName('Tú'))
  }, [])

  // Cierra el overflow menu al hacer clic fuera
  useEffect(() => {
    if (!extraMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (extraMenuRef.current && !extraMenuRef.current.contains(e.target as Node)) {
        setExtraMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [extraMenuOpen])

  const readyImages = images.filter(img => img.status === 'done' && img.cloudinaryUrl)
  const prevImage   = () => setCurrentImage(i => Math.max(0, i - 1))
  const nextImage   = () => setCurrentImage(i => Math.min(readyImages.length - 1, i + 1))

  const initial = (userName ?? 'T').charAt(0).toUpperCase()

  // Tipo de post → gradiente de avatar igual que Feed.tsx
  const typeGradients: Record<string, string> = {
    international_opportunity: 'bg-gradient-to-br from-blue-500 to-cyan-500',
    event:                     'bg-gradient-to-br from-purple-500 to-pink-500',
    academic_project:          'bg-gradient-to-br from-green-500 to-emerald-500',
    announcement:              'bg-gradient-to-br from-orange-500 to-red-500',
    simple_post:               'bg-gradient-to-br from-gray-500 to-slate-500',
  }
  const gradient = typeGradients[postType] ?? typeGradients.simple_post

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 text-center font-medium">
        Así se verá tu publicación en el feed
      </p>

      {/* Fondo gris simulando el feed */}
      <div className="bg-gray-100 rounded-2xl p-3">

        {/* Tarjeta — misma estructura exacta que PostCard */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden w-full max-w-[500px] mx-auto">

          {/* Header: avatar + nombre + email + tiempo + badges */}
          <div className="flex items-start justify-between px-4 pt-4 pb-4 sm:pb-3">
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName ?? 'Tú'} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
              ) : (
                <div className={`w-10 h-10 ${gradient} rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0`}>
                  {initial}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 text-sm leading-tight">{userName ?? 'Cargando...'}</span>
                  <span className="hidden sm:inline text-gray-300 text-xs">·</span>
                  <span className="hidden sm:inline text-xs text-gray-400">Ahora</span>
                </div>
                {userEmail && (
                  <p className="text-xs text-gray-400 leading-tight mt-0.5">{userEmail}</p>
                )}
                <p className="sm:hidden text-xs text-gray-400 leading-tight mt-0.5">Ahora</p>
              </div>
            </div>

            {/* Badges en columna (sm+) */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:flex sm:flex-col gap-1 items-end">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  {POST_TYPE_ICONS[postType]} {POST_TYPE_LABELS[postType]}
                </span>
                {subtype && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                    {SUBTYPE_LABELS[subtype]}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Badges en móvil (fila) */}
          <div className="flex gap-1 px-4 mb-2 sm:hidden items-center flex-wrap">
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              {POST_TYPE_ICONS[postType]} {POST_TYPE_LABELS[postType]}
            </span>
            {subtype && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                {SUBTYPE_LABELS[subtype]}
              </span>
            )}
          </div>

          {/* Carrusel de imágenes (slide CSS) — aspect-ratio 4:5 */}
          {readyImages.length > 0 && (
            <div className="relative w-full max-w-[500px] mx-auto aspect-[4/5] bg-gray-100 overflow-hidden">
              {/* Fila de imágenes: slide via translateX */}
              <div
                className="flex h-full"
                style={{
                  width: `${readyImages.length * 100}%`,
                  transform: `translateX(-${(currentImage / readyImages.length) * 100}%)`,
                  transition: 'transform 350ms ease-in-out',
                }}
              >
                {readyImages.map((img, i) => (
                  <img
                    key={i}
                    src={img.cloudinaryUrl!}
                    alt={`Imagen ${i + 1}`}
                    className="h-full object-cover"
                    style={{
                      width: `${100 / readyImages.length}%`,
                      objectPosition: img.objectPosition ?? 'center center',
                      transform: `scale(${img.scale ?? 1})`,
                      transformOrigin: img.objectPosition ?? 'center center',
                    }}
                  />
                ))}
              </div>
              {readyImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    disabled={currentImage === 0}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    disabled={currentImage === readyImages.length - 1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {readyImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImage(i)}
                        className={`rounded-full transition-all ${i === currentImage ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/60'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Contenido: título, descripción, deadline */}
          <div className="px-4 pt-3 pb-2">
            {title && (
              <h3 className="font-bold text-gray-900 text-base mb-1 leading-snug">{title}</h3>
            )}
            {(() => {
              const needsTrunc = description.length > MAX_DESC_CHARS
              const displayText = needsTrunc && !descExpanded
                ? description.slice(0, MAX_DESC_CHARS) + '…'
                : description
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
            {deadline_at && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Fecha límite: {formatDate(deadline_at)}</span>
              </div>
            )}
          </div>

          {/* Botones CTA + overflow (idéntico al PostCard del feed) */}
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
                          key={link.tempId}
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
      </div>

      {/* Advertencia si hay imágenes aún subiendo */}
      {images.some(img => img.status === 'uploading') && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 text-center">
          Hay imágenes que aún se están subiendo. Espera a que terminen antes de publicar.
        </div>
      )}
    </div>
  )
}

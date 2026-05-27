import { useEffect, useMemo, useState } from 'react'
import { Bookmark, ChevronLeft, ChevronRight, Clock, Link, X } from 'lucide-react'
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
import { isExpired, timeRemaining } from '../shared/lib/date'
import { PostImageViewerModal } from '../features/feed/components/PostImageViewerModal'
import { UTOPP_BRAND } from '../shared/constants/brand'

interface Step5PreviewProps {
  postType: PostType
  subtype: SubPostType | ''
  title: string
  description: string
  deadline_at: string
  images: WizardImage[]
  links: WizardLink[]
}

function formatDate(isoDate: string): string {
  if (!isoDate) return ''
  const d = new Date(isoDate)
  if (isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

export default function Step5Preview({
  postType,
  subtype,
  title,
  description,
  deadline_at,
  images,
  links,
}: Step5PreviewProps) {
  const readyImages = images.filter((img) => img.status === 'done' && img.cloudinaryUrl)

  const [currentImage, setCurrentImage] = useState(0)
  const [userName, setUserName] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [descExpanded, setDescExpanded] = useState(false)
  const [currentImageRatio, setCurrentImageRatio] = useState<number | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [extraLinksOpen, setExtraLinksOpen] = useState(false)

  const MAX_DESC_CHARS = 560
  const initial = (userName ?? 'T').charAt(0).toUpperCase()
  const hasDeadline = Boolean(deadline_at)
  const deadlineExpired = deadline_at ? isExpired(deadline_at) : false
  const deadlineRemaining = deadline_at ? timeRemaining(deadline_at) : null

  const typeGradients: Record<string, string> = {
    international_opportunity: 'bg-gradient-to-br from-blue-500 to-cyan-500',
    event: 'bg-gradient-to-br from-purple-500 to-pink-500',
    academic_project: 'bg-gradient-to-br from-green-500 to-emerald-500',
    announcement: 'bg-gradient-to-br from-orange-500 to-red-500',
    simple_post: 'bg-gradient-to-br from-gray-500 to-slate-500',
  }
  const gradient = typeGradients[postType] ?? typeGradients.simple_post

  const mediaAspectRatio = useMemo(() => {
    if (!currentImageRatio || !Number.isFinite(currentImageRatio)) return 16 / 9
    return Math.min(1.91, Math.max(0.75, currentImageRatio))
  }, [currentImageRatio])

  useEffect(() => {
    getMyProfile()
      .then((profile) => {
        setUserName(profile.full_name || profile.email)
        setUserEmail(profile.email ?? null)
        const saved = localStorage.getItem(`avatar_${profile.id}`)
        if (saved) setAvatarUrl(saved)
      })
      .catch(() => setUserName('Tú'))
  }, [])

  useEffect(() => {
    if (!readyImages.length) {
      setCurrentImageRatio(null)
      return
    }

    const active = readyImages[currentImage]
    if (!active?.cloudinaryUrl) return

    let cancelled = false
    const image = new Image()
    image.onload = () => {
      if (cancelled || image.naturalWidth <= 0 || image.naturalHeight <= 0) return
      setCurrentImageRatio(image.naturalWidth / image.naturalHeight)
    }
    image.onerror = () => {
      if (!cancelled) setCurrentImageRatio(null)
    }
    image.src = active.cloudinaryUrl

    return () => {
      cancelled = true
    }
  }, [currentImage, readyImages])

  const prevImage = () => setCurrentImage((i) => Math.max(0, i - 1))
  const nextImage = () => setCurrentImage((i) => Math.min(readyImages.length - 1, i + 1))

  const visibleLinks = links.slice(0, 3)
  const overflowLinks = links.slice(3)

  return (
    <div className="space-y-3">
      <p className="text-center text-sm font-medium text-gray-500">Así se verá tu publicación en el feed</p>

      <div className="rounded-2xl bg-gray-100 p-3">
        <div className="relative mx-auto w-full max-w-[680px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-start justify-between gap-4 px-4 pb-3 pt-4">
            <div className="flex min-w-0 items-center gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={userName ?? 'Tú'}
                  className="h-10 w-10 rounded-full border border-gray-200 object-cover"
                />
              ) : (
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${gradient}`}
                >
                  {initial}
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-tight text-gray-900">{userName ?? 'Cargando...'}</p>
                {userEmail ? <p className="mt-0.5 truncate text-xs leading-tight text-gray-500">{userEmail}</p> : null}
                <div className="mt-1 flex items-center gap-1 text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span className="text-[11px] font-semibold">Ahora</span>
                </div>
              </div>
            </div>

            <div className="max-w-[48%] shrink-0 text-right">
              <div className="flex flex-wrap justify-end gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                  {(() => {
                    const TypeIcon = POST_TYPE_ICONS[postType]
                    return <TypeIcon className="h-3.5 w-3.5 text-gray-500" />
                  })()}
                  {POST_TYPE_LABELS[postType]}
                </span>
                {subtype ? (
                  <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs text-purple-700">
                    {SUBTYPE_LABELS[subtype]}
                  </span>
                ) : null}
              </div>

              {hasDeadline ? (
                <div className="mt-2 flex flex-col items-end gap-1">
                  <span className="text-[11px] font-semibold text-gray-500">Límite: {formatDate(deadline_at)}</span>
                  {deadlineExpired ? (
                    <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                      Vencido
                    </span>
                  ) : deadlineRemaining ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-fuchsia-100 bg-fuchsia-50 px-2 py-0.5 text-xs font-semibold text-fuchsia-600">
                      <Clock className="h-3 w-3" />
                      {deadlineRemaining}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className="px-4 pb-3 pt-1.5">
            {title ? (
              <h3 className="mb-1 text-base font-extrabold leading-snug tracking-tight text-gray-900 sm:text-lg">
                {title}
              </h3>
            ) : null}
            {(() => {
              const needsTrunc = description.length > MAX_DESC_CHARS
              const displayText = needsTrunc && !descExpanded ? description.slice(0, MAX_DESC_CHARS) + '…' : description
              return (
                <>
                  <p className="mt-1 whitespace-pre-line text-sm font-medium leading-relaxed text-gray-600">
                    {displayText}
                  </p>
                  {needsTrunc ? (
                    <button
                      onClick={() => setDescExpanded((v) => !v)}
                      className="mt-1 text-xs font-semibold text-[#2f55f6] transition-colors hover:text-[#ba4ef8]"
                    >
                      {descExpanded ? 'Ver menos' : 'Ver más'}
                    </button>
                  ) : null}
                </>
              )
            })()}
          </div>

          {readyImages.length > 0 ? (
            <div className="px-4 pb-3">
              <div
                className="relative w-full overflow-hidden rounded-2xl border border-gray-100/70 bg-gray-100"
                style={{
                  aspectRatio: String(mediaAspectRatio),
                  minHeight: '220px',
                  maxHeight: '520px',
                }}
                onClick={() => setViewerOpen(true)}
              >
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

                {readyImages.length > 1 ? (
                  <>
                    <button
                      onClick={prevImage}
                      disabled={currentImage === 0}
                      onMouseDown={(event) => event.stopPropagation()}
                      onClickCapture={(event) => event.stopPropagation()}
                      className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      disabled={currentImage === readyImages.length - 1}
                      onMouseDown={(event) => event.stopPropagation()}
                      onClickCapture={(event) => event.stopPropagation()}
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                      {readyImages.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentImage(i)}
                          onMouseDown={(event) => event.stopPropagation()}
                          onClickCapture={(event) => event.stopPropagation()}
                          className={`rounded-full transition-all ${i === currentImage ? 'h-2 w-5 bg-white' : 'h-2 w-2 bg-white/60'}`}
                        />
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}

          {links.length > 0 ? (
            <>
              <div className="border-t border-gray-100/80" />
              <div className="flex items-center justify-between gap-4 bg-white px-4 py-3.5">
                <button
                  type="button"
                  disabled
                  className="inline-flex h-8 w-8 items-center justify-center text-gray-400"
                  title="Guardar publicación"
                  aria-label="Guardar publicación"
                >
                  <Bookmark className="h-5 w-5" style={{ color: UTOPP_BRAND.blue }} />
                </button>
                <div className="flex min-h-[36px] flex-1 flex-wrap items-center justify-end gap-2">
                  {visibleLinks.map((link, index) => (
                    <a
                      key={link.tempId}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={
                        index === 0
                          ? 'inline-flex max-w-[160px] items-center justify-center truncate rounded-full bg-gradient-to-r from-[#2f55f6] to-[#ba4ef8] px-4 py-2 text-xs font-bold text-white shadow-[0_4px_14px_rgba(47,85,246,0.25)] transition-all duration-300 hover:brightness-110 hover:shadow-[0_6px_20px_rgba(186,78,248,0.35)] sm:text-sm'
                          : 'inline-flex max-w-[160px] items-center justify-center truncate rounded-full border border-gray-200 bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-200 sm:text-sm'
                      }
                    >
                      <span className="truncate">{link.label}</span>
                    </a>
                  ))}
                  {overflowLinks.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setExtraLinksOpen(true)}
                      className="inline-flex items-center justify-center rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-100 sm:text-sm"
                    >
                      Más enlaces
                    </button>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
          {extraLinksOpen ? (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center bg-black/35 p-4"
              onClick={() => setExtraLinksOpen(false)}
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
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {overflowLinks.map((link) => (
                    <a
                      key={link.tempId}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                    >
                      <Link className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                      <span className="truncate">{link.label}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {images.some((img) => img.status === 'uploading') ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center text-sm text-amber-700">
          Hay imágenes que aún se están subiendo. Espera a que terminen antes de publicar.
        </div>
      ) : null}
      {viewerOpen ? (
        <PostImageViewerModal
          images={readyImages.map((image) => ({
            url: image.cloudinaryUrl!,
            objectPosition: image.objectPosition ?? 'center center',
            scale: image.scale ?? 1,
          }))}
          initialIndex={currentImage}
          onClose={() => setViewerOpen(false)}
        />
      ) : null}
    </div>
  )
}

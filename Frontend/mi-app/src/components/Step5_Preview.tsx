import { useEffect, useState, useMemo } from 'react'
import { Bookmark, ChevronLeft, ChevronRight, Clock, Link, MoreVertical, X } from 'lucide-react'
import { getMyProfile } from '../api/users.api'
import {
  type PostType,
  type SubPostType,
  type WizardImage,
  type WizardLink,
  POST_TYPE_LABELS,
  SUBTYPE_LABELS,
} from '../types/post.types'
import { formatDate, isExpired, timeRemaining } from '../shared/lib/date'
import { getWordTruncatedText } from '../shared/lib/wordCount'
import { PostImageViewerModal } from '../features/feed/components/PostImageViewerModal'
import { UserAvatar } from '../features/feed/components/UserAvatar'
import { buildCloudinaryUrl } from '../shared/lib/cloudinaryUrl'
import { TYPE_GRADIENTS } from '../features/feed/constants/typeGradients'
import { UTOPP_BRAND } from '../shared/constants/brand'
import {
  DEFAULT_POST_ASPECT_RATIO,
  aspectRatioValue,
  FEED_POST_CARD_MAX_WIDTH,
  type PostAspectRatio,
} from '../shared/lib/aspectRatio'

interface Step5PreviewProps {
  postType: PostType
  subtype: SubPostType | ''
  title: string
  description: string
  deadline_at: string
  images: WizardImage[]
  links: WizardLink[]
  tags?: string[]
  aspectRatio?: PostAspectRatio
}

function getTagStyles(tag: string): string {
  const lower = tag.toLowerCase()
  if (lower.includes('cultur') || lower.includes('art') || lower.includes('teatr') || lower.includes('cine')) {
    return 'rounded-full border border-fuchsia-200 bg-fuchsia-50 px-2.5 py-0.5 text-[11px] font-semibold text-fuchsia-700'
  }
  if (lower.includes('tech') || lower.includes('ia') || lower.includes('hack')) {
    return 'rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700'
  }
  return 'rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700'
}

export default function Step5Preview({
  postType,
  subtype,
  title,
  description,
  deadline_at,
  images,
  links,
  tags = [],
  aspectRatio = DEFAULT_POST_ASPECT_RATIO,
}: Step5PreviewProps) {
  const readyImages = images.filter((img) => img.status === 'done' && img.cloudinaryUrl)

  const [currentImage, setCurrentImage] = useState(0)
  const [userId, setUserId] = useState<number | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [descExpanded, setDescExpanded] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [extraLinksOpen, setExtraLinksOpen] = useState(false)

  const hasDeadline = Boolean(deadline_at)
  const deadlineExpired = deadline_at ? isExpired(deadline_at) : false
  const deadlineRemaining = deadline_at ? timeRemaining(deadline_at) : null
  const gradient = TYPE_GRADIENTS[postType] ?? TYPE_GRADIENTS.simple_post
  const mediaAspectRatio = aspectRatioValue(aspectRatio)
  const totalImages = readyImages.length
  const { truncatedText, needsToggle: needsDescriptionToggle } = useMemo(() => {
    return getWordTruncatedText(description, 30)
  }, [description])

  const descriptionText =
    !descExpanded && needsDescriptionToggle
      ? truncatedText
      : description

  const visibleLinks = links.slice(0, 3)
  const overflowLinks = links.slice(3)

  useEffect(() => {
    getMyProfile()
      .then((profile) => {
        setUserId(profile.id)
        setUserName(profile.full_name ?? profile.email ?? '')
        setUserEmail(profile.email ?? '')
        if (profile.profile_image_url) {
          setAvatarUrl(profile.profile_image_url)
        } else {
          const saved = localStorage.getItem(`avatar_${profile.id}`) ?? ''
          if (saved) setAvatarUrl(saved)
        }
      })
      .catch(() => { setUserName('Tú'); return })
  }, [setUserId, setUserName, setUserEmail, setAvatarUrl])

  useEffect(() => {
    if (currentImage >= totalImages && totalImages > 0) {
      setCurrentImage(totalImages - 1)
    }
  }, [currentImage, totalImages])

  const prevImage = () => setCurrentImage((i) => Math.max(0, i - 1))
  const nextImage = () => setCurrentImage((i) => Math.min(totalImages - 1, i + 1))

  return (
    <div className="space-y-3">
      <p className="text-center text-sm font-medium text-gray-500">
        Vista previa — así se verá en el feed
      </p>

      <div className="flex justify-center px-1">
        <div
          className="relative w-full overflow-hidden rounded-[22px] border border-gray-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)]"
          style={{ maxWidth: `${FEED_POST_CARD_MAX_WIDTH}px` }}
        >
          {/* Cabecera (igual que PostCard) */}
          <div className="flex items-start justify-between gap-4 px-4 pb-3 pt-4">
            <div className="flex min-w-0 items-center gap-3">
              <UserAvatar
                userName={userName ?? 'Tú'}
                userId={userId ?? 0}
                gradient={gradient}
                profileImageUrl={avatarUrl ?? undefined}
                currentUserId={userId}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold leading-tight text-gray-900">
                  {userName ?? 'Cargando...'}
                </p>
                {userEmail ? (
                  <p className="mt-0.5 truncate text-xs font-medium text-gray-500">{userEmail}</p>
                ) : null}
                <div className="mt-1 flex items-center gap-1 text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span className="text-[11px] font-semibold">Ahora</span>
                </div>
              </div>
            </div>

            <div className="max-w-[48%] shrink-0 text-right">
              <div className="flex flex-wrap justify-end gap-1.5">
                <span className="rounded-full border border-gray-100 bg-gray-50 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                  {POST_TYPE_LABELS[postType]}
                </span>
                {subtype ? (
                  <span className="rounded-full border border-purple-100 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                    {SUBTYPE_LABELS[subtype]}
                  </span>
                ) : null}
              </div>
              {hasDeadline ? (
                <div className="mt-6 flex flex-col items-end gap-1">
                  {deadlineExpired ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600">
                      Venció el {formatDate(deadline_at)}
                    </span>
                  ) : deadlineRemaining ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-fuchsia-100 bg-fuchsia-50 px-2.5 py-1 text-[11px] font-semibold text-fuchsia-600">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDate(deadline_at)} · {deadlineRemaining}
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                      Límite: {formatDate(deadline_at)}
                    </span>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {/* Título y descripción */}
          <div className="px-4 pb-3 pt-1.5">
            {title ? (
              <h3 className="mb-1 text-base font-extrabold leading-snug tracking-tight text-gray-900 sm:text-lg">
                {title}
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
                {descExpanded ? 'Ver menos' : 'Ver más'}
              </button>
            ) : null}
          </div>

          {/* Media — ancho completo de la tarjeta, formato fijo */}
          {totalImages > 0 ? (
            <div className="px-4 pb-3">
              <div
                className="group relative w-full overflow-hidden rounded-2xl border border-gray-100/70 bg-gray-50 shadow-sm"
                style={{ aspectRatio: String(mediaAspectRatio) }}
                onClick={() => setViewerOpen(true)}
              >
                <div
                  className="flex h-full will-change-transform"
                  style={{
                    width: `${totalImages * 100}%`,
                    transform: `translateX(-${(currentImage / totalImages) * 100}%)`,
                    transition: 'transform 520ms cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                >
                  {readyImages.map((img, i) => {
                    const objPos = img.objectPosition ?? 'center center'
                    const sc = img.scale ?? 1
                    const imageTransform = sc !== 1 ? `scale(${sc})` : undefined
                    return (
                      <div
                        key={i}
                        className="h-full flex-none shrink-0"
                        style={{ width: `${100 / totalImages}%` }}
                      >
                        <img
                          src={buildCloudinaryUrl(img.cloudinaryUrl!, "feed")}
                          alt={`Imagen ${i + 1}`}
                          className="h-full w-full object-cover"
                          style={{
                            objectPosition: objPos,
                            transform: imageTransform,
                            transformOrigin: objPos,
                          }}
                        />
                      </div>
                    )
                  })}
                </div>

                {totalImages > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        prevImage()
                      }}
                      disabled={currentImage === 0}
                      className="absolute left-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-md transition-all hover:bg-black/60 disabled:pointer-events-none disabled:opacity-30"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        nextImage()
                      }}
                      disabled={currentImage === totalImages - 1}
                      className="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-md transition-all hover:bg-black/60 disabled:pointer-events-none disabled:opacity-30"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/20 px-2 py-1 backdrop-blur-sm">
                      {readyImages.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setCurrentImage(i)
                          }}
                          className={`rounded-full transition-all duration-350 ${
                            i === currentImage ? 'h-1.5 w-4 bg-white' : 'h-1.5 w-1.5 bg-white/50 hover:bg-white/80'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}

          {tags.length > 0 ? (
            <div className="px-4 pb-3">
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span key={tag} className={getTagStyles(tag)}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {links.length > 0 ? (
            <>
              <div className="w-full border-t border-gray-100/80" />
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
                    <span
                      key={link.tempId}
                      className={
                        index === 0
                          ? 'inline-flex max-w-[160px] items-center justify-center truncate rounded-full bg-gradient-to-r from-[#2f55f6] to-[#ba4ef8] px-4 py-2 text-xs font-bold text-white shadow-[0_4px_14px_rgba(47,85,246,0.25)] sm:text-sm'
                          : 'inline-flex max-w-[160px] items-center justify-center truncate rounded-full border border-gray-200 bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 sm:text-sm'
                      }
                    >
                      <span className="truncate">{link.label}</span>
                    </span>
                  ))}
                  {overflowLinks.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setExtraLinksOpen(true)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-50"
                      title="Ver enlaces adicionales"
                      aria-label="Ver enlaces adicionales"
                    >
                      <MoreVertical className="h-4 w-4" />
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
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900">Enlaces adicionales</h3>
                  <button
                    type="button"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
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
                      className="flex items-center gap-2.5 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
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

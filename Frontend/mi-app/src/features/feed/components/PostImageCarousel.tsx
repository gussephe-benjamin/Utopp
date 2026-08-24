import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { listImages, type PostImage } from "../../../api/post-images.api"
import { resolvePostImageUrl } from "../../../shared/lib/postImageUrl"
import { useResetOnChange } from "../../../hooks/useResetOnChange"

const SWIPE_THRESHOLD_PX = 40
export const DEFAULT_AUTO_PLAY_INTERVAL_MS = 4000

type DisplayImage = {
  url: string
  object_position?: string | null
  scale?: number | null
}

export type PostImageCarouselProps = {
  postId: number
  imagesCount: number
  fallbackImageUrl?: string | null
  alt: string
  className?: string
  imageClassName?: string
  emptyFallback?: ReactNode
  showControls?: boolean
  showDots?: boolean
  autoPlay?: boolean
  autoPlayIntervalMs?: number
  /** Pausa el autoplay mientras el usuario interactúa con el contenedor padre (hover/focus). */
  pauseAutoPlay?: boolean
  /** Si es false, no captura gestos táctiles (útil cuando un carrusel padre maneja el swipe). */
  enableSwipe?: boolean
  onImageAreaClick?: () => void
}

export function PostImageCarousel({
  postId,
  imagesCount,
  fallbackImageUrl,
  alt,
  className = "",
  imageClassName = "h-full w-full object-cover",
  emptyFallback = null,
  showControls = true,
  showDots = true,
  autoPlay = false,
  autoPlayIntervalMs = DEFAULT_AUTO_PLAY_INTERVAL_MS,
  pauseAutoPlay,
  enableSwipe = true,
  onImageAreaClick,
}: PostImageCarouselProps) {
  const [images, setImages] = useState<PostImage[]>([])
  const [imgIndex, setImgIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [autoPlayPaused, setAutoPlayPaused] = useState(false)

  const touchStartXRef = useRef<number | null>(null)
  const touchDeltaXRef = useRef(0)
  const didSwipeRef = useRef(false)
  const resumeAutoPlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useResetOnChange([postId], () => setLoading(true))

  useEffect(() => {
    let cancelled = false

    listImages(postId)
      .then((imgs) => {
        if (cancelled) return
        setImages(imgs as PostImage[])
      })
      .catch(() => {
        if (!cancelled) setImages([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [postId])

  const displayImages: DisplayImage[] = useMemo(() => {
    const source =
      images.length > 0
        ? images
        : fallbackImageUrl
          ? [{ url: fallbackImageUrl }]
          : []
    return source.map((image) => ({
      ...image,
      url: resolvePostImageUrl(image.url),
    }))
  }, [images, fallbackImageUrl])

  const totalImages = displayImages.length
  const shouldAutoPlay = autoPlay && totalImages > 1
  const isAutoPlayPaused = pauseAutoPlay === true || autoPlayPaused

  useResetOnChange([totalImages], () => {
    setImgIndex((prev) => (prev >= totalImages ? 0 : prev))
  })

  const pauseAutoPlayTemporarily = () => {
    if (!shouldAutoPlay) return
    setAutoPlayPaused(true)
    if (resumeAutoPlayTimeoutRef.current) {
      clearTimeout(resumeAutoPlayTimeoutRef.current)
    }
    resumeAutoPlayTimeoutRef.current = setTimeout(() => {
      setAutoPlayPaused(false)
      resumeAutoPlayTimeoutRef.current = null
    }, autoPlayIntervalMs)
  }

  useEffect(() => {
    return () => {
      if (resumeAutoPlayTimeoutRef.current) {
        clearTimeout(resumeAutoPlayTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!shouldAutoPlay || loading || isAutoPlayPaused) return

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) return

    const timer = window.setInterval(() => {
      setImgIndex((prev) => (prev + 1) % totalImages)
    }, autoPlayIntervalMs)

    return () => window.clearInterval(timer)
  }, [shouldAutoPlay, autoPlayIntervalMs, totalImages, loading, isAutoPlayPaused])

  const prevImg = () => {
    if (totalImages <= 0) return
    pauseAutoPlayTemporarily()
    setImgIndex((prev) => (prev - 1 + totalImages) % totalImages)
  }

  const nextImg = () => {
    if (totalImages <= 0) return
    pauseAutoPlayTemporarily()
    setImgIndex((prev) => (prev + 1) % totalImages)
  }

  const goToImg = (index: number) => {
    pauseAutoPlayTemporarily()
    setImgIndex(index)
  }

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!enableSwipe || totalImages <= 1) return
    touchStartXRef.current = event.touches[0]?.clientX ?? null
    touchDeltaXRef.current = 0
    didSwipeRef.current = false
  }

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!enableSwipe || touchStartXRef.current === null || totalImages <= 1) return
    const currentX = event.touches[0]?.clientX
    if (typeof currentX !== "number") return
    touchDeltaXRef.current = currentX - touchStartXRef.current
  }

  const handleTouchEnd = () => {
    if (!enableSwipe || touchStartXRef.current === null || totalImages <= 1) return
    const delta = touchDeltaXRef.current
    if (Math.abs(delta) >= SWIPE_THRESHOLD_PX) {
      if (delta < 0) nextImg()
      if (delta > 0) prevImg()
      didSwipeRef.current = true
    }
    touchStartXRef.current = null
    touchDeltaXRef.current = 0
  }

  const handleAreaClick = () => {
    if (didSwipeRef.current) {
      didSwipeRef.current = false
      return
    }
    onImageAreaClick?.()
  }

  if (loading && displayImages.length === 0 && (imagesCount > 0 || Boolean(fallbackImageUrl))) {
    return (
      <div className={`animate-pulse bg-gray-200 ${className}`} aria-hidden />
    )
  }

  if (totalImages === 0) {
    return <div className={className}>{emptyFallback}</div>
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onClick={onImageAreaClick ? handleAreaClick : undefined}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex h-full will-change-transform"
        style={{
          width: `${totalImages * 100}%`,
          transform: `translateX(-${(imgIndex / totalImages) * 100}%)`,
          transition: "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {displayImages.map((image, index) => {
          const scale = image.scale ?? 1
          const objectPosition = image.object_position ?? "center center"
          const imageTransform = scale !== 1 ? `scale(${scale})` : undefined

          return (
            <div
              key={index}
              className="h-full flex-none shrink-0 overflow-hidden"
              style={{ width: `${100 / totalImages}%` }}
            >
              <img
                src={image.url}
                alt={`${alt} — imagen ${index + 1}`}
                loading="lazy"
                className={imageClassName}
                style={{
                  objectPosition,
                  transform: imageTransform,
                  transformOrigin: objectPosition,
                }}
              />
            </div>
          )
        })}
      </div>

      {showControls && totalImages > 1 ? (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              prevImg()
            }}
            aria-label="Imagen anterior"
            className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-md transition-all hover:bg-black/60"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              nextImg()
            }}
            aria-label="Imagen siguiente"
            className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-md transition-all hover:bg-black/60"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      ) : null}

      {showDots && totalImages > 1 ? (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/20 px-2 py-1 backdrop-blur-sm">
          {displayImages.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                goToImg(index)
              }}
              aria-label={`Ir a imagen ${index + 1}`}
              className={`rounded-full transition-all duration-300 ${
                index === imgIndex ? "h-1.5 w-4 bg-white" : "h-1.5 w-1.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

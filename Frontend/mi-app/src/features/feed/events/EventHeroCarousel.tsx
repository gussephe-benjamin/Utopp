import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import type { FeedPostOut } from "../../../types/post.types"
import { SUBTYPE_LABELS, POST_TYPE_ICONS } from "../../../types/post.types"
import { TYPE_GRADIENTS } from "../constants/typeGradients"
import { PostImageCarousel } from "../components/PostImageCarousel"
import { formatEventDate, getEventCountdown, mergeFeaturedEvents } from "./eventUtils"

const AUTO_PLAY_MS = 4500
const SWIPE_THRESHOLD_PX = 40
/** Duración del crossfade entre eventos destacados. */
const TRANSITION_S = 0.7
const REDUCED_TRANSITION_S = 0.15
/** Curva "premium" (ease-out expresivo) para el crossfade. */
const PREMIUM_EASE = [0.22, 1, 0.36, 1] as const

type EventHeroCarouselProps = {
  events: FeedPostOut[]
  loading?: boolean
  onOpenEvent: (event: FeedPostOut) => void
  className?: string
}

function wrapIndex(index: number, count: number): number {
  if (count === 0) return 0
  return ((index % count) + count) % count
}

type EventHeroCardProps = {
  event: FeedPostOut
  isActive: boolean
  isSingle?: boolean
  isAutoplayPaused?: boolean
  onOpen?: () => void
}

/** Contenido de una tarjeta hero. Ocupa el 100% del escenario (sin peeks laterales). */
function EventHeroCard({
  event,
  isActive,
  isSingle = false,
  isAutoplayPaused = false,
  onOpen,
}: EventHeroCardProps) {
  const gradient = TYPE_GRADIENTS[event.post_type] ?? TYPE_GRADIENTS.event
  const TypeIcon = POST_TYPE_ICONS[event.post_type] ?? Calendar
  const title = event.title?.trim() || "Evento universitario"
  const hasImages = event.images_count > 0 || Boolean(event.image_url)
  const countdown = getEventCountdown(event)
  const isExpired = countdown?.tone === "expired"

  return (
    <button
      type="button"
      onClick={isActive ? onOpen : undefined}
      tabIndex={isActive ? 0 : -1}
      aria-hidden={!isActive}
      aria-label={isActive ? `Ver evento: ${title}` : undefined}
      className={`group relative block h-full w-full overflow-hidden text-left ring-1 ring-white/15 ${
        isActive ? "cursor-pointer" : "pointer-events-none cursor-default"
      }`}
    >
      <div className="absolute inset-0 bg-[#1b1035]">
        {hasImages ? (
          <PostImageCarousel
            key={event.id}
            postId={event.id}
            imagesCount={event.images_count}
            fallbackImageUrl={event.image_url}
            alt={title}
            className="absolute inset-0 h-full w-full"
            imageClassName="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
            autoPlay={isActive}
            pauseAutoPlay={!isActive || isAutoplayPaused}
            showControls={false}
            showDots={false}
            enableSwipe={false}
          />
        ) : (
          <div className={`absolute inset-0 flex items-center justify-center ${gradient}`}>
            <TypeIcon className="h-14 w-14 text-white/80 md:h-16 md:w-16" />
          </div>
        )}

        {/* Capas de legibilidad + profundidad */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#2f55f6]/10 via-transparent to-[#c026d3]/15" />
        {/* Brillo superior discreto */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/12 to-transparent" />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            {event.subtype ? (
              <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm backdrop-blur-md">
                {SUBTYPE_LABELS[event.subtype]}
              </span>
            ) : null}
            {countdown ? (
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-bold shadow-sm backdrop-blur-md ${
                  isExpired
                    ? "border border-white/20 bg-white/15 text-white/80"
                    : "border border-[#5eead4]/40 bg-[#0d9488]/85 text-white"
                }`}
              >
                {countdown.label}
              </span>
            ) : null}
          </div>

          <h2 className="mt-2.5 line-clamp-2 text-[22px] font-extrabold leading-[1.15] tracking-tight text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.5)] sm:text-2xl">
            {title}
          </h2>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-white/90 sm:text-[13px]">
            {event.user_name ? (
              <span className="font-semibold text-white/95">{event.user_name}</span>
            ) : null}
            {event.deadline_at ? (
              <span className="inline-flex items-center gap-1.5 text-white/80">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-[#5eead4]" />
                {formatEventDate(event.deadline_at)}
              </span>
            ) : null}
          </div>
        </div>

        {!isSingle ? (
          <span className="pointer-events-none absolute right-4 top-4 rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-semibold text-white/80 backdrop-blur-sm">
            Destacado
          </span>
        ) : null}
      </div>
    </button>
  )
}

export function EventHeroCarousel({
  events,
  loading = false,
  onOpenEvent,
  className = "",
}: EventHeroCarouselProps) {
  const eventIdsKey = events.map((e) => e.id).join(",")
  const orderedRef = useRef<FeedPostOut[]>([])
  const [orderedEvents, setOrderedEvents] = useState<FeedPostOut[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  const pointerStartX = useRef<number | null>(null)
  const didSwipeRef = useRef(false)
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const next = mergeFeaturedEvents(orderedRef.current, events)
    orderedRef.current = next
    setOrderedEvents(next)
  }, [eventIdsKey])

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReducedMotion(mq.matches)
    update()
    mq.addEventListener?.("change", update)
    return () => mq.removeEventListener?.("change", update)
  }, [])

  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current)
    }
  }, [])

  const count = orderedEvents.length
  const safeIndex = count > 0 ? wrapIndex(activeIndex, count) : 0

  useEffect(() => {
    if (count === 0) {
      setActiveIndex(0)
      return
    }
    setActiveIndex((prev) => (prev >= count ? wrapIndex(prev, count) : prev))
  }, [count])

  const goToIndex = useCallback(
    (index: number) => {
      if (count === 0) return
      setActiveIndex(wrapIndex(index, count))
    },
    [count],
  )

  const pauseAutoplayTemporarily = useCallback(() => {
    setIsAutoplayPaused(true)
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current)
    resumeTimeoutRef.current = setTimeout(() => {
      setIsAutoplayPaused(false)
      resumeTimeoutRef.current = null
    }, AUTO_PLAY_MS)
  }, [])

  const goNext = useCallback(() => {
    pauseAutoplayTemporarily()
    goToIndex(safeIndex + 1)
  }, [goToIndex, pauseAutoplayTemporarily, safeIndex])

  const goPrevious = useCallback(() => {
    pauseAutoplayTemporarily()
    goToIndex(safeIndex - 1)
  }, [goToIndex, pauseAutoplayTemporarily, safeIndex])

  useEffect(() => {
    if (count <= 1 || isAutoplayPaused || isDragging || reducedMotion) return

    const id = window.setInterval(() => {
      setActiveIndex((i) => wrapIndex(i + 1, count))
    }, AUTO_PLAY_MS)

    return () => window.clearInterval(id)
  }, [count, isAutoplayPaused, isDragging, reducedMotion, eventIdsKey])

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (count <= 1) return
    pointerStartX.current = e.clientX
    didSwipeRef.current = false
    setIsDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerStartX.current === null) return

    const delta = e.clientX - pointerStartX.current
    pointerStartX.current = null
    setIsDragging(false)

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }

    if (Math.abs(delta) >= SWIPE_THRESHOLD_PX) {
      didSwipeRef.current = true
      if (delta < 0) goNext()
      else goPrevious()
      return
    }

    didSwipeRef.current = false
  }

  const handleOpenActive = () => {
    if (didSwipeRef.current) {
      didSwipeRef.current = false
      return
    }
    const active = orderedEvents[safeIndex]
    if (active) onOpenEvent(active)
  }

  const shellClass = `relative w-full overflow-hidden rounded-b-[32px] px-4 pb-6 pt-5 md:rounded-3xl md:px-8 md:pb-8 md:pt-7 ${className}`

  const shellBackground = (
    <>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#241056] via-[#3a1a8f] to-[#5b21b6]" />
      {/* Blobs de luz ambiental */}
      <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-[#2f55f6]/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-10 h-56 w-56 rounded-full bg-[#c026d3]/35 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/10 to-transparent" />
    </>
  )

  if (loading && count === 0) {
    return (
      <section className={shellClass} aria-label="Eventos destacados" aria-busy="true">
        {shellBackground}
        <div className="relative mx-auto aspect-[4/5] w-full max-w-[720px] animate-pulse rounded-[26px] bg-white/15 sm:aspect-[16/11] md:aspect-[16/10]" />
      </section>
    )
  }

  if (count === 0) {
    return (
      <section className={shellClass} role="region" aria-label="Eventos destacados">
        {shellBackground}
        <div className="relative flex min-h-[240px] flex-col items-center justify-center px-4 text-center md:min-h-[260px]">
          <p className="text-lg font-bold text-white">Eventos universitarios</p>
          <p className="mt-1 text-sm text-white/80">Próximamente nuevas actividades en tu comunidad</p>
        </div>
      </section>
    )
  }

  const isSingle = count === 1
  const activeEvent = orderedEvents[safeIndex]
  const transitionDuration = reducedMotion ? REDUCED_TRANSITION_S : TRANSITION_S
  const enterScale = reducedMotion ? 1 : 1.04
  const exitScale = reducedMotion ? 1 : 1.03

  return (
    <section
      className={shellClass}
      role="region"
      aria-label="Eventos destacados"
      aria-roledescription="carrusel"
    >
      {shellBackground}

      <div
        className="relative mx-auto w-full max-w-[720px]"
        style={{ touchAction: "pan-y" }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Escenario full-bleed: recorta cualquier contenido fuera del evento activo */}
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[26px] shadow-[0_24px_60px_-18px_rgba(48,30,120,0.75)] sm:aspect-[16/11] md:aspect-[16/10]">
          <AnimatePresence initial={false}>
            <motion.div
              key={activeEvent.id}
              className="absolute inset-0 transform-gpu will-change-transform"
              initial={{ opacity: 0, scale: enterScale }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: exitScale }}
              transition={{ duration: transitionDuration, ease: PREMIUM_EASE }}
              style={{ transformOrigin: "center center" }}
            >
              <EventHeroCard
                event={activeEvent}
                isActive
                isSingle={isSingle}
                isAutoplayPaused={isAutoplayPaused}
                onOpen={handleOpenActive}
              />
            </motion.div>
          </AnimatePresence>

          {!isSingle ? (
            <>
              <button
                type="button"
                onClick={goPrevious}
                aria-label="Evento anterior"
                className="absolute left-1 top-1/2 z-40 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/90 text-gray-800 shadow-lg backdrop-blur transition hover:bg-white sm:flex"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Siguiente evento"
                className="absolute right-1 top-1/2 z-40 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/90 text-gray-800 shadow-lg backdrop-blur transition hover:bg-white sm:flex"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          ) : null}
        </div>
      </div>

      {!isSingle ? (
        <div
          className="relative mt-4 flex items-center justify-center gap-2"
          role="tablist"
          aria-label="Paginación de eventos destacados"
        >
          {orderedEvents.map((ev, i) => {
            const active = i === safeIndex
            return (
              <button
                key={ev.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`Ir al evento ${i + 1}`}
                onClick={() => {
                  pauseAutoplayTemporarily()
                  goToIndex(i)
                }}
                className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
                  active
                    ? "w-6 bg-[#5eead4] shadow-[0_0_12px_rgba(94,234,212,0.7)]"
                    : "w-1.5 bg-white/35 hover:bg-white/60"
                }`}
              />
            )
          })}
        </div>
      ) : null}
    </section>
  )
}

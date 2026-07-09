import { useMemo, useRef, useState } from "react"
import type { FeedPostOut } from "../../../types/post.types"
import { EventCard } from "./EventCard"

type EventsMobileCarouselProps = {
  events: FeedPostOut[]
  onOpenDetail: (event: FeedPostOut) => void
  onToggleSave: (event: FeedPostOut) => void
  onParticipate: (event: FeedPostOut) => void
  savingId: number | null
  participatingId: number | null
}

/** Agrupa los eventos en pares para renderizar 2 por slide. */
function chunkPairs<T>(items: T[]): T[][] {
  const pairs: T[][] = []
  for (let i = 0; i < items.length; i += 2) {
    pairs.push(items.slice(i, i + 2))
  }
  return pairs
}

export function EventsMobileCarousel({
  events,
  onOpenDetail,
  onToggleSave,
  onParticipate,
  savingId,
  participatingId,
}: EventsMobileCarouselProps) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [activeSlide, setActiveSlide] = useState(0)
  const slides = useMemo(() => chunkPairs(events), [events])

  const handleScroll = () => {
    const el = trackRef.current
    if (!el) return
    const index = Math.round(el.scrollLeft / el.clientWidth)
    if (index !== activeSlide) setActiveSlide(index)
  }

  const goToSlide = (index: number) => {
    const el = trackRef.current
    if (!el) return
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" })
  }

  if (slides.length === 0) return null

  return (
    <div className="w-full">
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 no-scrollbar"
        style={{ scrollbarWidth: "none" }}
      >
        {slides.map((pair, slideIndex) => (
          <div
            key={slideIndex}
            className="grid w-full shrink-0 snap-center grid-cols-2 gap-3"
          >
            {pair.map((event) => (
              <div
                key={event.id}
                className={`transition-transform duration-500 ${
                  slideIndex === activeSlide ? "scale-100" : "scale-[0.97]"
                }`}
              >
                <EventCard
                  event={event}
                  variant="carousel"
                  onOpenDetail={onOpenDetail}
                  onToggleSave={onToggleSave}
                  onParticipate={onParticipate}
                  saving={savingId === event.id}
                  participating={participatingId === event.id}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {slides.length > 1 ? (
        <div className="mt-3 flex items-center justify-center gap-1.5" role="tablist">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goToSlide(index)}
              aria-label={`Ir al grupo ${index + 1}`}
              aria-current={index === activeSlide ? "true" : undefined}
              className={`h-2 rounded-full transition-all ${
                index === activeSlide
                  ? "w-5 bg-[#6d3ff5]"
                  : "w-2 bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

import { useEffect, useState } from "react"
import { CalendarDays } from "lucide-react"
import { EventHeroCarousel } from "../features/feed/events/EventHeroCarousel"
import { EventCard } from "../features/feed/events/EventCard"
import { EventDetailModal } from "../features/feed/events/EventDetailModal"
import { useEventsFeed } from "../features/feed/events/useEventsFeed"
import { useEventActions } from "../features/feed/events/useEventActions"
import { UtoppBrandMark } from "../shared/brand/UtoppBrandMark"
import type { FeedPostOut } from "../types/post.types"

export default function EventsPage() {
  const { events, setEvents, loading, loaderRef } = useEventsFeed({ pageSize: 12 })
  const { toggleSave, toggleParticipation, savingId, participatingId } = useEventActions(setEvents)
  const [selectedEvent, setSelectedEvent] = useState<FeedPostOut | null>(null)

  useEffect(() => {
    if (!selectedEvent) return
    const fresh = events.find((e) => e.id === selectedEvent.id)
    if (fresh && fresh !== selectedEvent) setSelectedEvent(fresh)
  }, [events, selectedEvent])

  return (
    <div className="flex min-h-screen justify-center bg-gray-50" style={{ overflowAnchor: "none" }}>
      <div className="mx-auto flex w-full max-w-[1320px] items-start justify-center px-0 pb-8 pt-0 md:px-4 md:pt-6">
        <div className="w-full min-w-0 flex-1 space-y-0 md:space-y-5">
          {/* Barra móvil fija: marca Utopp centrada */}
          <div className="sticky top-0 z-30 flex h-12 items-center justify-center border-b border-gray-200/80 bg-white/95 px-4 backdrop-blur-md md:hidden">
            <UtoppBrandMark className="scale-90" to="/app/inicio" />
          </div>

          {/* Carrusel hero destacado */}
          <div className="px-0 pt-0 md:pt-0">
            <EventHeroCarousel
              events={events}
              loading={loading}
              onOpenEvent={setSelectedEvent}
              className="md:rounded-2xl"
            />
          </div>

          {/* Grid (tablet+) */}
          <div className="hidden md:block">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onOpenDetail={setSelectedEvent}
                  onToggleSave={toggleSave}
                  onParticipate={toggleParticipation}
                  saving={savingId === event.id}
                  participating={participatingId === event.id}
                />
              ))}
            </div>
          </div>

          {/* Lista vertical (mobile) */}
          <div className="md:hidden space-y-4 px-4 pb-6 pt-4">
            <h2 className="text-lg font-bold text-gray-900">Tus eventos</h2>
            {events.length > 0 ? (
              <div className="space-y-4">
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    variant="mobile"
                    onOpenDetail={setSelectedEvent}
                    onToggleSave={toggleSave}
                    onParticipate={toggleParticipation}
                    saving={savingId === event.id}
                    participating={participatingId === event.id}
                  />
                ))}
              </div>
            ) : !loading ? (
              <div className="rounded-xl border border-gray-200 bg-white py-12 text-center">
                <div className="mb-3 flex justify-center">
                  <CalendarDays className="h-12 w-12 text-gray-300" />
                </div>
                <p className="font-medium text-gray-700">Aún no hay eventos</p>
                <p className="mt-1 text-sm text-gray-400">Vuelve pronto para descubrir nuevas actividades</p>
              </div>
            ) : null}
            {loading ? (
              <div className="py-4 text-center text-sm text-gray-400">Cargando más...</div>
            ) : null}
          </div>

          {!loading && events.length === 0 ? (
            <div className="mx-4 hidden rounded-xl border border-gray-200 bg-white p-12 text-center md:mx-0 md:block">
              <div className="mb-3 flex justify-center">
                <CalendarDays className="h-12 w-12 text-gray-300" />
              </div>
              <p className="font-medium text-gray-700">Aún no hay eventos</p>
              <p className="mt-1 text-sm text-gray-400">Vuelve pronto para descubrir nuevas actividades</p>
            </div>
          ) : null}

          {loading ? (
            <div className="hidden py-4 text-center text-sm text-gray-400 md:block">Cargando más...</div>
          ) : null}
          <div ref={loaderRef} />
        </div>
      </div>

      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onToggleSave={toggleSave}
        onParticipate={toggleParticipation}
        saving={selectedEvent ? savingId === selectedEvent.id : false}
        participating={selectedEvent ? participatingId === selectedEvent.id : false}
      />
    </div>
  )
}

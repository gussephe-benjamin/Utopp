import { useState } from "react"
import { AnimatePresence } from "framer-motion"
import { CalendarDays, Plus } from "lucide-react"
import { EventHeroCarousel } from "../features/feed/events/EventHeroCarousel"
import { EventCard } from "../features/feed/events/EventCard"
import { EventDetailModal } from "../features/feed/events/EventDetailModal"
import { CreateEventWizard } from "../features/feed/events/CreateEventWizard"
import { useEventsFeed } from "../features/feed/events/useEventsFeed"
import { UtoppBrandMark } from "../shared/brand/UtoppBrandMark"
import { TW_UTOPP_GRADIENT_R } from "../shared/constants/brand"
import type { SharedEvent } from "../api/events.api"

export default function EventsPage() {
  const { events, loading, loaderRef, refresh } = useEventsFeed({ pageSize: 12 })
  const [selectedEvent, setSelectedEvent] = useState<SharedEvent | null>(null)
  const [showWizard, setShowWizard] = useState(false)

  const emptyState = (
    <>
      <div className="mb-3 flex justify-center">
        <CalendarDays className="h-12 w-12 text-gray-300" />
      </div>
      <p className="font-medium text-gray-700">Aún no hay eventos</p>
      <p className="mt-1 text-sm text-gray-400">
        Crea el primero y aparecerá también en Utopp Formulario
      </p>
    </>
  )

  return (
    <div className="flex min-h-screen justify-center bg-gray-50" style={{ overflowAnchor: "none" }}>
      <div className="mx-auto flex w-full max-w-[1320px] items-start justify-center px-0 pb-8 pt-0 md:px-4 md:pt-6">
        <div className="w-full min-w-0 flex-1 space-y-0 md:space-y-5">
          {/* Barra móvil fija: marca Utopp centrada */}
          <div className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-gray-200/80 bg-white/95 px-4 backdrop-blur-md md:hidden">
            <span className="w-9" />
            <UtoppBrandMark className="scale-90" to="/app/inicio" />
            <button
              type="button"
              onClick={() => setShowWizard(true)}
              aria-label="Crear evento"
              className={`flex h-9 w-9 items-center justify-center rounded-full text-white shadow-sm ${TW_UTOPP_GRADIENT_R}`}
            >
              <Plus className="h-5 w-5" />
            </button>
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

          {/* Encabezado + crear (tablet+) */}
          <div className="hidden items-center justify-between md:flex">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Todos los eventos</h2>
              <p className="text-sm text-gray-500">
                Eventos de toda la comunidad, creados aquí o en Utopp Formulario
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowWizard(true)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md ${TW_UTOPP_GRADIENT_R}`}
            >
              <Plus className="h-4 w-4" /> Crear evento
            </button>
          </div>

          {/* Grid (tablet+) */}
          <div className="hidden md:block">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {events.map((event) => (
                <EventCard key={event.id} event={event} onOpenDetail={setSelectedEvent} />
              ))}
            </div>
          </div>

          {/* Lista vertical (mobile) */}
          <div className="space-y-4 px-4 pb-6 pt-4 md:hidden">
            <h2 className="text-lg font-bold text-gray-900">Todos los eventos</h2>
            {events.length > 0 ? (
              <div className="space-y-4">
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    variant="mobile"
                    onOpenDetail={setSelectedEvent}
                  />
                ))}
              </div>
            ) : !loading ? (
              <div className="rounded-xl border border-gray-200 bg-white py-12 text-center">
                {emptyState}
              </div>
            ) : null}
            {loading ? (
              <div className="py-4 text-center text-sm text-gray-400">Cargando más...</div>
            ) : null}
          </div>

          {!loading && events.length === 0 ? (
            <div className="mx-4 hidden rounded-xl border border-gray-200 bg-white p-12 text-center md:mx-0 md:block">
              {emptyState}
            </div>
          ) : null}

          {loading ? (
            <div className="hidden py-4 text-center text-sm text-gray-400 md:block">
              Cargando más...
            </div>
          ) : null}
          <div ref={loaderRef} />
        </div>
      </div>

      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />

      <AnimatePresence>
        {showWizard ? (
          <CreateEventWizard onClose={() => setShowWizard(false)} onCreated={() => refresh()} />
        ) : null}
      </AnimatePresence>
    </div>
  )
}

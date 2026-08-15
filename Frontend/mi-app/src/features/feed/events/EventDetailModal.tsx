import { useEffect } from "react"
import ReactDOM from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { Calendar, ExternalLink, MapPin, Users, X } from "lucide-react"
import type { SharedEvent } from "../../../api/events.api"
import { TW_UTOPP_GRADIENT_R } from "../../../shared/constants/brand"
import { getEventType } from "./eventTypes"
import { getEventGradient } from "./eventThemes"
import {
  COUNTDOWN_TONE_CLASSES,
  formatEventDate,
  getEventCountdown,
  getRegistrationUrl,
} from "./eventUtils"
import { trackEventViewedThrottled } from "../../analytics/analyticsTracker"

type EventDetailModalProps = {
  event: SharedEvent | null
  onClose: () => void
}

export function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  useEffect(() => {
    if (!event) return
    trackEventViewedThrottled(event.id)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [event, onClose])

  return ReactDOM.createPortal(
    <AnimatePresence>
      {event ? (
        <>
          <motion.div
            className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          <div className="fixed inset-0 z-[81] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={event.title || "Detalle del evento"}
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.98 }}
              transition={{ type: "spring", duration: 0.35 }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[88vh] sm:rounded-3xl md:flex-row"
            >
              <EventDetailBody event={event} />

              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
              >
                <X className="h-5 w-5" />
              </button>

              <RegisterBar event={event} />
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}

function RegisterButton({ event, className = "" }: { event: SharedEvent; className?: string }) {
  const countdown = getEventCountdown(event)
  const isExpired = countdown?.tone === "expired"

  if (isExpired) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-500 ${className}`}
      >
        Inscripciones cerradas
      </span>
    )
  }

  return (
    <a
      href={getRegistrationUrl(event)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md ${TW_UTOPP_GRADIENT_R} ${className}`}
    >
      Registrarme <ExternalLink className="h-4 w-4" />
    </a>
  )
}

function EventDetailBody({ event }: { event: SharedEvent }) {
  const type = getEventType(event.category)
  const TypeIcon = type?.icon ?? Calendar
  const gradient = getEventGradient(event.theme)
  const countdown = getEventCountdown(event)
  const title = event.title?.trim() || "Evento sin título"
  const organizer = event.creator?.full_name || event.creator?.email

  return (
    <>
      {/* Columna imagen */}
      <div className="relative w-full shrink-0 md:w-[42%]">
        <div className="relative aspect-[16/10] w-full md:h-full md:aspect-auto">
          {event.banner_url ? (
            <img
              src={event.banner_url}
              alt={title}
              className="h-full min-h-[200px] w-full object-cover md:min-h-0"
            />
          ) : (
            <div className={`flex h-full min-h-[200px] w-full items-center justify-center ${gradient}`}>
              <TypeIcon className="h-14 w-14 text-white/85" />
            </div>
          )}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <span
              className={`rounded-full bg-gradient-to-br px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm ${
                type?.accent ?? "from-violet-600 to-indigo-600"
              }`}
            >
              {type?.label ?? "Evento"}
            </span>
            {event.allow_only_utec_emails ? (
              <span className="rounded-full border border-white/70 bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                Solo UTEC
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Columna info */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto p-5 pb-28 sm:p-6 md:pb-6">
        <h2 className="text-xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-2xl">
          {title}
        </h2>

        {event.short_description ? (
          <p className="mt-2 text-[15px] font-medium text-gray-600">{event.short_description}</p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-100 bg-gray-50 px-3 py-1 text-[12px] font-medium text-gray-600">
            <Calendar className="h-3.5 w-3.5 text-[#6d3ff5]" />
            {formatEventDate(event.date_time)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-100 bg-gray-50 px-3 py-1 text-[12px] font-medium text-gray-600">
            <MapPin className="h-3.5 w-3.5 text-[#6d3ff5]" />
            {event.location}
          </span>
          {countdown ? (
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-semibold ${COUNTDOWN_TONE_CLASSES[countdown.tone]}`}
            >
              {countdown.label}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-100 bg-gray-50 px-3 py-1 text-[12px] font-medium text-gray-600">
            <Users className="h-3.5 w-3.5 text-[#6d3ff5]" />
            {event.registered_count} inscrito{event.registered_count === 1 ? "" : "s"}
            {event.capacity ? ` de ${event.capacity}` : ""}
          </span>
        </div>

        {organizer ? (
          <p className="mt-3 text-sm text-gray-500">
            Organizado por <span className="font-semibold text-gray-700">{organizer}</span>
          </p>
        ) : null}

        {event.description ? (
          <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-gray-700">
            {event.description}
          </p>
        ) : null}

        {event.highlights && event.highlights.length > 0 ? (
          <div className="mt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Qué incluye
            </h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {event.highlights.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-gray-100 bg-gray-50 px-2.5 py-1 text-[12px] font-medium text-gray-600"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {/* Acción desktop */}
        <div className="mt-6 hidden md:block">
          <RegisterButton event={event} className="w-full" />
        </div>
      </div>
    </>
  )
}

function RegisterBar({ event }: { event: SharedEvent }) {
  return (
    <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 border-t border-gray-100 bg-white/95 p-4 backdrop-blur-sm md:hidden">
      <RegisterButton event={event} className="flex-1" />
    </div>
  )
}

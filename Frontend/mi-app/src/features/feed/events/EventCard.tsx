import { Calendar, MapPin, Users } from "lucide-react"
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

type EventCardProps = {
  event: SharedEvent
  onOpenDetail: (event: SharedEvent) => void
  variant?: "grid" | "carousel" | "mobile"
}

export function EventCard({ event, onOpenDetail, variant = "grid" }: EventCardProps) {
  const type = getEventType(event.category)
  const TypeIcon = type?.icon ?? Calendar
  const gradient = getEventGradient(event.theme)
  const countdown = getEventCountdown(event)
  const isExpired = countdown?.tone === "expired"
  const title = event.title?.trim() || "Evento sin título"
  const isMobile = variant === "mobile"

  const openRegistration = () => {
    window.open(getRegistrationUrl(event), "_blank", "noopener,noreferrer")
  }

  return (
    <article
      className={
        isMobile
          ? "relative flex w-full flex-col overflow-hidden rounded-[22px] border border-gray-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
          : "group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-gray-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_10px_34px_rgba(0,0,0,0.06)]"
      }
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpenDetail(event)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onOpenDetail(event)
          }
        }}
        className="relative block w-full cursor-pointer overflow-hidden text-left"
        aria-label={`Ver detalle de ${title}`}
      >
        <div className="relative aspect-[16/10] w-full">
          {event.banner_url ? (
            <img
              src={event.banner_url}
              alt={title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className={`flex h-full w-full items-center justify-center ${gradient}`}>
              <TypeIcon className={isMobile ? "h-12 w-12 text-white/85" : "h-10 w-10 text-white/85"} />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

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

          {countdown ? (
            <span
              className={`absolute bottom-3 left-3 inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-sm ${
                isMobile
                  ? isExpired
                    ? "border-gray-200 bg-white/95 text-gray-500"
                    : "border-gray-100 bg-white/95 text-gray-800"
                  : COUNTDOWN_TONE_CLASSES[countdown.tone]
              }`}
            >
              {countdown.label}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <button type="button" onClick={() => onOpenDetail(event)} className="text-left">
          <h3
            className={
              isMobile
                ? "line-clamp-2 text-base font-extrabold uppercase leading-snug tracking-tight text-gray-900"
                : "line-clamp-2 text-[15px] font-extrabold leading-snug tracking-tight text-gray-900 transition-colors group-hover:text-[#6d3ff5]"
            }
          >
            {title}
          </h3>
        </button>

        {event.short_description ? (
          <p className="line-clamp-2 text-[12px] leading-snug text-gray-500">
            {event.short_description}
          </p>
        ) : null}

        <div className="mt-auto space-y-1">
          <div className="flex items-center gap-1.5 text-gray-500">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-[#6d3ff5]" />
            <span className="truncate text-[12px] font-medium">{formatEventDate(event.date_time)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#6d3ff5]" />
            <span className="truncate text-[12px] font-medium">{event.location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400">
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate text-[12px] font-medium">
              {event.registered_count} inscrito{event.registered_count === 1 ? "" : "s"}
              {event.capacity ? ` de ${event.capacity}` : ""}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => (isExpired ? onOpenDetail(event) : openRegistration())}
          className={`mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-all ${
            isExpired
              ? "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
              : `text-white shadow-sm hover:shadow-md ${TW_UTOPP_GRADIENT_R}`
          }`}
        >
          {isExpired ? "Ver detalle" : "Registrarme"}
        </button>
      </div>
    </article>
  )
}

import { Calendar, Heart, Check } from "lucide-react"
import {
  POST_TYPE_LABELS,
  SUBTYPE_LABELS,
  POST_TYPE_ICONS,
  type FeedPostOut,
} from "../../../types/post.types"
import { TYPE_GRADIENTS } from "../constants/typeGradients"
import { TW_UTOPP_GRADIENT_R } from "../../../shared/constants/brand"
import { PostImageCarousel } from "../components/PostImageCarousel"
import {
  getEventCountdown,
  formatEventDate,
  COUNTDOWN_TONE_CLASSES,
} from "./eventUtils"

type EventCardProps = {
  event: FeedPostOut
  onOpenDetail: (event: FeedPostOut) => void
  onToggleSave: (event: FeedPostOut) => void
  onParticipate: (event: FeedPostOut) => void
  saving?: boolean
  participating?: boolean
  variant?: "grid" | "carousel" | "mobile"
}

export function EventCard({
  event,
  onOpenDetail,
  onToggleSave,
  onParticipate,
  saving = false,
  participating = false,
  variant = "grid",
}: EventCardProps) {
  const gradient = TYPE_GRADIENTS[event.post_type] ?? TYPE_GRADIENTS.event
  const TypeIcon = POST_TYPE_ICONS[event.post_type] ?? Calendar
  const countdown = getEventCountdown(event)
  const isParticipating = Boolean(event.participation_status)
  const isExpired = countdown?.tone === "expired"
  const title = event.title?.trim() || "Evento sin título"
  const hasImages = event.images_count > 0 || Boolean(event.image_url)

  if (variant === "mobile") {
    return (
      <article className="relative flex w-full flex-col overflow-hidden rounded-[22px] border border-gray-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
        {/* Imagen + overlays */}
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
            {hasImages ? (
              <PostImageCarousel
                postId={event.id}
                imagesCount={event.images_count}
                fallbackImageUrl={event.image_url}
                alt={title}
                className="h-full w-full"
                imageClassName="h-full w-full object-cover"
                autoPlay
                onImageAreaClick={() => onOpenDetail(event)}
              />
            ) : (
              <div className={`flex h-full w-full items-center justify-center ${gradient}`}>
                <TypeIcon className="h-12 w-12 text-white/85" />
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />

            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm ${gradient}`}>
                {POST_TYPE_LABELS[event.post_type]}
              </span>
              {event.subtype ? (
                <span className="rounded-full border border-cyan-200/80 bg-cyan-50/95 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-800 shadow-sm backdrop-blur-sm">
                  {SUBTYPE_LABELS[event.subtype]}
                </span>
              ) : null}
            </div>

            {countdown ? (
              <span
                className={`absolute bottom-3 left-3 inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-md ${
                  countdown.tone === "expired"
                    ? "border-gray-200 bg-white/95 text-gray-500"
                    : "border-gray-100 bg-white/95 text-gray-800"
                }`}
              >
                {countdown.label}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggleSave(event)
            }}
            disabled={saving}
            aria-label={event.is_saved ? "Quitar de guardados" : "Guardar evento"}
            aria-pressed={event.is_saved}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-gray-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-white disabled:opacity-60"
          >
            <Heart
              className={`h-[18px] w-[18px] ${
                event.is_saved ? "fill-rose-500 text-rose-500" : "text-gray-500"
              }`}
            />
          </button>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-2 p-4">
          <button type="button" onClick={() => onOpenDetail(event)} className="text-left">
            <h3 className="line-clamp-2 text-base font-extrabold uppercase leading-snug tracking-tight text-gray-900">
              {title}
            </h3>
          </button>

          <div className="flex items-center gap-1.5 text-gray-500">
            <Calendar className="h-4 w-4 shrink-0 text-[#6d3ff5]" />
            <span className="truncate text-[13px] font-medium">{formatEventDate(event.deadline_at)}</span>
          </div>

          <button
            type="button"
            onClick={() => (isExpired ? onOpenDetail(event) : onParticipate(event))}
            disabled={participating}
            className={`mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-bold transition-all disabled:opacity-70 ${
              isExpired
                ? "border border-gray-200 bg-gray-50 text-gray-700"
                : isParticipating
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : `text-white shadow-sm ${TW_UTOPP_GRADIENT_R}`
            }`}
          >
            {isExpired ? (
              "Ver resumen"
            ) : isParticipating ? (
              <>
                <Check className="h-4 w-4" />
                Participando
              </>
            ) : (
              "Participar"
            )}
          </button>
        </div>
      </article>
    )
  }

  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-gray-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_10px_34px_rgba(0,0,0,0.06)]"
    >
      {/* Imagen destacada */}
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
        <div className={`relative ${variant === "carousel" ? "aspect-[16/10]" : "aspect-[16/10]"} w-full`}>
          {hasImages ? (
            <PostImageCarousel
              postId={event.id}
              imagesCount={event.images_count}
              fallbackImageUrl={event.image_url}
              alt={title}
              className="h-full w-full"
              imageClassName="h-full w-full object-cover"
              autoPlay
              onImageAreaClick={() => onOpenDetail(event)}
            />
          ) : (
            <div className={`flex h-full w-full items-center justify-center ${gradient}`}>
              <TypeIcon className="h-10 w-10 text-white/85" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

          {/* Badges tipo + subtipo */}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm ${gradient}`}>
              {POST_TYPE_LABELS[event.post_type]}
            </span>
            {event.subtype ? (
              <span className="rounded-full border border-white/70 bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                {SUBTYPE_LABELS[event.subtype]}
              </span>
            ) : null}
          </div>

          {/* Countdown */}
          {countdown ? (
            <span
              className={`absolute bottom-3 left-3 inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-sm ${COUNTDOWN_TONE_CLASSES[countdown.tone]}`}
            >
              {countdown.label}
            </span>
          ) : null}
        </div>
      </div>

      {/* Corazón flotante (guardar) */}
      <button
        type="button"
        onClick={() => onToggleSave(event)}
        disabled={saving}
        aria-label={event.is_saved ? "Quitar de guardados" : "Guardar evento"}
        aria-pressed={event.is_saved}
        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-white disabled:opacity-60"
      >
        <Heart
          className={`h-[18px] w-[18px] transition-colors ${
            event.is_saved ? "fill-rose-500 text-rose-500" : "text-gray-500"
          }`}
        />
      </button>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <button
          type="button"
          onClick={() => onOpenDetail(event)}
          className="text-left"
        >
          <h3 className="line-clamp-2 text-[15px] font-extrabold leading-snug tracking-tight text-gray-900 transition-colors group-hover:text-[#6d3ff5]">
            {title}
          </h3>
        </button>

        <div className="mt-auto flex items-center gap-1.5 text-gray-500">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-[#6d3ff5]" />
          <span className="truncate text-[12px] font-medium">{formatEventDate(event.deadline_at)}</span>
        </div>

        <button
          type="button"
          onClick={() => (isExpired ? onOpenDetail(event) : onParticipate(event))}
          disabled={participating && !isExpired}
          className={`mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-all disabled:opacity-70 ${
            isExpired
              ? "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
              : isParticipating
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : `text-white shadow-sm hover:shadow-md ${TW_UTOPP_GRADIENT_R}`
          }`}
        >
          {isExpired ? (
            "Ver resumen"
          ) : isParticipating ? (
            <>
              <Check className="h-4 w-4" />
              Participando
            </>
          ) : (
            "Participar"
          )}
        </button>
      </div>
    </article>
  )
}

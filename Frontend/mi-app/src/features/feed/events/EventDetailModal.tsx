import { useEffect, useState } from "react"
import ReactDOM from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { X, Heart, Check, Calendar, Users } from "lucide-react"
import {
  POST_TYPE_LABELS,
  SUBTYPE_LABELS,
  POST_TYPE_ICONS,
  type FeedPostOut,
} from "../../../types/post.types"
import { TYPE_GRADIENTS } from "../constants/typeGradients"
import { TW_UTOPP_GRADIENT_R } from "../../../shared/constants/brand"
import { PostImageCarousel } from "../components/PostImageCarousel"
import { getParticipantCounts, type ParticipantCounts } from "../../../api/participants.api"
import {
  getEventCountdown,
  formatEventDate,
  COUNTDOWN_TONE_CLASSES,
} from "./eventUtils"

type EventDetailModalProps = {
  event: FeedPostOut | null
  onClose: () => void
  onToggleSave: (event: FeedPostOut) => void
  onParticipate: (event: FeedPostOut) => void
  saving?: boolean
  participating?: boolean
}

export function EventDetailModal({
  event,
  onClose,
  onToggleSave,
  onParticipate,
  saving = false,
  participating = false,
}: EventDetailModalProps) {
  const [counts, setCounts] = useState<ParticipantCounts | null>(null)

  useEffect(() => {
    if (!event) return
    let cancelled = false
    setCounts(null)
    getParticipantCounts(event.id)
      .then((c) => {
        if (!cancelled) setCounts(c)
      })
      .catch(() => {
        return
      })
    return () => {
      cancelled = true
    }
  }, [event])

  useEffect(() => {
    if (!event) return
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
              <EventDetailBody
                event={event}
                counts={counts}
                saving={saving}
                participating={participating}
                onToggleSave={onToggleSave}
                onParticipate={onParticipate}
              />

              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Barra de acciones (sticky abajo en mobile, en columna derecha en desktop) */}
              <ActionBar
                event={event}
                saving={saving}
                participating={participating}
                onToggleSave={onToggleSave}
                onParticipate={onParticipate}
              />
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}

function EventDetailBody({
  event,
  counts,
  saving,
  participating,
  onToggleSave,
  onParticipate,
}: {
  event: FeedPostOut
  counts: ParticipantCounts | null
  saving: boolean
  participating: boolean
  onToggleSave: (event: FeedPostOut) => void
  onParticipate: (event: FeedPostOut) => void
}) {
  const gradient = TYPE_GRADIENTS[event.post_type] ?? TYPE_GRADIENTS.event
  const TypeIcon = POST_TYPE_ICONS[event.post_type] ?? Calendar
  const countdown = getEventCountdown(event)
  const title = event.title?.trim() || "Evento sin título"
  const goingTotal = counts ? counts.going + counts.attended : null
  const isParticipating = Boolean(event.participation_status)
  const isExpired = countdown?.tone === "expired"
  const hasImages = event.images_count > 0 || Boolean(event.image_url)

  return (
    <>
      {/* Columna imagen */}
      <div className="relative w-full shrink-0 md:w-[42%]">
        <div className="relative aspect-[16/10] w-full md:h-full md:aspect-auto">
          {hasImages ? (
            <PostImageCarousel
              postId={event.id}
              imagesCount={event.images_count}
              fallbackImageUrl={event.image_url}
              alt={title}
              className="h-full min-h-[200px] w-full md:min-h-0"
              imageClassName="h-full w-full object-cover"
              autoPlay
            />
          ) : (
            <div className={`flex h-full min-h-[200px] w-full items-center justify-center ${gradient}`}>
              <TypeIcon className="h-14 w-14 text-white/85" />
            </div>
          )}
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
        </div>
      </div>

      {/* Columna info */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto p-5 pb-28 sm:p-6 md:pb-6">
        <h2 className="text-xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-2xl">
          {title}
        </h2>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-100 bg-gray-50 px-3 py-1 text-[12px] font-medium text-gray-600">
            <Calendar className="h-3.5 w-3.5 text-[#6d3ff5]" />
            {formatEventDate(event.deadline_at)}
          </span>
          {countdown ? (
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-semibold ${COUNTDOWN_TONE_CLASSES[countdown.tone]}`}
            >
              {countdown.label}
            </span>
          ) : null}
          {goingTotal !== null ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-100 bg-gray-50 px-3 py-1 text-[12px] font-medium text-gray-600">
              <Users className="h-3.5 w-3.5 text-[#6d3ff5]" />
              {goingTotal} inscritos
            </span>
          ) : null}
        </div>

        {event.user_name ? (
          <p className="mt-3 text-sm text-gray-500">
            Organizado por <span className="font-semibold text-gray-700">{event.user_name}</span>
          </p>
        ) : null}

        {event.description ? (
          <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-gray-700">
            {event.description}
          </p>
        ) : null}

        {event.tags && event.tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {event.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-gray-100 bg-gray-50 px-2.5 py-0.5 text-[11px] font-medium text-gray-500"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : null}

        {/* Acciones desktop */}
        <div className="mt-6 hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={() => onToggleSave(event)}
            disabled={saving}
            aria-label={event.is_saved ? "Quitar de guardados" : "Guardar evento"}
            aria-pressed={event.is_saved}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            <Heart className={`h-5 w-5 ${event.is_saved ? "fill-rose-500 text-rose-500" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isExpired) onParticipate(event)
            }}
            disabled={participating && !isExpired}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-3 text-sm font-bold transition-all disabled:opacity-70 ${
              isExpired
                ? "border border-gray-200 bg-gray-50 text-gray-700"
                : isParticipating
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : `text-white shadow-sm hover:shadow-md ${TW_UTOPP_GRADIENT_R}`
            }`}
          >
            {isExpired ? (
              "Ver resumen"
            ) : isParticipating ? (
              <>
                <Check className="h-4 w-4" /> Participando
              </>
            ) : (
              "Participar"
            )}
          </button>
        </div>
      </div>
    </>
  )
}

function ActionBar({
  event,
  saving,
  participating,
  onToggleSave,
  onParticipate,
}: {
  event: FeedPostOut
  saving: boolean
  participating: boolean
  onToggleSave: (event: FeedPostOut) => void
  onParticipate: (event: FeedPostOut) => void
}) {
  const countdown = getEventCountdown(event)
  const isParticipating = Boolean(event.participation_status)
  const isExpired = countdown?.tone === "expired"

  return (
    <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 border-t border-gray-100 bg-white/95 p-4 backdrop-blur-sm md:hidden">
      <button
        type="button"
        onClick={() => onToggleSave(event)}
        disabled={saving}
        aria-label={event.is_saved ? "Quitar de guardados" : "Guardar evento"}
        aria-pressed={event.is_saved}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-60"
      >
        <Heart className={`h-5 w-5 ${event.is_saved ? "fill-rose-500 text-rose-500" : ""}`} />
      </button>
      <button
        type="button"
        onClick={() => {
          if (!isExpired) onParticipate(event)
        }}
        disabled={participating && !isExpired}
        className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-3 text-sm font-bold transition-all disabled:opacity-70 ${
          isExpired
            ? "border border-gray-200 bg-gray-50 text-gray-700"
            : isParticipating
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
              : `text-white ${TW_UTOPP_GRADIENT_R}`
        }`}
      >
        {isExpired ? (
          "Ver resumen"
        ) : isParticipating ? (
          <>
            <Check className="h-4 w-4" /> Participando
          </>
        ) : (
          "Participar"
        )}
      </button>
    </div>
  )
}

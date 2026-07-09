import { CalendarDays, LayoutGrid } from "lucide-react"
import { AppLink } from "../../../shared/navigation/AppLink"
import { TW_UTOPP_GRADIENT_R } from "../../../shared/constants/brand"

type FeedSectionSwitchProps = {
  active: "posts" | "events" | null
  className?: string
  /** `mobile`: compacto para bottom-nav; `default`: navbar desktop. */
  variant?: "default" | "mobile"
  /** Si ya estás en Publicaciones y se vuelve a pulsar (p. ej. scroll al tope). */
  onPostsReselect?: () => void
}

const ICON_BTN =
  "relative z-10 flex flex-1 items-center justify-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-offset-1"

/**
 * Switch iconográfico Publicaciones ↔ Eventos (sin etiquetas de texto).
 * Navega por pathname: `/app/inicio` y `/app/eventos`.
 */
export function FeedSectionSwitch({
  active,
  className = "",
  variant = "default",
  onPostsReselect,
}: FeedSectionSwitchProps) {
  const isMobile = variant === "mobile"
  const isPosts = active === "posts"
  const isEvents = active === "events"

  const trackClass = isMobile
    ? "h-8 w-[4.25rem] p-0.5"
    : "h-9 w-[5rem] p-0.5"

  const iconClass = isMobile ? "h-3.5 w-3.5" : "h-4 w-4"

  return (
    <nav
      className={`relative inline-flex shrink-0 items-center rounded-full border border-violet-100/90 bg-violet-50/80 shadow-sm ${trackClass} ${className}`}
      aria-label="Sección del feed"
    >
      {/* Indicador deslizante */}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full ${TW_UTOPP_GRADIENT_R} shadow-[0_2px_8px_rgba(47,85,246,0.35)] transition-transform duration-200 ease-out motion-reduce:transition-none ${
          isEvents ? "translate-x-[calc(100%+2px)]" : "translate-x-0"
        }`}
      />

      <AppLink
        to="/app/inicio"
        onClick={(event) => {
          if (isPosts && onPostsReselect) {
            event.preventDefault()
            onPostsReselect()
          }
        }}
        className={`${ICON_BTN} ${isMobile ? "h-7" : "h-8"}`}
        aria-label="Publicaciones"
        aria-current={isPosts ? "page" : undefined}
      >
        <LayoutGrid
          className={`${iconClass} stroke-[2.25] ${
            isPosts ? "text-white" : "text-violet-400/80"
          }`}
          aria-hidden
        />
      </AppLink>

      <AppLink
        to="/app/eventos"
        className={`${ICON_BTN} ${isMobile ? "h-7" : "h-8"}`}
        aria-label="Eventos"
        aria-current={isEvents ? "page" : undefined}
      >
        <CalendarDays
          className={`${iconClass} stroke-[2.25] ${
            isEvents ? "text-white" : "text-violet-400/80"
          }`}
          aria-hidden
        />
      </AppLink>
    </nav>
  )
}

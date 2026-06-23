import { CalendarDays, Sparkles } from "lucide-react"
import type { AuthLeftPanelLayout } from "../hooks/useAuthLeftPanelLayout"
import { TW_AUTH } from "../constants/authTheme"
import { useAuthShowcase } from "../hooks/useAuthShowcase"
import { AuthLatestEvents } from "./AuthLatestEvents"
import { OrgCarousel } from "./OrgCarousel"

type AuthShowcaseSectionProps = {
  variant: "desktop" | "mobile"
  layout?: AuthLeftPanelLayout
}

export function AuthShowcaseSection({ variant, layout }: AuthShowcaseSectionProps) {
  const { events, organizations, loading, hasEvents, hasOrganizations } =
    useAuthShowcase()

  if (!loading && !hasEvents && !hasOrganizations) return null

  if (variant === "mobile") {
    return (
      <section
        className="mx-auto w-full max-w-[30rem] px-4 pb-6 pt-4 md:hidden"
        aria-label="Actividad en Utopp"
      >
        <div className="flex flex-col gap-[clamp(0.75rem,1.5vw,1rem)]">
          {(loading || hasEvents) && (
            <section
              aria-label="Últimos eventos"
              className="flex w-full flex-col gap-3"
            >
              <div className={TW_AUTH.heroSectionLabelMobile}>
                <CalendarDays className="size-4 shrink-0" aria-hidden />
                <span>Últimos eventos</span>
              </div>
              <AuthLatestEvents events={events} loading={loading} />
            </section>
          )}

          {(loading || hasOrganizations) && (
            <section
              aria-label="Organizaciones en Utopp"
              className="flex w-full flex-col gap-3 [@media(max-height:679px)]:hidden"
            >
              <div className={TW_AUTH.heroSectionLabelMobile}>
                <Sparkles className="size-4 shrink-0" aria-hidden />
                <span>Organizaciones en Utopp</span>
              </div>
              <OrgCarousel organizations={organizations} loading={loading} />
            </section>
          )}
        </div>
      </section>
    )
  }

  if (!layout || (layout.maxEvents === 0 && !layout.showOrganizations)) return null

  return (
    <div className="flex flex-col gap-[clamp(1rem,2vw,1.5rem)]">
      {(loading || hasEvents) && (
        <section
          aria-label="Últimos eventos"
          className="flex w-full max-w-[33.75rem] flex-col gap-3"
        >
          <div className={TW_AUTH.heroSectionLabel}>
            <CalendarDays className="size-4 shrink-0 text-white/60" aria-hidden />
            <span>Últimos eventos</span>
          </div>
          <AuthLatestEvents
            events={events}
            loading={loading}
            maxVisible={layout.maxEvents}
            compact={layout.compactSpacing}
          />
        </section>
      )}

      {layout.showOrganizations && (loading || hasOrganizations) && (
        <section
          aria-label="Organizaciones en Utopp"
          className="flex w-full max-w-[33.75rem] flex-col gap-3 pt-1"
        >
          <div className={TW_AUTH.heroSectionLabel}>
            <Sparkles className="size-4 shrink-0 text-white/60" aria-hidden />
            <span>Organizaciones en Utopp</span>
          </div>
          <OrgCarousel
            organizations={organizations}
            loading={loading}
            compact={layout.compactSpacing}
          />
        </section>
      )}
    </div>
  )
}

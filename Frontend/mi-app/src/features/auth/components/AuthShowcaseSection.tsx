import { CalendarDays, Sparkles } from "lucide-react"
import { useAuthShowcase } from "../hooks/useAuthShowcase"
import { AuthLatestEvents } from "./AuthLatestEvents"
import { OrgCarousel } from "./OrgCarousel"

type AuthShowcaseSectionProps = {
  variant: "desktop" | "mobile"
}

export function AuthShowcaseSection({ variant }: AuthShowcaseSectionProps) {
  const { events, organizations, loading, hasEvents, hasOrganizations } =
    useAuthShowcase()

  if (!loading && !hasEvents && !hasOrganizations) return null

  if (variant === "mobile") {
    return (
      <section
        className="mx-auto w-full max-w-[30rem] px-4 pb-6 pt-4 md:hidden"
        aria-label="Actividad en Utopp"
      >
        <div className="space-y-3">
          {(loading || hasEvents) && (
            <div className="flex items-center gap-2 px-1">
              <CalendarDays className="h-4 w-4 shrink-0 text-[#8A93A2]" aria-hidden />
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8A93A2]">
                Últimos eventos
              </p>
            </div>
          )}
          <AuthLatestEvents events={events} loading={loading} />

          {(loading || hasOrganizations) && (
            <div className="space-y-3 [@media(max-height:679px)]:hidden">
              <div className="flex items-center gap-2 px-1 pt-2">
                <Sparkles className="h-4 w-4 shrink-0 text-[#8A93A2]" aria-hidden />
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8A93A2]">
                  Organizaciones en Utopp
                </p>
              </div>
              <OrgCarousel organizations={organizations} loading={loading} />
            </div>
          )}
        </div>
      </section>
    )
  }

  return (
    <div className="mt-10 space-y-3 [@media(max-height:860px)]:mt-6 [@media(max-height:660px)]:hidden">
      {(loading || hasEvents) && (
        <div className="flex items-center gap-2 px-1">
          <CalendarDays className="h-4 w-4 shrink-0 text-white/60" aria-hidden />
          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
            Últimos eventos
          </p>
        </div>
      )}
      <AuthLatestEvents events={events} loading={loading} />

      {(loading || hasOrganizations) && (
        <div className="flex items-center gap-2 px-1 pt-2">
          <Sparkles className="h-4 w-4 shrink-0 text-white/60" aria-hidden />
          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
            Organizaciones en Utopp
          </p>
        </div>
      )}
      <OrgCarousel organizations={organizations} loading={loading} />
    </div>
  )
}

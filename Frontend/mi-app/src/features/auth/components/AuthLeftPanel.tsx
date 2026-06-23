import { useEffect, useState } from "react"
import { Briefcase, CalendarDays, MessageCircle, Sparkles, Users } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import {
  AUTH_BACKGROUND_IMAGE_URL,
  UTOPP_LOGO_SRC,
} from "../../../shared/constants/brand"
import { AUTH_VALUE } from "../constants/authCopy"
import { TW_AUTH } from "../constants/authTheme"
import { useAuthShowcase } from "../hooks/useAuthShowcase"
import { AuthDecorativeShapes } from "./AuthDecorativeShapes"
import { AuthLatestEvents } from "./AuthLatestEvents"
import { OrgCarousel } from "./OrgCarousel"

const benefitIcons: LucideIcon[] = [MessageCircle, CalendarDays, Users, Briefcase]

function UtoppLogoWhite() {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src={UTOPP_LOGO_SRC}
        alt=""
        aria-hidden
        className="h-9 w-9 object-contain drop-shadow-[0_4px_12px_rgba(109,93,252,0.35)]"
      />
      <span className="font-display text-xl font-bold tracking-tight text-white">Utopp</span>
    </div>
  )
}

function useIsMdUp(): boolean {
  const [isMdUp, setIsMdUp] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const mq = window.matchMedia("(min-width: 768px)")
    const update = () => setIsMdUp(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  return isMdUp
}

function AuthShowcaseSection() {
  const { events, organizations, loading, hasEvents, hasOrganizations } =
    useAuthShowcase()

  if (!loading && !hasEvents && !hasOrganizations) return null

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

export function AuthLeftPanel() {
  const isMdUp = useIsMdUp()

  return (
    <div className="relative flex h-full flex-col justify-center overflow-hidden bg-gradient-to-br from-[#1a1040] via-[#2d1b69] to-[#0F1117] px-8 py-12 lg:px-12 xl:px-16 [@media(max-height:760px)]:py-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `url("${AUTH_BACKGROUND_IMAGE_URL.replace(/"/g, '\\"')}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        aria-hidden
      />

      <AuthDecorativeShapes />

      <div className="relative z-10 max-w-lg">
        <div className="mb-10 [@media(max-height:760px)]:mb-6">
          <UtoppLogoWhite />
        </div>

        <h1
          className="font-display font-bold leading-tight tracking-tight text-white"
          style={{ fontSize: "clamp(2.25rem, 4vw, 3.5rem)" }}
        >
          {AUTH_VALUE.headline}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[#B8C0CC]">
          {AUTH_VALUE.subheadline}
        </p>

        <ul className="mt-8 space-y-3.5 [@media(max-height:820px)]:hidden">
          {AUTH_VALUE.benefits.map((benefit, index) => {
            const Icon = benefitIcons[index] ?? MessageCircle
            return (
              <li key={benefit} className="group flex items-center gap-3">
                <span className={TW_AUTH.benefitGlass}>
                  <Icon className="h-5 w-5 text-white/90" aria-hidden />
                </span>
                <span className="text-[0.9375rem] font-medium text-white">{benefit}</span>
              </li>
            )
          })}
        </ul>

        {isMdUp && <AuthShowcaseSection />}
      </div>
    </div>
  )
}

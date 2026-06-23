import { useEffect, useState } from "react"
import { Briefcase, CalendarDays, MessageCircle, Users } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import {
  AUTH_BACKGROUND_IMAGE_URL,
  UTOPP_LOGO_SRC,
} from "../../../shared/constants/brand"
import { AUTH_VALUE } from "../constants/authCopy"
import { TW_AUTH } from "../constants/authTheme"
import { useAuthLeftPanelLayout } from "../hooks/useAuthLeftPanelLayout"
import { AuthDecorativeShapes } from "./AuthDecorativeShapes"
import { AuthShowcaseSection } from "./AuthShowcaseSection"

const benefitIcons: LucideIcon[] = [MessageCircle, CalendarDays, Users, Briefcase]

function UtoppLogoWhite() {
  return (
    <div className={TW_AUTH.heroLogo}>
      <img
        src={UTOPP_LOGO_SRC}
        alt=""
        aria-hidden
        className={TW_AUTH.heroLogoIcon}
      />
      <span className={TW_AUTH.heroLogoText}>Utopp</span>
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

export function AuthLeftPanel() {
  const isMdUp = useIsMdUp()
  const layout = useAuthLeftPanelLayout()

  return (
    <div className="relative flex h-full flex-col justify-center overflow-hidden bg-gradient-to-br from-[#1a1040] via-[#2d1b69] to-[#0F1117] px-[clamp(1.25rem,4vw,4rem)] py-12 lg:py-12 [@media(max-height:900px)]:justify-start [@media(max-height:900px)]:overflow-y-auto [@media(max-height:900px)]:py-8 [@media(max-height:760px)]:py-6">
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

      <div className={`relative z-10 h-full ${TW_AUTH.heroContent}`}>
        <header className="shrink-0">
          <div className="mb-[clamp(1.25rem,3vw,2rem)]">
            <UtoppLogoWhite />
          </div>

          <h1
            className={
              layout.compactSpacing ? TW_AUTH.heroTitleCompact : TW_AUTH.heroTitle
            }
          >
            {AUTH_VALUE.headline}
          </h1>
          <p
            className={`${TW_AUTH.heroDescription} ${
              layout.compactSpacing ? "line-clamp-3" : ""
            }`}
          >
            {AUTH_VALUE.subheadline}
          </p>
        </header>

        {layout.showBenefits && (
          <ul className={`shrink-0 ${TW_AUTH.heroBenefits}`}>
            {AUTH_VALUE.benefits.map((benefit, index) => {
              const Icon = benefitIcons[index] ?? MessageCircle
              return (
                <li key={benefit} className={TW_AUTH.heroBenefitItem}>
                  <span className={TW_AUTH.heroBenefitIcon}>
                    <Icon className="size-4 text-white/90" aria-hidden />
                  </span>
                  <span className={TW_AUTH.heroBenefitText}>{benefit}</span>
                </li>
              )
            })}
          </ul>
        )}

        {isMdUp && (layout.maxEvents > 0 || layout.showOrganizations) && (
          <div className="min-h-0 flex-1 overflow-y-auto pb-4 no-scrollbar">
            <AuthShowcaseSection variant="desktop" layout={layout} />
          </div>
        )}
      </div>
    </div>
  )
}

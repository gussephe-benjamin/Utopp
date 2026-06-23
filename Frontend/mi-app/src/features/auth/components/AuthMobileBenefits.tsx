import { Briefcase, CalendarDays, MessageCircle, Users } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { UTOPP_LOGO_SRC } from "../../../shared/constants/brand"
import { AUTH_VALUE } from "../constants/authCopy"

const benefitIcons: LucideIcon[] = [MessageCircle, CalendarDays, Users, Briefcase]

export function AuthMobileLogo() {
  return (
    <div className="flex items-center justify-center gap-2 pt-6 md:hidden">
      <img src={UTOPP_LOGO_SRC} alt="" aria-hidden className="h-8 w-8 object-contain" />
      <span className="font-display text-lg font-bold tracking-tight text-white">Utopp</span>
    </div>
  )
}

export function AuthMobileBenefits() {
  return (
    <section className="md:hidden pb-8 pt-4" aria-label="Beneficios de Utopp">
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 no-scrollbar">
        {AUTH_VALUE.benefits.map((benefit, index) => {
          const Icon = benefitIcons[index] ?? MessageCircle
          return (
            <div
              key={benefit}
              className="flex min-h-[44px] min-w-[11.5rem] shrink-0 snap-start items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
                <Icon className="h-4 w-4 text-white/90" aria-hidden />
              </span>
              <span className="text-sm font-medium text-[#8A93A2]">{benefit}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

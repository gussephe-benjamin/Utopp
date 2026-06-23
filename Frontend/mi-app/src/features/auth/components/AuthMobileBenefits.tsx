import { UTOPP_LOGO_SRC } from "../../../shared/constants/brand"

export function AuthMobileLogo() {
  return (
    <div className="flex items-center justify-center gap-2 pt-6 md:hidden">
      <img src={UTOPP_LOGO_SRC} alt="" aria-hidden className="h-8 w-8 object-contain" />
      <span className="font-display text-lg font-bold tracking-tight text-white">Utopp</span>
    </div>
  )
}

import type { ReactNode } from "react"
import { AuthLeftPanel } from "./AuthLeftPanel"
import { AuthMobileBenefits, AuthMobileLogo } from "./AuthMobileBenefits"

export type AuthTransitionDirection = "from-right" | "from-left"

type AuthSplitLayoutProps = {
  children: ReactNode
}

/**
 * Shell dark de autenticación.
 * - Móvil: pantalla completa (#0F1117), logo + card + benefits carousel.
 * - Desktop: split 55/45 con storytelling a la izquierda.
 */
export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0F1117] md:h-screen md:flex-row md:overflow-hidden">
      <AuthMobileLogo />

      <div className="relative hidden h-screen w-[55%] md:block">
        <AuthLeftPanel />
      </div>

      <div className="relative flex flex-1 flex-col md:h-screen md:w-[45%] md:overflow-y-auto">
        <div className="flex flex-1 items-start justify-center px-4 py-6 md:items-center md:px-6 md:py-10 lg:px-10 md:[align-items:safe_center]">
          {children}
        </div>
        <AuthMobileBenefits />
      </div>
    </div>
  )
}

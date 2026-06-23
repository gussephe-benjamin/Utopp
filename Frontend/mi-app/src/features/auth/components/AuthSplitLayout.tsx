import { useRef, type ReactNode } from "react"
import { AuthAmbientBackground } from "./ambient/AuthAmbientBackground"
import { AuthLeftPanel } from "./AuthLeftPanel"
import { AuthMobileLogo } from "./AuthMobileBenefits"
import { AuthMobileShowcase } from "./AuthMobileShowcase"

export type AuthTransitionDirection = "from-right" | "from-left"

type AuthSplitLayoutProps = {
  children: ReactNode
}

/**
 * Shell dark de autenticación.
 * - Móvil: pantalla completa (#0F1117), logo + card + showcase de eventos.
 * - Desktop: split 55/45 con storytelling a la izquierda.
 */
export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  const rightPanelRef = useRef<HTMLDivElement>(null)

  return (
    <div className="flex min-h-screen flex-col bg-[#0F1117] md:h-screen md:flex-row md:overflow-hidden">
      <AuthMobileLogo />

      <div className="relative hidden h-screen w-[55%] md:block">
        <AuthLeftPanel />
      </div>

      <div
        ref={rightPanelRef}
        className="relative flex flex-1 flex-col md:h-screen md:w-[45%] md:overflow-y-auto"
      >
        <AuthAmbientBackground containerRef={rightPanelRef} />
        <div className="relative z-10 flex flex-1 items-start justify-center px-4 py-6 md:items-center md:px-6 md:py-10 lg:px-10 md:[align-items:safe_center]">
          {children}
        </div>
        <AuthMobileShowcase />
      </div>
    </div>
  )
}

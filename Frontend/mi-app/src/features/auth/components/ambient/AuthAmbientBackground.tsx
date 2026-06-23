import type { RefObject } from "react"
import { AuthAmbientOrbs } from "./AuthAmbientOrbs"
import { AuthAmbientParticles } from "./AuthAmbientParticles"
import { AuthScanlineShapes } from "./AuthScanlineShapes"
import { useAuthAmbientMotion } from "./useAuthAmbientMotion"

type AuthAmbientBackgroundProps = {
  containerRef: RefObject<HTMLElement | null>
}

/** Fondo ambiental de capas para el panel derecho de autenticación. */
export function AuthAmbientBackground({ containerRef }: AuthAmbientBackgroundProps) {
  const { reducedMotion, ambientRootRef } = useAuthAmbientMotion(containerRef)

  return (
    <div
      ref={ambientRootRef}
      className="auth-ambient-root pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      {/* Layer 1: gradient base */}
      <div className="auth-ambient-layer-base absolute inset-0" />

      {/* Layer 2: ambient orbs */}
      <AuthAmbientOrbs />

      {/* Layer 2.5: drifting particles */}
      <AuthAmbientParticles containerRef={containerRef} reducedMotion={reducedMotion} />

      {/* Layer 3: scanline shapes */}
      <AuthScanlineShapes />

      {/* Layer 4: atmospheric overlay */}
      <div className="auth-ambient-layer-overlay absolute inset-0" />
    </div>
  )
}

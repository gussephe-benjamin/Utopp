import { useEffect, useRef, useState } from "react"
import type { RefObject } from "react"
import { AUTH_AMBIENT } from "../../constants/authTheme"
import { useAmbientParticles } from "./useAmbientParticles"

type AuthAmbientParticlesProps = {
  containerRef: RefObject<HTMLElement | null>
  reducedMotion: boolean
}

function useParticleCount(): number {
  const [count, setCount] = useState<number>(AUTH_AMBIENT.particleCount.desktop)

  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia("(max-width: 767px)")
    const update = () =>
      setCount(
        mq.matches ? AUTH_AMBIENT.particleCount.mobile : AUTH_AMBIENT.particleCount.desktop,
      )
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  return count
}

/** Partículas indigo/violeta con drift y fade (Layer 2.5). */
export function AuthAmbientParticles({ containerRef, reducedMotion }: AuthAmbientParticlesProps) {
  const count = useParticleCount()
  const particleRefs = useRef<(HTMLDivElement | null)[]>([])

  useAmbientParticles(containerRef, particleRefs, count, reducedMotion)

  if (reducedMotion) return null

  return (
    <div className="auth-ambient-parallax-particles absolute inset-0" aria-hidden>
      {Array.from({ length: count }, (_, index) => {
        const color =
          index % 2 === 0 ? AUTH_AMBIENT.glowPrimary : AUTH_AMBIENT.glowSecondary
        const size =
          AUTH_AMBIENT.particleSize.min +
          (index % 4) * ((AUTH_AMBIENT.particleSize.max - AUTH_AMBIENT.particleSize.min) / 3)
        return (
          <div
            key={index}
            ref={(element) => {
              particleRefs.current[index] = element
            }}
            className="auth-ambient-particle"
            style={{
              width: size,
              height: size,
              backgroundColor: color,
              boxShadow: `0 0 ${size * 4}px ${color}, 0 0 ${size * 8}px ${color}40`,
              opacity: AUTH_AMBIENT.particleOpacity.min,
            }}
          />
        )
      })}
    </div>
  )
}

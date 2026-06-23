import { useEffect, useRef, type RefObject } from "react"
import { AUTH_AMBIENT } from "../../constants/authTheme"

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  phase: number
  phaseSpeed: number
}

function seededRandom(seed: number): number {
  const value = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453
  return value - Math.floor(value)
}

function createParticles(count: number, width: number, height: number): Particle[] {
  const colors = [AUTH_AMBIENT.glowPrimary, AUTH_AMBIENT.glowSecondary]
  return Array.from({ length: count }, (_, index) => {
    const seed = index + 1
    return {
      x: seededRandom(seed) * width,
      y: seededRandom(seed + 100) * height,
      vx: (seededRandom(seed + 200) - 0.5) * AUTH_AMBIENT.particleSpeed,
      vy: (seededRandom(seed + 300) - 0.5) * AUTH_AMBIENT.particleSpeed,
      size:
        AUTH_AMBIENT.particleSize.min +
        seededRandom(seed + 400) * (AUTH_AMBIENT.particleSize.max - AUTH_AMBIENT.particleSize.min),
      color: colors[index % colors.length] ?? AUTH_AMBIENT.glowPrimary,
      phase: seededRandom(seed + 500) * Math.PI * 2,
      phaseSpeed: 0.6 + seededRandom(seed + 600) * 1.0,
    }
  })
}

/** Animación rAF de partículas orbitantes con fade in/out. */
export function useAmbientParticles(
  containerRef: RefObject<HTMLElement | null>,
  particleRefs: RefObject<(HTMLDivElement | null)[]>,
  count: number,
  reducedMotion: boolean,
): void {
  const particlesDataRef = useRef<Particle[]>([])
  const sizeRef = useRef({ width: 0, height: 0 })

  useEffect(() => {
    if (reducedMotion) return

    const container = containerRef.current
    if (!container) return

    const syncSize = () => {
      const rect = container.getBoundingClientRect()
      sizeRef.current = { width: rect.width, height: rect.height }
      if (particlesDataRef.current.length === 0) {
        particlesDataRef.current = createParticles(count, rect.width, rect.height)
      }
    }

    syncSize()
    const resizeObserver = new ResizeObserver(syncSize)
    resizeObserver.observe(container)

    let rafId = 0
    let lastTime = performance.now()

    const tick = (time: number) => {
      if (document.visibilityState === "hidden") {
        lastTime = time
        rafId = requestAnimationFrame(tick)
        return
      }

      const dt = Math.min((time - lastTime) / 1000, 0.05)
      lastTime = time
      const { width, height } = sizeRef.current
      const { min, max } = AUTH_AMBIENT.particleOpacity

      particlesDataRef.current.forEach((particle, index) => {
        particle.x += particle.vx * dt
        particle.y += particle.vy * dt

        if (particle.x <= 0 || particle.x >= width) particle.vx *= -1
        if (particle.y <= 0 || particle.y >= height) particle.vy *= -1

        particle.x = Math.max(0, Math.min(width, particle.x))
        particle.y = Math.max(0, Math.min(height, particle.y))
        particle.phase += particle.phaseSpeed * dt

        const opacity = min + (max - min) * (0.5 + 0.5 * Math.sin(particle.phase))
        const element = particleRefs.current?.[index]
        if (element) {
          element.style.transform = `translate3d(${particle.x}px, ${particle.y}px, 0)`
          element.style.opacity = String(opacity)
        }
      })

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      resizeObserver.disconnect()
      particlesDataRef.current = []
    }
  }, [containerRef, particleRefs, count, reducedMotion])
}

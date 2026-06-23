import { useEffect, useRef, useState, type RefObject } from "react"

const MAX_PARALLAX_PX = 18

type AmbientMotion = {
  parallaxEnabled: boolean
  reducedMotion: boolean
  ambientRootRef: RefObject<HTMLDivElement | null>
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  })

  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  return reduced
}

function useParallaxEligible(): boolean {
  const [eligible, setEligible] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false
    return (
      window.matchMedia("(min-width: 768px)").matches &&
      !window.matchMedia("(pointer: coarse)").matches
    )
  })

  useEffect(() => {
    if (!window.matchMedia) return
    const widthMq = window.matchMedia("(min-width: 768px)")
    const coarseMq = window.matchMedia("(pointer: coarse)")
    const update = () => setEligible(widthMq.matches && !coarseMq.matches)
    widthMq.addEventListener("change", update)
    coarseMq.addEventListener("change", update)
    return () => {
      widthMq.removeEventListener("change", update)
      coarseMq.removeEventListener("change", update)
    }
  }, [])

  return eligible
}

/** Parallax sutil del fondo ambiental (máx. 15px, rAF, CSS vars en el root). */
export function useAuthAmbientMotion(
  containerRef: RefObject<HTMLElement | null>,
): AmbientMotion {
  const ambientRootRef = useRef<HTMLDivElement | null>(null)
  const reducedMotion = usePrefersReducedMotion()
  const parallaxEligible = useParallaxEligible()
  const parallaxEnabled = !reducedMotion && parallaxEligible
  const targetOffsetRef = useRef({ x: 0, y: 0 })
  const currentOffsetRef = useRef({ x: 0, y: 0 })
  const rafIdRef = useRef(0)
  const parallaxEnabledRef = useRef(parallaxEnabled)

  useEffect(() => {
    parallaxEnabledRef.current = parallaxEnabled
    if (!parallaxEnabled) {
      targetOffsetRef.current = { x: 0, y: 0 }
    }
  }, [parallaxEnabled])

  useEffect(() => {
    const root = ambientRootRef.current
    if (!root) return

    const applyParallax = () => {
      const target = targetOffsetRef.current
      const current = currentOffsetRef.current

      current.x += (target.x - current.x) * 0.12
      current.y += (target.y - current.y) * 0.12

      root.style.setProperty("--parallax-x", `${current.x}px`)
      root.style.setProperty("--parallax-y", `${current.y}px`)

      rafIdRef.current = requestAnimationFrame(applyParallax)
    }

    rafIdRef.current = requestAnimationFrame(applyParallax)
    return () => cancelAnimationFrame(rafIdRef.current)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !parallaxEnabled) return

    const handleMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const normX = (event.clientX - centerX) / (rect.width / 2)
      const normY = (event.clientY - centerY) / (rect.height / 2)
      targetOffsetRef.current = {
        x: Math.max(-MAX_PARALLAX_PX, Math.min(MAX_PARALLAX_PX, normX * MAX_PARALLAX_PX)),
        y: Math.max(-MAX_PARALLAX_PX, Math.min(MAX_PARALLAX_PX, normY * MAX_PARALLAX_PX)),
      }
    }

    const handleLeave = () => {
      targetOffsetRef.current = { x: 0, y: 0 }
    }

    container.addEventListener("mousemove", handleMove)
    container.addEventListener("mouseleave", handleLeave)
    return () => {
      container.removeEventListener("mousemove", handleMove)
      container.removeEventListener("mouseleave", handleLeave)
    }
  }, [containerRef, parallaxEnabled])

  return {
    parallaxEnabled,
    reducedMotion,
    ambientRootRef,
  }
}

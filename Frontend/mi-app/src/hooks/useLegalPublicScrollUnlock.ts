import { useCallback, useEffect, useRef, useState, type RefObject } from "react"
import { useResetOnChange } from "./useResetOnChange"

/** Tolerancia para redondeo subpixel y padding del panel de scroll. */
const SCROLL_END_THRESHOLD_PX = 64

function isScrollContainerAtEnd(el: HTMLElement): boolean {
  const { scrollTop, scrollHeight, clientHeight } = el
  if (clientHeight <= 0) return false
  if (scrollHeight <= clientHeight + 1) return true
  const remaining = scrollHeight - scrollTop - clientHeight
  return remaining <= SCROLL_END_THRESHOLD_PX
}

/**
 * Desbloquea acciones (p. ej. «Volver») cuando el usuario llega al final del
 * contenedor con scroll, o cuando el contenido cabe sin desplazarse.
 */
export function useLegalPublicScrollUnlock(
  active: boolean,
  scrollRef: RefObject<HTMLElement | null>,
  contentKey: string | number | null | undefined,
) {
  const [reachedEnd, setReachedEnd] = useState(false)
  const activeRef = useRef(active)
  useEffect(() => {
    activeRef.current = active
  }, [active])

  const evaluate = useCallback(() => {
    if (!activeRef.current) return
    const el = scrollRef.current
    if (!el) return
    if (isScrollContainerAtEnd(el)) setReachedEnd(true)
  }, [scrollRef])

  useResetOnChange([active, contentKey], () => setReachedEnd(false))

  useEffect(() => {
    if (!active) return

    // Primera medición tras pintar: el contenido lazy aún no tiene su altura.
    const raf = requestAnimationFrame(() => {
      evaluate()
      requestAnimationFrame(evaluate)
    })
    const t1 = window.setTimeout(evaluate, 100)
    const t2 = window.setTimeout(evaluate, 350)

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [active, contentKey, evaluate])

  useEffect(() => {
    if (!active) return
    const el = scrollRef.current
    if (!el) return

    const initialRaf = requestAnimationFrame(evaluate)
    el.addEventListener("scroll", evaluate, { passive: true })
    el.addEventListener("scrollend", evaluate)

    const ro = new ResizeObserver(evaluate)
    ro.observe(el)
    Array.from(el.children).forEach((child) => ro.observe(child))

    const mo = new MutationObserver(evaluate)
    mo.observe(el, { childList: true, subtree: true, characterData: true })

    window.addEventListener("resize", evaluate)

    return () => {
      cancelAnimationFrame(initialRaf)
      el.removeEventListener("scroll", evaluate)
      el.removeEventListener("scrollend", evaluate)
      ro.disconnect()
      mo.disconnect()
      window.removeEventListener("resize", evaluate)
    }
  }, [active, contentKey, evaluate, scrollRef])

  return { reachedEnd, onScroll: evaluate }
}

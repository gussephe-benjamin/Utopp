import type { RefObject } from "react";
import { useEffect, useState } from "react";

type Options = {
  /** Margen negativo inferior del root (px); el sentinela debe entrar un poco más arriba del borde. */
  rootMarginBottomPx?: number;
  /**
   * Si se define, sustituye por completo `rootMargin` del IntersectionObserver.
   * P. ej. `"0px 0px 96px 0px"` para considerar el final un poco antes del scroll real.
   */
  rootMargin?: string;
};

/**
 * Detecta si un sentinela al final del contenido es visible dentro de un contenedor con scroll (`root`).
 * Útil cuando el contenido crece de forma asíncrona (p. ej. Suspense + lazy) y `scrollHeight` no dispara ResizeObserver en el root.
 */
export function useScrollSentinelVisible(
  active: boolean,
  scrollRef: RefObject<HTMLElement | null>,
  sentinelRef: RefObject<HTMLElement | null>,
  contentKey: string | number | null | undefined,
  options?: Options,
) {
  const [sentinelVisible, setSentinelVisible] = useState(false);
  const rootMarginBottomPx = options?.rootMarginBottomPx ?? 8;
  const rootMarginOverride = options?.rootMargin;
  const rootMargin =
    rootMarginOverride ?? `0px 0px -${Math.max(0, rootMarginBottomPx)}px 0px`;

  useEffect(() => {
    if (!active) {
      setSentinelVisible(false);
      return;
    }
    setSentinelVisible(false);
  }, [active, contentKey]);

  useEffect(() => {
    if (!active) return;
    const root = scrollRef.current;
    const target = sentinelRef.current;
    if (!root || !target) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        setSentinelVisible(Boolean(e?.isIntersecting));
      },
      {
        root,
        rootMargin,
        threshold: 0,
      },
    );

    obs.observe(target);
    return () => obs.disconnect();
  }, [active, contentKey, rootMargin, scrollRef, sentinelRef]);

  return { sentinelVisible };
}

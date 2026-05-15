import { useLayoutEffect, useRef, useState } from "react";

const MIN_TOP = 96;
const MIN_BOTTOM = 64;

/**
 * Mide header y footer fijos para `padding-top` / `padding-bottom` del scroll en páginas legales públicas.
 */
export function useLegalPublicScrollPadding(measureKey: string | number | null | undefined) {
  const headerRef = useRef<HTMLElement | null>(null);
  const footerRef = useRef<HTMLElement | null>(null);
  const [padding, setPadding] = useState({ top: MIN_TOP, bottom: MIN_BOTTOM });

  useLayoutEffect(() => {
    const header = headerRef.current;
    const footer = footerRef.current;
    if (!header || !footer) return;

    const measure = () => {
      const top = Math.max(MIN_TOP, Math.ceil(header.getBoundingClientRect().height));
      const bottom = Math.max(MIN_BOTTOM, Math.ceil(footer.getBoundingClientRect().height));
      setPadding((prev) => (prev.top === top && prev.bottom === bottom ? prev : { top, bottom }));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(header);
    ro.observe(footer);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measureKey]);

  return { headerRef, footerRef, paddingTop: padding.top, paddingBottom: padding.bottom };
}

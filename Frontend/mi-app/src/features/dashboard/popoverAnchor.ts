import type { CSSProperties } from "react";

/** Posición fija bajo un trigger (borde derecho alineado con el del trigger), estilo menú GitHub. */
export type MenuPopoverAnchor = {
  top: number;
  right: number;
  minWidth: number;
};

export function measureMenuAnchor(el: HTMLElement | null, gap = 8): MenuPopoverAnchor | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    top: r.bottom + gap,
    right: window.innerWidth - r.right,
    minWidth: r.width,
  };
}

type ClampedPopoverOpts = {
  /** Ancho máximo del panel (px). */
  maxWidth?: number;
  margin?: number;
};

/**
 * Posiciona un `position: fixed` anclado a la derecha del trigger; si el panel quedaría
 * cortado por la izquierda del viewport, lo alinea a `margin` desde la izquierda.
 */
export function getClampedRightPopoverStyle(
  anchor: MenuPopoverAnchor,
  opts?: ClampedPopoverOpts,
): CSSProperties {
  const margin = opts?.margin ?? 8;
  const maxW = opts?.maxWidth ?? 480;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  const panelW = Math.min(maxW, vw - 2 * margin);
  const rightPx = anchor.right;
  const leftEdge = vw - rightPx - panelW;

  const maxHeight = `min(640px, calc(100vh - ${anchor.top}px - 12px))`;

  if (leftEdge < margin) {
    return {
      top: anchor.top,
      left: margin,
      right: "auto",
      width: panelW,
      maxHeight,
    };
  }

  return {
    top: anchor.top,
    right: Math.max(margin, rightPx),
    left: "auto",
    width: panelW,
    maxHeight,
  };
}

import type { CSSProperties } from "react";

export type PopoverPlacement = "below" | "above";

/** Posición fija respecto a un trigger (borde derecho alineado con el del trigger). */
export type MenuPopoverAnchor = {
  placement: PopoverPlacement;
  top?: number;
  bottom?: number;
  right: number;
  minWidth: number;
  /** Espacio disponible sobre el trigger (solo placement above). */
  maxHeightPx?: number;
};

export type MeasureMenuAnchorOpts = {
  gap?: number;
  placement?: PopoverPlacement;
};

export function measureMenuAnchor(
  el: HTMLElement | null,
  opts?: number | MeasureMenuAnchorOpts,
): MenuPopoverAnchor | null {
  if (!el) return null;
  const gap = typeof opts === "number" ? opts : (opts?.gap ?? 8);
  const placement = typeof opts === "number" ? "below" : (opts?.placement ?? "below");
  const r = el.getBoundingClientRect();
  const right = window.innerWidth - r.right;

  if (placement === "above") {
    return {
      placement: "above",
      bottom: window.innerHeight - r.top + gap,
      right,
      minWidth: r.width,
      maxHeightPx: Math.max(120, r.top - gap - 12),
    };
  }

  return {
    placement: "below",
    top: r.bottom + gap,
    right,
    minWidth: r.width,
  };
}

type ClampedPopoverOpts = {
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

  if (anchor.placement === "above") {
    const bottomPx = anchor.bottom ?? margin;
    const maxHeight =
      anchor.maxHeightPx != null
        ? `min(640px, ${anchor.maxHeightPx}px)`
        : `min(640px, calc(100vh - ${bottomPx}px - 12px))`;

    if (leftEdge < margin) {
      return {
        bottom: bottomPx,
        top: "auto",
        left: margin,
        right: "auto",
        width: panelW,
        maxHeight,
      };
    }

    return {
      bottom: bottomPx,
      top: "auto",
      right: Math.max(margin, rightPx),
      left: "auto",
      width: panelW,
      maxHeight,
    };
  }

  const topPx = anchor.top ?? margin;
  const maxHeight = `min(640px, calc(100vh - ${topPx}px - 12px))`;

  if (leftEdge < margin) {
    return {
      top: topPx,
      left: margin,
      right: "auto",
      width: panelW,
      maxHeight,
    };
  }

  return {
    top: topPx,
    right: Math.max(margin, rightPx),
    left: "auto",
    width: panelW,
    maxHeight,
  };
}

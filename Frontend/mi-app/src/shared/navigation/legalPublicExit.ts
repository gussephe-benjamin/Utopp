import type { NavigateFunction } from "react-router-dom";

/**
 * Vuelve atrás en el historial de la SPA si existe; si no, va al registro (enlace típico a /terms o /privacy).
 */
export function navigateBackFromLegalPublic(navigate: NavigateFunction, fallbackPath = "/register") {
  const idx = (window.history.state as { idx?: number } | null)?.idx;
  if (typeof idx === "number" && idx > 0) {
    navigate(-1);
    return;
  }
  if (idx === undefined && window.history.length > 1) {
    navigate(-1);
    return;
  }
  navigate(fallbackPath);
}

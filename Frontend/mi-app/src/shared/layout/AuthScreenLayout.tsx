import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { AUTH_BACKGROUND_IMAGE_URL } from "../constants/brand";
import { UtoppLogo } from "../brand/UtoppLogo";

// ─── Constantes visuales (mismo look que el diseño original) ─────────────
// El gradiente va *encima* de la foto en la pila de capas CSS (primera capa = más al frente).

// Gradiente alineado a la paleta del feed (azul → morado).
const AUTH_GRADIENT_OVERLAY =
  "linear-gradient(to bottom right, rgba(37,99,235,0.85), rgba(79,70,229,0.85), rgba(124,58,237,0.85))";

type AuthScreenLayoutProps = {
  children: ReactNode;
  /** Muestra el logo Utopp encima del contenido (login/register estándar). */
  showLogo?: boolean;
  /** Clases extra en el contenedor max-w-md (p. ej. animación de entrada). */
  contentClassName?: string;
  /**
   * URL absoluta de la imagen de fondo (campus, etc.).
   * Si no se pasa, se usa `AUTH_BACKGROUND_IMAGE_URL` desde `shared/constants/brand`.
   * Importante: no usar solo clases Tailwind `bg-[url(...)]` con URLs de JS — Vite no las resuelve y el fondo puede quedar en blanco.
   */
  backgroundImageUrl?: string;
};

/**
 * Shell visual compartido: gradiente + foto UTEC, orbes, líneas diagonales y contenedor centrado.
 * La imagen se precarga con `Image()`; hasta entonces se muestra el gradiente (nunca fondo “vacío”).
 */
export function AuthScreenLayout({
  children,
  showLogo = true,
  contentClassName = "",
  backgroundImageUrl,
}: AuthScreenLayoutProps) {
  const resolvedBgUrl = (backgroundImageUrl?.trim() || AUTH_BACKGROUND_IMAGE_URL).trim();
  const [bgImageReady, setBgImageReady] = useState(false);

  // ─── Precarga del fondo (reutilizable para cualquier URL) ────────────────
  useEffect(() => {
    if (!resolvedBgUrl) {
      setBgImageReady(true);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.decoding = "async";
    const finish = () => {
      if (!cancelled) setBgImageReady(true);
    };
    img.onload = finish;
    img.onerror = finish;
    img.src = resolvedBgUrl;
    return () => {
      cancelled = true;
    };
  }, [resolvedBgUrl]);

  // Capas: gradiente siempre; foto solo cuando ya cargó (evita parpadeo y mantiene suavidad).
  const safeUrl = resolvedBgUrl.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const shellStyle: CSSProperties = {
    backgroundImage:
      bgImageReady && resolvedBgUrl
        ? `${AUTH_GRADIENT_OVERLAY}, url("${safeUrl}")`
        : AUTH_GRADIENT_OVERLAY,
    backgroundSize: bgImageReady && resolvedBgUrl ? "cover, cover" : "cover",
    backgroundPosition: bgImageReady && resolvedBgUrl ? "center, center" : "center",
    backgroundRepeat: "no-repeat",
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={shellStyle}
    >
      {/* ─── Capa decorativa (orbes + líneas; misma jerarquía que antes) ─── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-400/10 rounded-full blur-2xl" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-10 w-40 h-0.5 bg-white rotate-45" />
          <div className="absolute top-32 right-20 w-32 h-0.5 bg-white rotate-45" />
          <div className="absolute bottom-40 left-10 w-48 h-0.5 bg-white rotate-45" />
        </div>
      </div>

      {/* ─── Contenido (logo + formulario / children) ─────────────────────── */}
      <div className={`w-full max-w-md relative z-10 ${contentClassName}`.trim()}>
        {showLogo ? <UtoppLogo /> : null}
        {children}
      </div>
    </div>
  );
}

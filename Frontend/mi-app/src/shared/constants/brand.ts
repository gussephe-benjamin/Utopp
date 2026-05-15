// ─── Branding Utopp (URLs, gradiente oficial, overlay auth) ───────────────
// El fondo auth se aplica vía `style` en `AuthScreenLayout`, no con clases Tailwind + URL dinámica.

/** Paradas del gradiente oficial (logo, wordmark, avatares marca, CTAs primarios). */
export const UTOPP_BRAND = {
  blue: "#2563EB",
  violet: "#9333EA",
  fuchsia: "#C026D3",
} as const;

/**
 * Capa sobre la foto del campus: tonos índigo/violeta (como antes), sin dominar el azul puro;
 * combina con el logo (azul → violeta → fucsia) y deja resaltar el morado.
 */
export const AUTH_SCREEN_OVERLAY_GRADIENT =
  "linear-gradient(to bottom right, rgba(255, 255, 255, 0.66), rgba(116, 113, 113, 0.61), rgba(48, 46, 46, 0.68))";

/** Logo oficial Utopp (CDN del repo). Centralizado para login/register y branding. */
export const UTOPP_LOGO_SRC =
  "https://raw.githubusercontent.com/gussephe-benjamin/Utopp/refs/heads/main/Frontend/mi-app/public/tempo-image-20251218T034846856Z.png";

/** Imagen de fondo del campus UTEC en pantallas auth (default de `AuthScreenLayout`). */
export const AUTH_BACKGROUND_IMAGE_URL =
  "https://posgrado.utec.edu.pe/sites/default/files/2023-08/Campus-utec---nuestro-enfoque---web.jpg";

/**
 * Clases Tailwind literales (JIT): gradiente marca en diagonal (squircle U, avatares fallback).
 */
export const TW_UTOPP_GRADIENT_BR = "bg-gradient-to-br from-[#2563EB] via-[#9333EA] to-[#C026D3]";

/** Gradiente horizontal (botones pill, barra crear). */
export const TW_UTOPP_GRADIENT_R = "bg-gradient-to-r from-[#2563EB] via-[#9333EA] to-[#C026D3]";

/** Wordmark / texto con el mismo gradiente. */
export const TW_UTOPP_GRADIENT_TEXT =
  "bg-gradient-to-r from-[#2563EB] via-[#9333EA] to-[#C026D3] bg-clip-text text-transparent";

/** Anillo activo en avatar (ruta perfil). */
export const TW_UTOPP_RING_PROFILE = "ring-2 ring-[#C026D3] ring-offset-2";

/** Hover en enlaces primarios (sustituye #7C3AED). */
export const TW_UTOPP_LINK_HOVER = "hover:text-[#C026D3]";

// ─── Auth (formularios): títulos, enlaces legales, pie ─────────────────────

/** Título principal (Crear cuenta, ¡Hola!, etc.). */
export const TW_AUTH_HEADING = "text-[#9333EA]";

/** Enlaces a términos / privacidad. */
export const TW_AUTH_LEGAL_LINK =
  "font-semibold text-[#9333EA] underline underline-offset-2 hover:text-[#C026D3]";

/** “Inicia sesión” / “Regístrate” bajo el formulario. */
export const TW_AUTH_FOOTER_LINK =
  "text-[#9333EA] font-semibold hover:text-[#C026D3] hover:underline transition-all";

/** Acento de checkbox en auth (`text-*` + focus ring). */
export const TW_AUTH_CHECKBOX = "text-[#9333EA] focus:ring-[#9333EA]/40";

/** Borde y anillo de focus en inputs email/contraseña (auth). */
export const TW_AUTH_INPUT_FOCUS = "focus:border-[#9333EA] focus:ring-[#C026D3]/20";

/** `rootMargin` del sentinela en /terms y /privacy (píxeles positivos abajo ≈ varios párrafos antes del final). */
export const LEGAL_PUBLIC_SENTINEL_ROOT_MARGIN = "0px 0px 280px 0px";

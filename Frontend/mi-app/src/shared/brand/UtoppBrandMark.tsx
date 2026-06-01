import type { MouseEvent } from "react";
import { cn } from "../../lib/utils";
import { AppLink } from "../navigation/AppLink";
import { TW_UTOPP_GRADIENT_TEXT, UTOPP_LOGO_SRC } from "../constants/brand";

type UtoppBrandMarkProps = {
  /** `header`: barra superior (logo + wordmark). `auth`: solo logo, más grande, centrado. */
  variant?: "header" | "auth";
  className?: string;
  /** Ruta interna; habilita clic central y «Abrir en nueva pestaña». */
  to?: string;
  /** Clic izquierdo adicional (p. ej. recarga en la misma ruta). */
  onClick?: (event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
  "aria-label"?: string;
};

/**
 * Marca Utopp: logo 2D en barra; en header incluye wordmark «Utopp».
 */
export function UtoppBrandMark({
  variant = "header",
  className,
  to,
  onClick,
  "aria-label": ariaLabel = "Utopp",
}: UtoppBrandMarkProps) {
  const isAuth = variant === "auth";

  const markBox = (
    <img
      src={UTOPP_LOGO_SRC}
      alt=""
      aria-hidden
      className={cn(
        "shrink-0 object-contain",
        isAuth ? "h-[4.25rem] w-[4.25rem]" : "h-9 w-9",
      )}
    />
  );

  const wordmark = !isAuth ? (
    <span className={cn("font-bold tracking-tight text-lg", TW_UTOPP_GRADIENT_TEXT)}>Utopp</span>
  ) : null;

  const innerClass = cn(
    "flex shrink-0 rounded-xl transition-colors",
    isAuth ? "mx-auto mb-8 justify-center items-center" : "items-center gap-2 py-1 pr-2 pl-1",
    onClick && !isAuth && "hover:bg-gray-50/80",
    onClick && isAuth && "hover:opacity-90 active:scale-[0.99]",
    className,
  );

  const content = (
    <>
      {markBox}
      {wordmark}
    </>
  );

  if (to) {
    return (
      <AppLink to={to} onClick={onClick} className={innerClass} aria-label={ariaLabel}>
        {content}
      </AppLink>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={innerClass} aria-label={ariaLabel}>
        {content}
      </button>
    );
  }

  return (
    <div className={innerClass} role="img" aria-label={ariaLabel}>
      {content}
    </div>
  );
}

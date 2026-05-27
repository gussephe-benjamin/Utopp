import { cn } from "../../lib/utils";
import { TW_UTOPP_GRADIENT_BR, TW_UTOPP_GRADIENT_TEXT } from "../constants/brand";

type UtoppBrandMarkProps = {
  /** `header`: barra superior (U + wordmark). `auth`: solo logo U, más grande, centrado. */
  variant?: "header" | "auth";
  /** Solo icono U (p. ej. barra inferior del feed en móvil). */
  iconOnly?: boolean;
  className?: string;
  /** Si se define, la marca es un botón (p. ej. recarga o navegación). */
  onClick?: () => void;
  "aria-label"?: string;
};

/**
 * Marca Utopp: cuadrado con “U” en gradiente; en barra incluye wordmark “utopp”.
 */
export function UtoppBrandMark({
  variant = "header",
  iconOnly = false,
  className,
  onClick,
  "aria-label": ariaLabel = "Utopp",
}: UtoppBrandMarkProps) {
  const isAuth = variant === "auth";
  const showWordmark = !isAuth && !iconOnly;

  const markBox = (
    <div
      className={cn(
        "flex items-center justify-center text-white font-bold leading-none shrink-0",
        isAuth
          ? cn(
              "relative w-[4.25rem] h-[4.25rem] text-3xl rounded-2xl overflow-hidden shadow-[0_6px_28px_rgba(15,23,42,0.45),inset_0_1px_0_rgba(255,255,255,0.22)]",
              TW_UTOPP_GRADIENT_BR,
            )
          : cn("w-9 h-9 text-lg rounded-xl shadow-sm", TW_UTOPP_GRADIENT_BR),
      )}
    >
      U
    </div>
  );

  const wordmark = showWordmark ? (
    <span className={cn("font-bold tracking-tight text-lg", TW_UTOPP_GRADIENT_TEXT)}>utopp</span>
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

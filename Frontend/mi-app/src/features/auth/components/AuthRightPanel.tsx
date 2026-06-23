import type { ReactNode } from "react";
import type { AuthTransitionDirection } from "./AuthSplitLayout";

type AuthRightPanelProps = {
  children: ReactNode;
  direction?: AuthTransitionDirection;
};

/**
 * Contenedor del contenido de auth (login/register).
 * En móvil es una superficie plana (la card blanca ya la aporta el layout);
 * en tablet/laptop es una glass card centrada con ancho acotado.
 */
export function AuthRightPanel({ children, direction = "from-right" }: AuthRightPanelProps) {
  const animationClass =
    direction === "from-left" ? "auth-panel-enter-from-login" : "auth-panel-enter";

  return (
    <div className={`w-full max-w-[30rem] auth-fade-in ${animationClass}`}>
      {children}
    </div>
  );
}

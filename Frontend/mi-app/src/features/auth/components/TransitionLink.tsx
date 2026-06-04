import { startTransition, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { AuthTransitionDirection } from "./AuthSplitLayout";

type TransitionLinkProps = {
  to: string;
  children: ReactNode;
  className?: string;
};

/**
 * Enlace de navegación entre /login y /register con dirección de animación explícita.
 */
export function TransitionLink({ to, children, className }: TransitionLinkProps) {
  const navigate = useNavigate();

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
      return;
    }
    event.preventDefault();

    const authDirection: AuthTransitionDirection =
      to === "/register" ? "from-right" : "from-left";

    startTransition(() => {
      navigate(to, { state: { authDirection } });
    });
  };

  return (
    <a href={to} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}

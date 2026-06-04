import { Outlet, useLocation } from "react-router-dom";
import { AuthSplitLayout } from "./AuthSplitLayout";
import { AuthRightPanel } from "./AuthRightPanel";
import type { AuthTransitionDirection } from "./AuthSplitLayout";

type AuthLocationState = {
  authDirection?: AuthTransitionDirection;
  registeredEmail?: string;
};

function resolveDirection(
  pathname: string,
  state: AuthLocationState | null,
): AuthTransitionDirection {
  if (state?.authDirection) return state.authDirection;
  return pathname === "/login" ? "from-left" : "from-right";
}

/**
 * Layout compartido para /login y /register.
 * Mantiene el panel izquierdo montado entre rutas; solo el panel derecho anima al cambiar.
 */
export function AuthRouteLayout() {
  const location = useLocation();
  const state = location.state as AuthLocationState | null;
  const direction = resolveDirection(location.pathname, state);

  return (
    <AuthSplitLayout>
      <AuthRightPanel key={location.pathname} direction={direction}>
        <Outlet />
      </AuthRightPanel>
    </AuthSplitLayout>
  );
}

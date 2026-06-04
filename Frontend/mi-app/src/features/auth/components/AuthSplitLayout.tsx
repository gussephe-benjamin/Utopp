import type { ReactNode } from "react";
import { AuthLeftPanel } from "./AuthLeftPanel";

export type AuthTransitionDirection = "from-right" | "from-left";

type AuthSplitLayoutProps = {
  children: ReactNode;
};

/**
 * Shell de las pantallas de autenticación.
 * - Móvil: cabecera de marca + card blanca que se solapa (rounded-t-3xl).
 * - Tablet (md–xl): split 45/55 con panel de valor a la izquierda.
 * - Laptop (xl+): split 50/50.
 *
 * El panel izquierdo permanece estático entre rutas; solo el derecho anima
 * (la dirección se controla en `AuthRightPanel`).
 */
export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] md:h-screen md:flex-row md:overflow-hidden">
      {/* Cabecera compacta (solo móvil) */}
      <AuthLeftPanel compact />

      {/* Panel izquierdo (tablet/laptop) — estático, no anima */}
      <div className="relative hidden md:block md:h-screen md:w-5/12 xl:w-1/2">
        <AuthLeftPanel />
      </div>

      {/* Panel derecho (auth) */}
      <div className="relative z-10 -mt-4 flex flex-1 items-start justify-center rounded-t-3xl bg-white px-6 pt-8 pb-12 md:mt-0 md:w-7/12 md:items-center md:rounded-none md:bg-[#F8FAFC] md:px-8 md:py-8 xl:w-1/2 xl:px-10">
        {children}
      </div>
    </div>
  );
}

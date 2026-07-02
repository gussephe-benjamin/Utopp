import type { RefObject } from "react";
import { ListFilter, Plus, Shield, Ticket } from "lucide-react";
import { UtoppBrandMark } from "../../../shared/brand/UtoppBrandMark";
import { AppLink } from "../../../shared/navigation/AppLink";
import { EventSearchBar } from "../../feed/components/EventSearchBar";
import {
  TW_UTOPP_GRADIENT_BR,
  TW_UTOPP_GRADIENT_R,
} from "../../../shared/constants/brand";
import { ProfileAvatar } from "../../profile/components/ProfileAvatar";

// ─── Barra superior (dashboard): marca, crear, filtros (feed), avatar ───────

type AppTopBarProps = {
  /** Si la ruta activa es el feed (inicio): clic en marca recarga la página. */
  isFeedActive?: boolean;
  /** Abrir filtros del feed (solo en ruta inicio); si no se pasa, no se muestra el botón. */
  onOpenFeedFilters?: () => void;
  /** Resalta el botón de filtros cuando hay filtros por categoría activos. */
  feedCategoryFiltersActive?: boolean;
  /** Abrir wizard de publicación */
  onOpenCreate: () => void;
  canCreate: boolean;
  /** URL foto perfil (API o localStorage); si no hay, se muestra inicial */
  avatarUrl: string | null;
  userId?: number | null;
  displayName: string;
  /** Resalta avatar cuando la ruta es perfil */
  isProfileRoute: boolean;
  /** Enlace al panel de administración (admin/root). */
  canAccessAdmin?: boolean;
  /** Anclaje del popover de filtros del feed. */
  feedFiltersTriggerRef?: RefObject<HTMLButtonElement | null>;
  /** Muestra el acceso a Utopp Formulario (roles que pueden crear eventos). */
  canCreateEvent?: boolean;
  /** Abre Utopp Formulario en una pestaña nueva con SSO. */
  onOpenUtoppFormulario?: () => void;
};

export function AppTopBar({
  isFeedActive = false,
  onOpenFeedFilters,
  feedCategoryFiltersActive = false,
  onOpenCreate,
  canCreate,
  avatarUrl,
  userId,
  displayName,
  isProfileRoute,
  canAccessAdmin = false,
  feedFiltersTriggerRef,
  canCreateEvent = false,
  onOpenUtoppFormulario,
}: AppTopBarProps) {
  return (
    <header className="hidden md:block fixed top-0 left-0 right-0 z-50 h-14 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-[0_1px_12px_rgba(0,0,0,0.06)]">
      <div className="h-full max-w-[1320px] mx-auto px-3 sm:px-4 flex items-center justify-between gap-3">
        <UtoppBrandMark
          variant="header"
          to="/app/inicio"
          onClick={(event) => {
            if (isFeedActive) {
              event.preventDefault()
              window.location.assign(`${window.location.origin}/app/inicio`)
            }
          }}
          aria-label="Ir a inicio y recargar"
        />

        {isFeedActive && (
          <div className="hidden md:flex min-w-0 flex-1 justify-center px-2 lg:px-6">
            <EventSearchBar compact className="w-full max-w-[420px]" />
          </div>
        )}

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {canCreate && (
            <button
              type="button"
              onClick={onOpenCreate}
              title="Crear oportunidad"
              className={`w-10 h-10 p-0 rounded-full sm:w-auto sm:h-auto sm:px-5 sm:py-2 flex items-center justify-center gap-1.5 sm:gap-2 ${TW_UTOPP_GRADIENT_R} text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md hover:brightness-[1.03] active:scale-[0.98] transition-all whitespace-nowrap`}
            >
              <Plus className="w-4 h-4 shrink-0 stroke-[3]" stroke="currentColor" aria-hidden />
              <span className="hidden sm:inline">Crear oportunidad</span>
            </button>
          )}

          {canCreateEvent && onOpenUtoppFormulario && (
            <button
              type="button"
              onClick={onOpenUtoppFormulario}
              title="Crear evento con boletos en Utopp Formulario"
              className="w-10 h-10 p-0 rounded-full sm:w-auto sm:h-auto sm:px-4 sm:py-2 flex items-center justify-center gap-1.5 sm:gap-2 text-gray-700 bg-gray-50 border border-gray-200 text-xs sm:text-sm font-semibold hover:bg-gray-100 active:scale-[0.98] transition-all whitespace-nowrap"
            >
              <Ticket className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden />
              <span className="hidden sm:inline">Crear evento</span>
            </button>
          )}

          {onOpenFeedFilters && (
            <button
              ref={feedFiltersTriggerRef}
              type="button"
              onClick={onOpenFeedFilters}
              className={`relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full transition-colors ${
                feedCategoryFiltersActive
                  ? "shadow-md hover:brightness-[1.05]"
                  : "text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100"
              }`}
              aria-label="Filtros del feed"
              title="Filtros"
            >
              {feedCategoryFiltersActive ? (
                <>
                  <span
                    className={`pointer-events-none absolute inset-0 ${TW_UTOPP_GRADIENT_R}`}
                    aria-hidden
                  />
                  <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/25" aria-hidden />
                  <ListFilter className="relative z-10 w-5 h-5 text-white" strokeWidth={2} />
                </>
              ) : (
                <ListFilter className="w-5 h-5" strokeWidth={2} />
              )}
            </button>
          )}

          {canAccessAdmin && (
            <AppLink
              to="/app/admin"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-600 transition-colors hover:bg-gray-100"
              aria-label="Panel de administración"
              title="Panel de administración"
            >
              <Shield className="h-5 w-5" strokeWidth={2} />
            </AppLink>
          )}

          <AppLink
            to="/app/perfil"
            className={`rounded-full p-[2px] shrink-0 transition-shadow bg-gradient-to-br from-blue-600 to-fuchsia-500 shadow-sm ${
              isProfileRoute
                ? "ring-2 ring-violet-200"
                : "hover:brightness-110"
            }`}
            aria-label="Ir a mi perfil"
            title={displayName}
          >
            <div className="rounded-full border-2 border-white bg-white p-0.5">
              <ProfileAvatar
                name={displayName}
                userId={userId}
                imageUrl={avatarUrl}
                size="sm"
                fallbackClassName={TW_UTOPP_GRADIENT_BR}
                imageClassName="border-0"
              />
            </div>
          </AppLink>
        </div>
      </div>
    </header>
  );
}

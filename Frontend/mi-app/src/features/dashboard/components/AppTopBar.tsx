import type { RefObject } from "react";
import { ListFilter, Plus } from "lucide-react";
import { UtoppBrandMark } from "../../../shared/brand/UtoppBrandMark";
import { AppLink } from "../../../shared/navigation/AppLink";
import {
  TW_UTOPP_GRADIENT_R,
} from "../../../shared/constants/brand";

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
  /** Primera letra del nombre (fallback avatar) */
  avatarInitial: string;
  displayName: string;
  /** Resalta avatar cuando la ruta es perfil */
  isProfileRoute: boolean;
  /** Anclaje del avatar de perfil (popover estilo GitHub). */
  accountMenuTriggerRef?: RefObject<HTMLAnchorElement | null>;
  /** Anclaje del popover de filtros del feed. */
  feedFiltersTriggerRef?: RefObject<HTMLButtonElement | null>;
};

export function AppTopBar({
  isFeedActive = false,
  onOpenFeedFilters,
  feedCategoryFiltersActive = false,
  onOpenCreate,
  canCreate,
  avatarUrl,
  avatarInitial,
  displayName,
  isProfileRoute,
  accountMenuTriggerRef,
  feedFiltersTriggerRef,
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

          <AppLink
            ref={accountMenuTriggerRef}
            to="/app/perfil"
            className={`rounded-full p-[2px] shrink-0 transition-shadow bg-gradient-to-br from-blue-600 to-fuchsia-500 shadow-sm ${
              isProfileRoute
                ? "ring-2 ring-violet-200"
                : "hover:brightness-110"
            }`}
            aria-label="Ir a mi perfil"
            title={displayName}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-9 h-9 rounded-full object-cover border-2 border-white bg-white"
              />
            ) : (
              <div className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center bg-violet-100 text-violet-700 font-bold text-sm">
                {avatarInitial}
              </div>
            )}
          </AppLink>
        </div>
      </div>
    </header>
  );
}

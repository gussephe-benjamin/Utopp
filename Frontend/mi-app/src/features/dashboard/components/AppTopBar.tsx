import type { RefObject } from "react";
import { ListFilter, Plus } from "lucide-react";
import { UtoppBrandMark } from "../../../shared/brand/UtoppBrandMark";
import {
  TW_UTOPP_GRADIENT_BR,
  TW_UTOPP_GRADIENT_R,
  TW_UTOPP_RING_PROFILE,
} from "../../../shared/constants/brand";

// ─── Barra superior (dashboard): marca, crear, filtros (feed), avatar ───────

type AppTopBarProps = {
  /** Recarga completa al pulsar la marca (p. ej. ir a inicio). */
  onBrandClick: () => void;
  /** Abrir panel de cuenta (desde avatar). */
  onOpenAccountMenu: () => void;
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
  /** Anclaje del menú cuenta (popover estilo GitHub). */
  accountMenuTriggerRef?: RefObject<HTMLButtonElement | null>;
  /** Anclaje del popover de filtros del feed. */
  feedFiltersTriggerRef?: RefObject<HTMLButtonElement | null>;
  /** En feed/perfil móvil la barra superior se oculta (se usa barra inferior). */
  hideOnMobileBottomNav?: boolean;
};

export function AppTopBar({
  onBrandClick,
  onOpenAccountMenu,
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
  hideOnMobileBottomNav = false,
}: AppTopBarProps) {
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-14 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-[0_1px_12px_rgba(0,0,0,0.06)] ${
        hideOnMobileBottomNav ? "hidden sm:block" : ""
      }`}
    >
      <div className="h-full max-w-6xl mx-auto px-3 sm:px-4 flex items-center justify-between gap-3">
        <UtoppBrandMark
          variant="header"
          onClick={onBrandClick}
          aria-label="Ir a inicio y recargar"
        />

        <div className="flex-1 min-w-[1rem] hidden sm:block" aria-hidden />

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {canCreate && (
            <button
              type="button"
              onClick={onOpenCreate}
              title="Crear oportunidad"
              className={`w-10 h-10 p-0 rounded-full sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 flex items-center justify-center gap-1.5 sm:gap-2 ${TW_UTOPP_GRADIENT_R} text-white text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg hover:brightness-[1.03] active:scale-[0.98] transition-all whitespace-nowrap`}
            >
              <Plus className="w-4 h-4 shrink-0 stroke-[2.5]" stroke="currentColor" aria-hidden />
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

          <button
            ref={accountMenuTriggerRef}
            type="button"
            onClick={onOpenAccountMenu}
            className={`rounded-full p-0.5 shrink-0 transition-shadow ${
              isProfileRoute
                ? TW_UTOPP_RING_PROFILE
                : "ring-0 hover:ring-2 hover:ring-fuchsia-200/60 ring-offset-2"
            }`}
            aria-label="Menú de cuenta"
            title={displayName}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-9 h-9 rounded-full object-cover bg-gray-100"
              />
            ) : (
              <div className={`w-9 h-9 rounded-full ${TW_UTOPP_GRADIENT_BR} flex items-center justify-center text-white text-sm font-bold`}>
                {avatarInitial}
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

import type { RefObject } from "react";
import { ListFilter, Plus, Search, Bell } from "lucide-react";
import { UtoppBrandMark } from "../../../shared/brand/UtoppBrandMark";
import {
  TW_UTOPP_GRADIENT_R,
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

        {/* Barra de Búsqueda (Centro) */}
        <div className="flex-1 max-w-[600px] hidden md:flex items-center px-4">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar oportunidades, organizaciones, eventos..."
              className="block w-full pl-10 pr-4 py-2.5 border border-gray-100 rounded-full leading-5 bg-gray-50/80 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-300 text-sm transition-colors"
            />
          </div>
        </div>

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

          {/* Campana de Notificaciones [Data Sintética] */}
          <button
            type="button"
            className="relative flex items-center justify-center w-10 h-10 bg-violet-50 text-violet-600 hover:bg-violet-100 rounded-full transition-colors shrink-0"
            aria-label="Notificaciones"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-fuchsia-500 text-[8px] font-bold text-white ring-2 ring-white">3</span>
          </button>

          <button
            ref={accountMenuTriggerRef}
            type="button"
            onClick={onOpenAccountMenu}
            className={`rounded-full p-[2px] shrink-0 transition-shadow bg-gradient-to-br from-blue-600 to-fuchsia-500 shadow-sm ${
              isProfileRoute
                ? "ring-2 ring-violet-200"
                : "hover:brightness-110"
            }`}
            aria-label="Menú de cuenta"
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
          </button>
        </div>
      </div>
    </header>
  );
}

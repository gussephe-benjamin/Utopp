import { MoreHorizontal, Plus } from 'lucide-react'

// ─── Barra superior (dashboard): marca, crear, cuenta, avatar ───────────────
// Referencia de producto: pill "Crear oportunidad", campana, foto de perfil.
// Sin buscador hasta que exista el endpoint.

type AppTopBarProps = {
  /** Ir a inicio / feed */
  onNavigateHome: () => void
  /** Ir a mi perfil */
  onNavigateProfile: () => void
  /** Abrir wizard de publicación */
  onOpenCreate: () => void
  /** Abrir panel cuenta (antes “Más”: cerrar sesión, etc.) */
  onOpenAccountMenu: () => void
  canCreate: boolean
  /** URL foto perfil (API o localStorage); si no hay, se muestra inicial */
  avatarUrl: string | null
  /** Primera letra del nombre (fallback avatar) */
  avatarInitial: string
  displayName: string
  /** Resalta avatar cuando la ruta es perfil */
  isProfileRoute: boolean
}

export function AppTopBar({
  onNavigateHome,
  onNavigateProfile,
  onOpenCreate,
  onOpenAccountMenu,
  canCreate,
  avatarUrl,
  avatarInitial,
  displayName,
  isProfileRoute,
}: AppTopBarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-[0_1px_12px_rgba(0,0,0,0.06)]">
      <div className="h-full max-w-6xl mx-auto px-3 sm:px-4 flex items-center justify-between gap-3">
        {/* ─── Marca: logo + wordmark ─────────────────────────────────────── */}
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex items-center gap-2 shrink-0 rounded-xl py-1 pr-2 pl-1 hover:bg-gray-50/80 transition-colors"
          aria-label="Ir a inicio"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center shadow-sm text-white font-bold text-lg leading-none">
            U
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] bg-clip-text text-transparent tracking-tight">
            utopp
          </span>
        </button>

        {/* ─── Espacio reservado (futuro buscador) ─────────────────────────── */}
        <div className="flex-1 min-w-[1rem] hidden sm:block" aria-hidden />

        {/* ─── Acciones derecha ───────────────────────────────────────────── */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {canCreate && (
            <button
              type="button"
              onClick={onOpenCreate}
              title="Crear oportunidad"
              className="w-10 h-10 p-0 rounded-full sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 flex items-center justify-center gap-1.5 sm:gap-2 bg-gradient-to-r from-blue-600 to-[#7C3AED] text-white text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg hover:brightness-[1.03] active:scale-[0.98] transition-all whitespace-nowrap"
            >
              <Plus className="w-4 h-4 shrink-0 stroke-[2.5]" stroke="currentColor" aria-hidden />
              <span className="hidden sm:inline">Crear oportunidad</span>
            </button>
          )}

          {/* ─── Opciones: abre el sheet de cuenta (logout, etc.) ───────────── */}
          <button
            type="button"
            onClick={onOpenAccountMenu}
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
            aria-label="Opciones"
            title="Opciones"
          >
            <MoreHorizontal className="w-5 h-5" strokeWidth={2} />
          </button>

          <button
            type="button"
            onClick={onNavigateProfile}
            className={`rounded-full p-0.5 shrink-0 transition-shadow ${
              isProfileRoute ? 'ring-2 ring-[#7C3AED] ring-offset-2' : 'ring-0 hover:ring-2 hover:ring-purple-200 ring-offset-2'
            }`}
            aria-label="Mi perfil"
            title={displayName}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-9 h-9 rounded-full object-cover bg-gray-100"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center text-white text-sm font-bold">
                {avatarInitial}
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}

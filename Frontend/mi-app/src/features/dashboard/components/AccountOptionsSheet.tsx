import { X, Settings, LogOut, ChevronRight } from 'lucide-react'
import type { MenuPopoverAnchor } from '../popoverAnchor'
import { TW_UTOPP_GRADIENT_BR } from '../../../shared/constants/brand'

type AccountOptionsSheetProps = {
  displayName: string
  userEmail: string | null
  avatarUrl: string | null
  initial: string
  anchor: MenuPopoverAnchor
  onClose: () => void
  onNavigateProfile: () => void
  /** Cierra sesión sin paso de confirmación. */
  onLogout: () => void
}

export function AccountOptionsSheet({
  displayName,
  userEmail,
  avatarUrl,
  initial,
  anchor,
  onClose,
  onNavigateProfile,
  onLogout,
}: AccountOptionsSheetProps) {
  const isAbove = anchor.placement === 'above'
  const panelStyle = isAbove
    ? ({
        bottom: anchor.bottom,
        top: 'auto' as const,
        right: anchor.right,
        minWidth: Math.max(anchor.minWidth, 288),
        maxHeight:
          anchor.maxHeightPx != null
            ? `min(640px, ${anchor.maxHeightPx}px)`
            : `min(640px, calc(100vh - ${anchor.bottom ?? 0}px - 12px))`,
      } as const)
    : ({
        top: anchor.top,
        right: anchor.right,
        minWidth: Math.max(anchor.minWidth, 288),
      } as const)

  const menuRow =
    'w-full flex items-center gap-2.5 rounded-md pl-2.5 pr-2 py-1.5 text-left text-sm text-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C026D3]/25 hover:bg-fuchsia-50 hover:text-[#9333EA]'

  const handleSalir = () => {
    onClose()
    onLogout()
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[69] bg-black/10"
        onClick={() => { onClose() }}
        aria-hidden
      />
      <div
        className={`fixed z-[70] w-max max-w-[min(26rem,calc(100vw-1rem))] rounded-xl border border-gray-200/90 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] animate-in fade-in zoom-in-95 duration-150 overflow-hidden ${
          isAbove ? 'slide-in-from-bottom-1' : 'slide-in-from-top-1'
        }`}
        style={panelStyle}
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative flex flex-col items-stretch text-left">
          <button
            type="button"
            onClick={() => { onClose() }}
            className="absolute top-2 right-2 z-10 w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Bloque identidad (sin borde propio; como cabecera del menú) */}
          <button
            type="button"
            onClick={() => { onNavigateProfile(); onClose() }}
            aria-label={`Ir al perfil de ${displayName}`}
            className="w-full text-left pl-2.5 pr-10 pt-2.5 pb-2 hover:bg-gray-50/80 transition-colors rounded-t-xl border-b border-gray-100"
          >
            <div className="flex items-center justify-start gap-2.5 min-w-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" aria-hidden />
              ) : (
                <div className={`w-8 h-8 rounded-lg ${TW_UTOPP_GRADIENT_BR} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                  {initial}
                </div>
              )}
              <div className="min-w-0 flex-1 py-0.5">
                <p className="font-semibold text-gray-900 text-[13px] leading-tight truncate">{displayName}</p>
                {userEmail && <p className="text-[11px] text-gray-500 mt-0.5 truncate">{userEmail}</p>}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" aria-hidden />
            </div>
          </button>

          <div className="pl-2.5 pr-2 py-1">
            <button
              type="button"
              title="Próximamente"
              aria-label="Configuración, próximamente disponible"
              className={`${menuRow} opacity-50 cursor-not-allowed hover:bg-transparent hover:text-gray-800`}
              disabled
            >
              <Settings className="w-4 h-4 text-gray-500 shrink-0" />
              <span className="truncate">Configuración</span>
            </button>
          </div>

          <div className="h-px bg-gray-100 ml-2.5 mr-2" aria-hidden />

          <div className="pl-2.5 pr-2 py-1 pb-1.5">
            <button
              type="button"
              onClick={handleSalir}
              className={`${menuRow} group text-gray-800`}
            >
              <LogOut className="w-4 h-4 shrink-0 text-gray-500 group-hover:text-[#C026D3]" />
              <span className="font-medium truncate">Salir de la plataforma</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

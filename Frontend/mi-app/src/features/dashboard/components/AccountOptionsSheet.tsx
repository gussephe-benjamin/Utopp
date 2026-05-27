import { X, Settings, LogOut, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
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
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const panelStyle = isMobile
    ? undefined
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
        className="fixed inset-0 z-[69] bg-black/20 backdrop-blur-sm"
        onClick={() => { onClose() }}
        aria-hidden
      />
      <div
        className={`fixed z-[70] rounded-xl border border-gray-200/90 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] animate-in fade-in zoom-in-95 slide-in-from-top-1 duration-150 overflow-hidden ${
          isMobile
            ? "left-1/2 top-1/2 w-[min(24rem,calc(100vw-1.25rem))] -translate-x-1/2 -translate-y-1/2"
            : "w-max max-w-[min(26rem,calc(100vw-1rem))]"
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

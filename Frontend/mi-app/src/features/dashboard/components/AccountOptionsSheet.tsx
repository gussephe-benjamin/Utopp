import { X, User, Settings, LogOut } from 'lucide-react'

type AccountOptionsSheetProps = {
  displayName: string
  userEmail: string | null
  avatarUrl: string | null
  initial: string
  confirmLogout: boolean
  onClose: () => void
  onNavigateProfile: () => void
  onRequestLogout: () => void
  onCancelLogout: () => void
  onLogout: () => void
}

export function AccountOptionsSheet({
  displayName,
  userEmail,
  avatarUrl,
  initial,
  confirmLogout,
  onClose,
  onNavigateProfile,
  onRequestLogout,
  onCancelLogout,
  onLogout,
}: AccountOptionsSheetProps) {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-end justify-center"
      onClick={() => { onClose(); onCancelLogout() }}
      role="presentation"
    >
      <div
        className="bg-white w-full max-w-md rounded-t-3xl shadow-2xl p-6 pb-10 animate-in slide-in-from-bottom-4 duration-300"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-5" />

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-12 h-12 rounded-xl object-cover shadow" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center text-white text-lg font-bold shadow">
                {initial}
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900 leading-tight">{displayName}</p>
              {userEmail && <p className="text-xs text-gray-400 mt-0.5">{userEmail}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={() => { onClose(); onCancelLogout() }}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 mb-4">
          <button
            type="button"
            onClick={() => { onNavigateProfile(); onClose() }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <User className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Mi perfil</p>
              <p className="text-xs text-gray-400">Ver y editar tu perfil</p>
            </div>
          </button>

          <button
            type="button"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left opacity-50 cursor-not-allowed"
            disabled
          >
            <div className="w-9 h-9 rounded-xl bg-gray-200 flex items-center justify-center">
              <Settings className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Configuración</p>
              <p className="text-xs text-gray-400">Próximamente</p>
            </div>
          </button>
        </div>

        <div className="border-t border-gray-100 pt-4">
          {!confirmLogout ? (
            <button
              type="button"
              onClick={onRequestLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-200 text-red-600 font-medium hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          ) : (
            <div className="bg-red-50 rounded-xl p-4 space-y-3 border border-red-200">
              <p className="text-sm text-red-700 text-center font-medium">¿Seguro que deseas cerrar sesión?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onCancelLogout}
                  className="flex-1 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  Salir
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Home, User, X, MoreVertical, LogOut, Settings } from 'lucide-react'
import PublicationWizard from '../components/PublicationWizard'
import { useAuth } from '../auth/useAuth'
import { getMyProfile } from '../api/users.api'
import Feed from '../pages/Feed'
import Profile from '../pages/Profile'

/**
 * Layout principal de la app tras el login.
 * Contiene la navegación inferior y el wizard de creación de posts.
 */
export default function DashboardLayout() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { logout } = useAuth()

  const [showWizard, setShowWizard]           = useState(false)
  const [showOptionsModal, setShowOptionsModal] = useState(false)
  const [confirmLogout, setConfirmLogout]     = useState(false)

  // Datos básicos del usuario para mostrar en el panel de opciones
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [userName, setUserName]   = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    getMyProfile()
      .then(d => {
        setCurrentUserId(d.id)
        setUserName(d.full_name ?? null)
        setUserEmail(d.email ?? null)
        const saved = localStorage.getItem(`avatar_${d.id}`)
        setAvatarUrl(saved || null)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!currentUserId) return
    const avatarKey = `avatar_${currentUserId}`

    const syncFromStorage = () => {
      const saved = localStorage.getItem(avatarKey)
      setAvatarUrl(saved || null)
    }

    const onAvatarUpdated = (evt: Event) => {
      const detail = (evt as CustomEvent<{ userId?: number; avatarUrl?: string } | undefined>).detail
      if (!detail || detail.userId !== currentUserId) return
      setAvatarUrl(detail.avatarUrl ?? null)
    }

    const onStorage = (evt: StorageEvent) => {
      if (evt.key === avatarKey) {
        setAvatarUrl(evt.newValue || null)
      }
    }

    window.addEventListener('avatarUpdated', onAvatarUpdated as EventListener)
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', syncFromStorage)

    return () => {
      window.removeEventListener('avatarUpdated', onAvatarUpdated as EventListener)
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', syncFromStorage)
    }
  }, [currentUserId])

  // Bloquea scroll del documento mientras haya un modal/sheet abierto
  useEffect(() => {
    if (!showWizard && !showOptionsModal) return

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    const prevOverflow = document.body.style.overflow
    const prevPaddingRight = document.body.style.paddingRight

    document.body.style.overflow = 'hidden'
    document.body.style.paddingRight = `${scrollbarWidth}px`

    return () => {
      document.body.style.overflow = prevOverflow
      document.body.style.paddingRight = prevPaddingRight
    }
  }, [showWizard, showOptionsModal])

  const isActive = (path: string) => location.pathname === path
  const isFeedActive    = location.pathname === '/app/inicio'
  const isProfileActive = location.pathname.startsWith('/app/perfil')
  const profileViewIdMatch = location.pathname.match(/^\/app\/perfil\/(\d+)$/)
  const profileViewId = profileViewIdMatch ? Number(profileViewIdMatch[1]) : undefined

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const displayName = userName || userEmail || 'Usuario'
  const initial     = displayName.charAt(0).toUpperCase()

  return (
    <div className={`min-h-screen flex flex-col ${showWizard || showOptionsModal ? 'overflow-hidden' : ''}`}>

      {/* Contenido dinámico — Feed y Perfil siempre montados en sus propios contenedores */}
      <main className="flex-1 relative overflow-hidden">
        {/* Feed — siempre montado, invisible cuando no está activo */}
        <div className={`absolute inset-0 overflow-y-auto pb-20 bg-gray-50${isFeedActive ? '' : ' invisible pointer-events-none'}`}>
          <Feed />
        </div>
        {/* Perfil — siempre montado, invisible cuando no está activo */}
        <div className={`absolute inset-0 overflow-y-auto pb-20 bg-gray-50${isProfileActive ? '' : ' invisible pointer-events-none'}`}>
          <Profile viewUserId={profileViewId} />
        </div>
        {/* Otras rutas (Horario, etc.) via Outlet */}
        {!isFeedActive && !isProfileActive && (
          <div className="absolute inset-0 overflow-y-auto pb-20 bg-gray-50">
            <Outlet />
          </div>
        )}
      </main>

      {/* ── Bottom Navigation ─────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-200 z-50 shadow-[0_-2px_16px_rgba(0,0,0,0.06)]">
        <div className="flex justify-around items-center py-2 max-w-sm mx-auto">
          {/* Logo */}
          <div className="flex items-center justify-center p-2">
            <img src="/utopp-logo.png" alt="Utopp" className="w-7 h-7 object-contain" />
          </div>

          {/* Inicio */}
          <button
            onClick={() => navigate("/app/inicio")}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
              isActive("/app/inicio") ? "text-[#4F46E5] bg-indigo-50" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Inicio</span>
          </button>

          {/* Botón central de creación */}
          <button
            onClick={() => setShowWizard(true)}
            className="relative group"
            title="Crear Publicación"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] rounded-full blur opacity-60 group-hover:opacity-90 transition duration-300" />
            <div className="relative bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] rounded-full p-3.5 shadow-lg transform transition-all duration-200 hover:scale-105">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
          </button>

          {/* Perfil */}
          <button
            onClick={() => navigate("/app/perfil")}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
              isActive("/app/perfil") ? "text-[#4F46E5] bg-indigo-50" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">Perfil</span>
          </button>

          {/* Más opciones */}
          <button
            onClick={() => setShowOptionsModal(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-gray-500 hover:text-gray-800 transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
            <span className="text-[10px] font-medium">Más</span>
          </button>
        </div>
      </nav>

      {/* Wizard de publicación */}
      <PublicationWizard isOpen={showWizard} onClose={() => setShowWizard(false)} />

      {/* ── Panel de opciones (bottom sheet) ─────────────── */}
      {showOptionsModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-end justify-center"
          onClick={() => { setShowOptionsModal(false); setConfirmLogout(false) }}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-3xl shadow-2xl p-6 pb-10 animate-in slide-in-from-bottom-4 duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-5" />

            {/* Header con info del usuario */}
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
                onClick={() => { setShowOptionsModal(false); setConfirmLogout(false) }}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Opciones del menú */}
            <div className="space-y-2 mb-4">
              <button
                onClick={() => { navigate("/app/perfil"); setShowOptionsModal(false) }}
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

            {/* Separador */}
            <div className="border-t border-gray-100 pt-4">
              {!confirmLogout ? (
                <button
                  onClick={() => setConfirmLogout(true)}
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
                      onClick={() => setConfirmLogout(false)}
                      className="flex-1 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleLogout}
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
      )}
    </div>
  )
}

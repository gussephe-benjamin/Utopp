import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Home, Plus, User, MoreVertical } from 'lucide-react'
import PublicationWizard from '../components/PublicationWizard'
import { useAuth } from '../auth/useAuth'
import { getMe } from '../api/auth.api'
import { getMyProfile } from '../api/users.api'
import { useRole } from '../hooks/useRole'
import Profile from '../pages/Profile'
import { AppTopBar } from '../features/dashboard/components/AppTopBar'
import { AccountOptionsSheet } from '../features/dashboard/components/AccountOptionsSheet'
import { measureMenuAnchor, type MenuPopoverAnchor } from '../features/dashboard/popoverAnchor'
import FeedModeResolver from '../features/feed/FeedModeResolver'
import { TW_UTOPP_GRADIENT_BR } from '../shared/constants/brand'

const FALLBACK_MENU_ANCHOR: MenuPopoverAnchor = { top: 64, right: 12, minWidth: 40 }

/**
 * Layout principal tras el login.
 * Barra fija superior (marca, crear oportunidad, cuenta, avatar) + contenido con scroll.
 */
export default function DashboardLayout() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { logout } = useAuth()

  const { canCreate, allowedTypes, roleName } = useRole()

  useEffect(() => {
    getMe()
      .then((u) => {
        if (u.needs_terms) navigate('/app/terms', { replace: true })
      })
      .catch(() => {})
  }, [navigate])

  const [showWizard, setShowWizard]           = useState(false)
  const [showOptionsModal, setShowOptionsModal] = useState(false)
  const [showFeedFiltersSheet, setShowFeedFiltersSheet] = useState(false)
  const [feedCategoryFiltersActive, setFeedCategoryFiltersActive] = useState(false)

  const accountMenuTriggerRef = useRef<HTMLButtonElement>(null)
  const feedFiltersTriggerRef = useRef<HTMLButtonElement>(null)
  const [accountMenuAnchor, setAccountMenuAnchor] = useState<MenuPopoverAnchor | null>(null)
  const [filterPopoverAnchor, setFilterPopoverAnchor] = useState<MenuPopoverAnchor | null>(null)

  const onCategoryFiltersActiveChange = useCallback((active: boolean) => {
    setFeedCategoryFiltersActive(active)
  }, [])

  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [userName, setUserName]   = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    getMyProfile()
      .then((d: { id: number; full_name?: string; email?: string; profile_image_url?: string }) => {
        setCurrentUserId(d.id)
        setUserName(d.full_name ?? null)
        setUserEmail(d.email ?? null)
        const apiUrl = d.profile_image_url
        if (apiUrl) {
          setAvatarUrl(apiUrl)
          localStorage.setItem(`avatar_${d.id}`, apiUrl)
        } else {
          const saved = localStorage.getItem(`avatar_${d.id}`)
          setAvatarUrl(saved || null)
        }
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

  useEffect(() => {
    if (!showWizard) return

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    const prevOverflow = document.body.style.overflow
    const prevPaddingRight = document.body.style.paddingRight

    document.body.style.overflow = 'hidden'
    document.body.style.paddingRight = `${scrollbarWidth}px`

    return () => {
      document.body.style.overflow = prevOverflow
      document.body.style.paddingRight = prevPaddingRight
    }
  }, [showWizard])

  const isFeedActive    = location.pathname === '/app/inicio'
  const isProfileActive = location.pathname.startsWith('/app/perfil')
  const profileViewIdMatch = location.pathname.match(/^\/app\/perfil\/(\d+)$/)
  const profileViewId = profileViewIdMatch ? Number(profileViewIdMatch[1]) : undefined

  useEffect(() => {
    if (!isFeedActive) {
      setShowFeedFiltersSheet(false)
      setFilterPopoverAnchor(null)
    }
  }, [isFeedActive])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)')
    let lastMatches = mediaQuery.matches

    const handleBreakpointChange = (event?: MediaQueryListEvent) => {
      const nextMatches = event?.matches ?? mediaQuery.matches
      if (nextMatches !== lastMatches) {
        setShowFeedFiltersSheet(false)
        setFilterPopoverAnchor(null)
        lastMatches = nextMatches
      }
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleBreakpointChange)
      return () => mediaQuery.removeEventListener('change', handleBreakpointChange)
    }

    mediaQuery.addListener(handleBreakpointChange)
    return () => mediaQuery.removeListener(handleBreakpointChange)
  }, [])

  const syncAccountMenuAnchor = useCallback(() => {
    const m = measureMenuAnchor(accountMenuTriggerRef.current)
    if (m) setAccountMenuAnchor(m)
  }, [])

  const syncFilterMenuAnchor = useCallback(() => {
    const m = measureMenuAnchor(feedFiltersTriggerRef.current)
    if (m) setFilterPopoverAnchor(m)
  }, [])

  useLayoutEffect(() => {
    if (!showOptionsModal) return
    syncAccountMenuAnchor()
    window.addEventListener('resize', syncAccountMenuAnchor)
    window.addEventListener('scroll', syncAccountMenuAnchor, true)
    return () => {
      window.removeEventListener('resize', syncAccountMenuAnchor)
      window.removeEventListener('scroll', syncAccountMenuAnchor, true)
    }
  }, [showOptionsModal, syncAccountMenuAnchor])

  useLayoutEffect(() => {
    if (!showFeedFiltersSheet) return
    syncFilterMenuAnchor()
    window.addEventListener('resize', syncFilterMenuAnchor)
    window.addEventListener('scroll', syncFilterMenuAnchor, true)
    return () => {
      window.removeEventListener('resize', syncFilterMenuAnchor)
      window.removeEventListener('scroll', syncFilterMenuAnchor, true)
    }
  }, [showFeedFiltersSheet, syncFilterMenuAnchor])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const displayName = userName || userEmail || 'Usuario'
  const initial     = displayName.charAt(0).toUpperCase()

  return (
    <div className={`min-h-screen flex flex-col bg-gray-50 ${showWizard ? 'overflow-hidden' : ''}`}>
      <AppTopBar
        onBrandClick={() => {
          if (isFeedActive) {
            window.location.assign(`${window.location.origin}/app/inicio`)
            return
          }
          navigate('/app/inicio')
        }}
        onOpenAccountMenu={() => {
          setShowFeedFiltersSheet(false)
          setFilterPopoverAnchor(null)
          setAccountMenuAnchor(
            measureMenuAnchor(accountMenuTriggerRef.current) ?? FALLBACK_MENU_ANCHOR,
          )
          setShowOptionsModal(true)
        }}
        onOpenFeedFilters={
          isFeedActive
            ? () => {
                setShowOptionsModal(false)
                setFilterPopoverAnchor(
                  measureMenuAnchor(feedFiltersTriggerRef.current) ?? FALLBACK_MENU_ANCHOR,
                )
                setShowFeedFiltersSheet(true)
              }
            : undefined
        }
        feedCategoryFiltersActive={isFeedActive && feedCategoryFiltersActive}
        onOpenCreate={() => setShowWizard(true)}
        canCreate={canCreate}
        avatarUrl={avatarUrl}
        avatarInitial={initial}
        displayName={displayName}
        isProfileRoute={isProfileActive}
        accountMenuTriggerRef={accountMenuTriggerRef}
        feedFiltersTriggerRef={feedFiltersTriggerRef}
      />

      <main className="flex-1 relative overflow-hidden pt-0 md:pt-14">
        <div className={`absolute inset-0 overflow-y-auto no-scrollbar pb-24 md:pb-6 bg-gray-50${isFeedActive ? '' : ' hidden'}`}>
          <FeedModeResolver
            filtersSheetOpen={showFeedFiltersSheet}
            onCloseFiltersSheet={() => {
              setShowFeedFiltersSheet(false)
              setFilterPopoverAnchor(null)
            }}
            filterPopoverAnchor={filterPopoverAnchor}
            onCategoryFiltersActiveChange={onCategoryFiltersActiveChange}
            onOpenCreate={() => setShowWizard(true)}
          />
        </div>
        <div className={`absolute inset-0 overflow-y-auto no-scrollbar pb-24 md:pb-6 bg-gray-50${isProfileActive ? '' : ' hidden'}`}>
          <Profile viewUserId={profileViewId} />
        </div>
        {!isFeedActive && !isProfileActive && (
          <div className="absolute inset-0 overflow-y-auto no-scrollbar pb-24 md:pb-6 bg-gray-50">
            <Outlet />
          </div>
        )}
      </main>

      {/* Barra de Navegación Inferior (Móvil) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-gray-100/80 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-50 px-4">
        {canCreate ? (
          <div className="flex h-full items-center justify-around">
            <button
              onClick={() => {
                if (isFeedActive) {
                  window.location.assign(`${window.location.origin}/app/inicio`)
                  return
                }
                navigate('/app/inicio')
              }}
              className="flex flex-col items-center justify-center w-12 h-12 active:scale-95 transition-transform"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#5f38ff] flex items-center justify-center text-white font-extrabold text-lg shadow-[0_4px_12px_rgba(95,56,255,0.25)]">
                U
              </div>
            </button>
            
            <button
              onClick={() => {
                if (isFeedActive) {
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                } else {
                  navigate('/app/inicio')
                }
              }}
              className="flex flex-col items-center justify-center w-12 h-12 active:scale-95 transition-transform"
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${isFeedActive ? 'bg-[#f3efff] text-[#5f38ff] shadow-sm' : 'bg-transparent text-gray-400'}`}>
                <Home className="w-5.5 h-5.5 stroke-[2]" />
              </div>
            </button>

            <div className="relative w-12 h-12 flex items-center justify-center">
              <button
                type="button"
                onClick={() => setShowWizard(true)}
                className={`absolute -top-[22px] w-[54px] h-[54px] rounded-full ${TW_UTOPP_GRADIENT_BR} text-white flex items-center justify-center shadow-[0_6px_20px_rgba(47,85,246,0.35)] border-4 border-white active:scale-95 transition-all`}
              >
                <Plus className="w-5.5 h-5.5 stroke-[3.5]" />
              </button>
            </div>

            <button
              onClick={() => navigate('/app/perfil')}
              className="flex flex-col items-center justify-center w-12 h-12 active:scale-95 transition-transform"
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${isProfileActive ? 'bg-[#f3efff] text-[#5f38ff] shadow-sm' : 'bg-transparent text-gray-400'}`}>
                <User className="w-5.5 h-5.5 stroke-[2]" />
              </div>
            </button>

            <button
              onClick={() => {
                setShowFeedFiltersSheet(false)
                setFilterPopoverAnchor(null)
                setAccountMenuAnchor(FALLBACK_MENU_ANCHOR)
                setShowOptionsModal(true)
              }}
              className="flex flex-col items-center justify-center w-12 h-12 active:scale-95 transition-transform"
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${showOptionsModal ? 'bg-[#f3efff] text-[#5f38ff] shadow-sm' : 'bg-transparent text-gray-400'}`}>
                <MoreVertical className="w-5.5 h-5.5 stroke-[2]" />
              </div>
            </button>
          </div>
        ) : (
          <div className="grid h-full grid-cols-3 items-center justify-items-center">
            <button
              onClick={() => {
                if (isFeedActive) {
                  window.location.assign(`${window.location.origin}/app/inicio`)
                  return
                }
                navigate('/app/inicio')
              }}
              className="flex flex-col items-center justify-center w-12 h-12 active:scale-95 transition-transform"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#5f38ff] flex items-center justify-center text-white font-extrabold text-lg shadow-[0_4px_12px_rgba(95,56,255,0.25)]">
                U
              </div>
            </button>

            <button
              onClick={() => {
                if (isFeedActive) {
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                } else {
                  navigate('/app/inicio')
                }
              }}
              className="flex flex-col items-center justify-center w-12 h-12 active:scale-95 transition-transform"
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${isFeedActive ? 'bg-[#f3efff] text-[#5f38ff] shadow-sm' : 'bg-transparent text-gray-400'}`}>
                <Home className="w-5.5 h-5.5 stroke-[2]" />
              </div>
            </button>

            <button
              onClick={() => {
                setShowFeedFiltersSheet(false)
                setFilterPopoverAnchor(null)
                setAccountMenuAnchor(FALLBACK_MENU_ANCHOR)
                setShowOptionsModal(true)
              }}
              className="flex flex-col items-center justify-center w-12 h-12 active:scale-95 transition-transform"
            >
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all">
                <div
                  className={`rounded-full bg-gradient-to-br from-blue-600 to-fuchsia-500 p-[2px] shadow-sm ${
                    showOptionsModal || isProfileActive ? 'ring-2 ring-violet-200' : ''
                  }`}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-9 h-9 rounded-full object-cover border-2 border-white bg-white"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center bg-violet-100 text-violet-700 font-bold text-sm">
                      {initial}
                    </div>
                  )}
                </div>
              </div>
            </button>
          </div>
        )}
      </div>

      <PublicationWizard isOpen={showWizard} onClose={() => setShowWizard(false)} allowedTypes={allowedTypes} />

      {showOptionsModal && (
        <AccountOptionsSheet
          displayName={displayName}
          userEmail={userEmail}
          avatarUrl={avatarUrl}
          initial={initial}
          anchor={accountMenuAnchor ?? FALLBACK_MENU_ANCHOR}
          onClose={() => {
            setShowOptionsModal(false)
            setAccountMenuAnchor(null)
          }}
          onNavigateProfile={() => navigate('/app/perfil')}
          onLogout={handleLogout}
        />
      )}
    </div>
  )
}

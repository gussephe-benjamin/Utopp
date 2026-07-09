import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CalendarDays, Home, Plus, User, Users } from 'lucide-react'
import PublicationWizard from '../components/PublicationWizard'
import EventsPage from '../pages/EventsPage'
import OrganizationsPage from '../pages/OrganizationsPage'
import { getMe } from '../api/auth.api'
import { getMyProfile, type UserProfileResponse } from '../api/users.api'
import { useRole, ROLE_ADMIN, ROLE_ROOT } from '../hooks/useRole'
import Profile from '../pages/Profile'
import { AppTopBar } from '../features/dashboard/components/AppTopBar'
import { measureMenuAnchor, type MenuPopoverAnchor } from '../features/dashboard/popoverAnchor'
import FeedModeResolver from '../features/feed/FeedModeResolver'
import { AppLink } from '../shared/navigation/AppLink'

const FALLBACK_MENU_ANCHOR: MenuPopoverAnchor = { top: 64, right: 12, minWidth: 40 }

const NAV_ACTIVE = 'text-[#5f38ff]'
const NAV_IDLE = 'text-gray-400'

/**
 * Layout principal tras el login.
 * Barra fija superior (marca, crear oportunidad, cuenta, avatar) + contenido con scroll.
 */
export default function DashboardLayout() {
  const navigate  = useNavigate()
  const location  = useLocation()

  const { canCreate, allowedTypes, roleName } = useRole()

  useEffect(() => {
    getMe()
      .then((u) => {
        if (u.needs_terms) navigate('/app/terms', { replace: true })
      })
      .catch(() => {})
  }, [navigate])

  const [showWizard, setShowWizard] = useState(false)
  const [showFeedFiltersSheet, setShowFeedFiltersSheet] = useState(false)
  const [feedCategoryFiltersActive, setFeedCategoryFiltersActive] = useState(false)

  const feedFiltersTriggerRef = useRef<HTMLButtonElement>(null)
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
      .then((d: UserProfileResponse) => {
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
  const isEventsActive  = location.pathname === '/app/eventos'
  const isOrgsActive    = location.pathname === '/app/organizaciones'
  const isProfileActive = location.pathname.startsWith('/app/perfil')
  const profileViewIdMatch = location.pathname.match(/^\/app\/perfil\/(\d+)$/)
  const profileViewId = profileViewIdMatch ? Number(profileViewIdMatch[1]) : undefined

  useEffect(() => {
    if (!isProfileActive || profileViewId == null || currentUserId == null) return
    if (profileViewId === currentUserId) {
      navigate(`/app/perfil${location.search}`, { replace: true })
    }
  }, [isProfileActive, profileViewId, currentUserId, location.search, navigate])

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

  const syncFilterMenuAnchor = useCallback(() => {
    const m = measureMenuAnchor(feedFiltersTriggerRef.current)
    if (m) setFilterPopoverAnchor(m)
  }, [])

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

  const displayName = userName || userEmail || 'Usuario'
  const canAccessAdmin = roleName === ROLE_ADMIN || roleName === ROLE_ROOT
  const feedSectionActive: "posts" | "events" | null = isEventsActive
    ? "events"
    : isFeedActive
      ? "posts"
      : null

  const hasPrimaryPanel = isFeedActive || isEventsActive || isOrgsActive || isProfileActive

  return (
    <div className={`min-h-screen flex flex-col bg-gray-50 ${showWizard ? 'overflow-hidden' : ''}`}>
      <AppTopBar
        isFeedActive={isFeedActive}
        feedSection={feedSectionActive ?? undefined}
        onOpenFeedFilters={
          isFeedActive
            ? () => {
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
        userId={currentUserId}
        displayName={displayName}
        isProfileRoute={isProfileActive}
        canAccessAdmin={canAccessAdmin}
        feedFiltersTriggerRef={feedFiltersTriggerRef}
      />

      <main className="flex-1 relative overflow-hidden pt-0 md:pt-14">
        <div className={`absolute inset-x-0 bottom-0 top-0 md:top-14 overflow-y-auto no-scrollbar pb-24 md:pb-6 bg-gray-50${isFeedActive ? '' : ' hidden'}`}>
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
        <div className={`absolute inset-x-0 bottom-0 top-0 md:top-14 overflow-y-auto no-scrollbar pb-24 md:pb-6 bg-gray-50${isEventsActive ? '' : ' hidden'}`}>
          {isEventsActive && <EventsPage />}
        </div>
        <div className={`absolute inset-x-0 bottom-0 top-0 md:top-14 overflow-y-auto no-scrollbar pb-24 md:pb-6 bg-gray-50${isOrgsActive ? '' : ' hidden'}`}>
          {isOrgsActive && <OrganizationsPage />}
        </div>
        <div className={`absolute inset-x-0 bottom-0 top-0 md:top-14 overflow-y-auto no-scrollbar pb-24 md:pb-6 bg-gray-50${isProfileActive ? '' : ' hidden'}`}>
          <Profile viewUserId={profileViewId} />
        </div>
        {!hasPrimaryPanel && (
          <div className="absolute inset-x-0 bottom-0 top-0 md:top-14 overflow-y-auto no-scrollbar pb-24 md:pb-6 bg-gray-50">
            <Outlet />
          </div>
        )}
      </main>

      {/* Barra inferior móvil: Inicio · Eventos · + · Grupos · Perfil */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-[68px] border-t border-gray-100/70 bg-white px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_28px_rgba(47,85,246,0.08)]"
        aria-label="Navegación principal"
      >
        <div className="grid h-full w-full grid-cols-5 items-center">
          <AppLink
            to="/app/inicio"
            onClick={(event) => {
              if (isFeedActive) {
                event.preventDefault()
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }
            }}
            className={`flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform ${
              isFeedActive ? NAV_ACTIVE : NAV_IDLE
            }`}
            aria-label="Inicio"
            aria-current={isFeedActive ? 'page' : undefined}
          >
            <Home className="h-[22px] w-[22px] stroke-[1.75]" />
            <span className={`text-[11px] leading-none ${isFeedActive ? 'font-bold' : 'font-medium'}`}>
              Inicio
            </span>
          </AppLink>

          <AppLink
            to="/app/eventos"
            className={`flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform ${
              isEventsActive ? NAV_ACTIVE : NAV_IDLE
            }`}
            aria-label="Eventos"
            aria-current={isEventsActive ? 'page' : undefined}
          >
            <CalendarDays className="h-[22px] w-[22px] stroke-[1.75]" />
            <span className={`text-[11px] leading-none ${isEventsActive ? 'font-bold' : 'font-medium'}`}>
              Eventos
            </span>
          </AppLink>

          <div className="relative flex h-12 items-center justify-center">
            {canCreate ? (
              <button
                type="button"
                onClick={() => setShowWizard(true)}
                aria-label="Crear oportunidad"
                className="absolute -top-6 flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-b from-[#9b7bff] to-[#6d3ff5] text-white shadow-[0_8px_22px_rgba(109,63,245,0.45)] transition-all active:scale-95"
              >
                <Plus className="h-7 w-7 stroke-[2.75]" />
              </button>
            ) : null}
          </div>

          <AppLink
            to="/app/organizaciones"
            className={`flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform ${
              isOrgsActive ? NAV_ACTIVE : NAV_IDLE
            }`}
            aria-label="Grupos"
            aria-current={isOrgsActive ? 'page' : undefined}
          >
            <Users className="h-[22px] w-[22px] stroke-[1.75]" />
            <span className={`text-[11px] leading-none ${isOrgsActive ? 'font-bold' : 'font-medium'}`}>
              Grupos
            </span>
          </AppLink>

          <AppLink
            to="/app/perfil"
            className={`flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform ${
              isProfileActive ? NAV_ACTIVE : NAV_IDLE
            }`}
            aria-label="Ir a mi perfil"
            aria-current={isProfileActive ? 'page' : undefined}
          >
            <User className="h-[22px] w-[22px] stroke-[1.75]" />
            <span className={`text-[11px] leading-none ${isProfileActive ? 'font-bold' : 'font-medium'}`}>
              Perfil
            </span>
          </AppLink>
        </div>
      </nav>

      <PublicationWizard isOpen={showWizard} onClose={() => setShowWizard(false)} allowedTypes={allowedTypes} />
    </div>
  )
}

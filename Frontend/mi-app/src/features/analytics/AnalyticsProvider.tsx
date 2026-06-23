import { useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"
import { useRole, ROLE_ESTUDIANTE } from "../../hooks/useRole"
import { setAnalyticsEnabled, trackEvent } from "./analyticsTracker"

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { roleName, loading } = useRole()
  const location = useLocation()
  const appOpenedRef = useRef(false)
  const lastPathRef = useRef<string | null>(null)

  const isStudent = !loading && roleName === ROLE_ESTUDIANTE

  useEffect(() => {
    setAnalyticsEnabled(isStudent)
  }, [isStudent])

  useEffect(() => {
    if (!isStudent) return
    if (location.pathname.startsWith("/app/admin")) return

    if (!appOpenedRef.current) {
      appOpenedRef.current = true
      trackEvent("app_opened")
    }

    if (lastPathRef.current !== location.pathname) {
      lastPathRef.current = location.pathname
      trackEvent("page_view", { page: location.pathname })
    }

    if (location.pathname.includes("/inicio") || location.pathname === "/app") {
      trackEvent("feed_viewed")
    }
  }, [isStudent, location.pathname])

  useEffect(() => {
    if (!isStudent) return
    const onUnload = () => trackEvent("session_ended")
    window.addEventListener("beforeunload", onUnload)
    return () => window.removeEventListener("beforeunload", onUnload)
  }, [isStudent])

  return <>{children}</>
}

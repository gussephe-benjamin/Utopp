import { useCallback, useEffect, useState } from "react"
import type { ReactNode } from "react"
import { trackEvent } from "../features/analytics/analyticsTracker"
import { fetchAuthMe, logoutSession, type AuthMeUser } from "../api/auth.api"
import { registerAuthLogoutHandler } from "../api/axios"
import { clearStoredAccessToken } from "../shared/lib/authToken"
import { AuthContext, type AuthStatus } from "./auth-context"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("initializing")
  const [user, setUser] = useState<AuthMeUser | null>(null)

  const applySession = useCallback((sessionUser: AuthMeUser) => {
    setUser(sessionUser)
    setStatus("authenticated")
  }, [])

  const refreshSession = useCallback(async () => {
    try {
      const data = await fetchAuthMe()
      if (data.authenticated && data.user) {
        setUser(data.user)
        setStatus("authenticated")
      } else {
        setUser(null)
        setStatus("unauthenticated")
      }
    } catch {
      setUser(null)
      setStatus("unauthenticated")
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      trackEvent("logout")
      await logoutSession()
    } catch {
      /* cookie may already be cleared */
    }
    clearStoredAccessToken()
    setUser(null)
    setStatus("unauthenticated")
  }, [])

  useEffect(() => {
    registerAuthLogoutHandler(logout)
  }, [logout])

  useEffect(() => {
    void Promise.resolve().then(refreshSession)
  }, [refreshSession])

  return (
    <AuthContext.Provider value={{ status, user, refreshSession, applySession, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

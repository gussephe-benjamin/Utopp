import { useCallback, useEffect, useState } from "react"
import type { ReactNode } from "react"
import { fetchAuthMe, logoutSession, type AuthMeUser } from "../api/auth.api"
import { registerAuthLogoutHandler } from "../api/axios"
import { AuthContext, type AuthStatus } from "./auth-context"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("initializing")
  const [user, setUser] = useState<AuthMeUser | null>(null)

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
      await logoutSession()
    } catch {
      /* cookie may already be cleared */
    }
    setUser(null)
    setStatus("unauthenticated")
  }, [])

  useEffect(() => {
    registerAuthLogoutHandler(logout)
  }, [logout])

  useEffect(() => {
    void refreshSession()
  }, [refreshSession])

  return (
    <AuthContext.Provider value={{ status, user, refreshSession, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

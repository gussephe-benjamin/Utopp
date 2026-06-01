import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { AuthContext } from "./auth-context"
import { getToken, setToken, clearToken, subscribeTokenChanges } from "./tokenStorage"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken())

  useEffect(() => {
    return subscribeTokenChanges(() => {
      setTokenState(getToken())
    })
  }, [])

  const login = (jwt: string) => {
    setToken(jwt)
    setTokenState(jwt)
  }

  const logout = () => {
    clearToken()
    setTokenState(null)
  }

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

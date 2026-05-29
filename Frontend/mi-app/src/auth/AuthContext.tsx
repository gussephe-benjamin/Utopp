import { useState } from "react"
import type { ReactNode } from "react"
import { AuthContext } from "./auth-context"
import { getToken, setToken, clearToken } from "./tokenStorage"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getToken())

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

import { useState } from "react"
import type { ReactNode } from "react"
import { AuthContext } from "./auth-context"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  )

  const login = (jwt: string) => {
    localStorage.setItem("token", jwt)
    setToken(jwt)
  }

  const logout = () => {
    localStorage.removeItem("token")
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

import { createContext } from "react"
import type { AuthMeUser } from "../api/auth.api"

export type AuthStatus = "initializing" | "authenticated" | "unauthenticated"

export interface AuthContextType {
  status: AuthStatus
  user: AuthMeUser | null
  refreshSession: () => Promise<void>
  applySession: (user: AuthMeUser) => void
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)

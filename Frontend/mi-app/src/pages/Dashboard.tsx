import { useAuth } from "../auth/useAuth"
import type { JSX } from "react"

export default function Dashboard(): JSX.Element {
  const { logout } = useAuth()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <button
        onClick={logout}
        className="bg-red-600 text-white px-4 py-2"
      >
        Logout
      </button>
    </div>
  )
}

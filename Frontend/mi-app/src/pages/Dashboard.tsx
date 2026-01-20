// import { useAuth } from "../auth/useAuth"
import type { JSX } from "react"
import { useNavigate } from "react-router-dom"

export default function Dashboard(): JSX.Element {
  // const { logout } = useAuth()

  const navigate = useNavigate()

  const dash = () => {
    console.log("Dash")
    navigate("/login")
  }
    
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <button
        onClick={()=> dash()}
        className="bg-red-600 text-white px-4 py-2"
      >
        Logout
      </button>
    </div>
  )
}

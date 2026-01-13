import { useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api/axios"
import { useAuth } from "../auth/useAuth"
import type { FormEvent } from "react"

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {

      const res = await api.post("/auth/login", {
        email,
        password,
      })

      console.log(res.data.access_token)
    
      // 1️⃣ guardar token en contexto / storage
      login(res.data.access_token)

      const response = await api.post("/auth/onboarding",{
        email
      })

      if (!response.data.onboarding_completed) {
          navigate("/onboarding");
        } else {
          navigate("/dashboard");
        }

    } catch (error) {
      console.error("Error en login", error)
    }
  }
    return (
    <form
      onSubmit={handleSubmit}
      className="min-h-screen flex flex-col items-center justify-center gap-4"
    >
      <input
        type="email"
        className="border p-2"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        className="border p-2"
        placeholder="Password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button className="bg-red-500 text-white px-4 py-2">
        Login
      </button>
    </form>
  )
}

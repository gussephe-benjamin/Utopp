import api from "../api/axios"
import { useNavigate } from "react-router-dom"
import type { JSX } from "react"

interface Props {
  data: Record<string, unknown>;
}

export default function FinishOnboarding({ data }: Props): JSX.Element {
  const navigate = useNavigate()

  const handleFinish = async () => {
    try {
      const res = await api.post("/onboarding/update", data)

      if (!res.status || res.status >= 400) {
        throw new Error("Error al completar onboarding")
      }

      // Redirigir al dashboard
      navigate("/dashboard", { replace: true })

    } catch (error) {
      console.error(error)
      alert("Error al completar onboarding")
    }
  }

  return (
    <div>
      <h1>¡Onboarding Completado!</h1>
      <button onClick={handleFinish}>
        Ir al Dashboard
      </button>
    </div>
  )
}



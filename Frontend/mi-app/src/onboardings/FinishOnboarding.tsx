import { useNavigate } from "react-router-dom"
import type { JSX } from "react"
import { updateOnboarding } from "../api/apiFunctions/onboarding";
import type { OnboardingData } from "../types/OnboardingData";

export default function FinishOnboarding({ data }: { data: OnboardingData }): JSX.Element {
  const navigate = useNavigate()

  const handleFinish = async () => {
    try {

      console.error("DATA", data)

      const res = await updateOnboarding(data);
      
      
      if (!res.ok) {
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



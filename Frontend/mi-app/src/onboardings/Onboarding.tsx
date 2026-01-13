import { useState } from "react";
import StepCareer from "./StepCareer";
import StepInterests from "./StepInterests";
import StepAvailability from "./StepAvailability";
import { useNavigate } from "react-router-dom";
import type { JSX } from "react"
import api from "../api/axios"

export type OnboardingData = {
  career: string;
  interests: string[];
  availability: number;
};

export default function Onboarding(): JSX.Element {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    career: "",
    interests: [],
    availability: 0,
  });

  const navigate = useNavigate();

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

  const canContinue = () => {
    if (step === 1) return data.career !== "";
    if (step === 2) return data.interests.length >= 2;
    if (step === 3) return data.availability > 0;
    return false;
  };

  const finishOnboarding = async (): Promise<void> => {
    try {

      // console.log(data)

      const res = await api.post("/auth/onboarding/update", data);    

      if (!res.status || res.status >= 400) {
        throw new Error("Error al completar onboarding");
      }

      navigate("/dashboard", { replace: true });

    } catch (error) {
      console.error(error);
      alert("Error al completar onboarding");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "40px auto" }}>
      <h2>Paso {step} de 3</h2>

      {/* CONTENIDO */}
      <div
        style={{
          transition: "all 0.4s",
          opacity: 1,
        }}
      >
        {step === 1 && <StepCareer data={data} setData={setData} />}
        {step === 2 && <StepInterests data={data} setData={setData} />}
        {step === 3 && <StepAvailability data={data} setData={setData} />}
      </div>

      {/* BOTONES */}
      <div style={{ marginTop: 20 }}>
        {step > 1 && <button onClick={back}>Atrás </button>}

        {step < 3 ? (
          <button disabled={!canContinue()} onClick={next}>
            Siguiente
          </button>
        ) : (
          <button
            disabled={!canContinue()}
            onClick={finishOnboarding}
          >
            Finalizar
          </button>
        )}
      </div>
    </div>
  );
}

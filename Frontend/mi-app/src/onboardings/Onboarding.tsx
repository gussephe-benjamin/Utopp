import { useState } from "react";
import StepCareer from "./steps/StepCareer";
import StepInterests from "./steps/StepInterests";
import StepAvailability from "./steps/StepAvailability";
import CycleStep from "./steps/StepCycle";  
import { useNavigate } from "react-router-dom";
import type { JSX } from "react"
import { updateOnboarding } from "../api/apiFunctions/onboarding";
import StepBar from "../componets/uiOnboarding/StepBar";

import { useEffect } from "react"
import { checkOnboardingCompleted } from"./functions/isCompleteVerificate";

export type OnboardingData = {
  career: string;
  cycle: number | null;
  interests: string[];
  availability: number;
};

export default function Onboarding(): JSX.Element {
  const navigate = useNavigate();

  useEffect(() => {
    checkOnboardingCompleted(navigate)
  }, [navigate])

  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    career: "",
    cycle: null,
    interests: [],
    availability: 0,
  });

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

  const canContinue = () => {
    if (step === 1) return data.career !== "";
    if (step === 2) return data.cycle !== null;
    if (step === 3) return data.interests.length >= 3;
    if (step === 4) return data.availability > 0;
    return false;
  };

  const finishOnboarding = async (): Promise<void> => {
    try {

      console.log(data)

      const res = await updateOnboarding(data);    

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

      <StepBar step={step}/>
    
      {/* CONTENIDO */}
      <div
        style={{
          transition: "all 0.8s",
          opacity: 1,
        }}
      >
        
        {step === 1 && <StepCareer data={data} setData={setData} />}
        {step === 2 && <CycleStep data={data} setData={setData} />}
        {step === 3 && <StepInterests data={data} setData={setData} />}
        {step === 4 && <StepAvailability data={data} setData={setData} />}

      </div>

      {/* BOTONES */}
      <div className="flex justify-between mt-6 gap-4">
        
        {/* BOTÓN ATRÁS */}
        {step > 1 && (
          <button
            onClick={back}
            className="px-6 py-3 rounded-2xl border-2 border-black bg-neutral-900 text-white font-semibold text-sm transition-all duration-300 hover:text-black hover:bg-white/20 hover:border-black active:scale-95"
          >
            ← Atrás
          </button>
        )}

        {/* Botón Siguiente / Finalizar */}
        <button
          disabled={!canContinue()}
          onClick={step < 4 ? next : finishOnboarding}
          className={`flex-1 py-3 rounded-2xl font-semibold transition-all duration-300 transform active:scale-[0.98] 
            ${
              canContinue()
                ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30 hover:brightness-105'
                : 'bg-white/10 text-white/50 cursor-not-allowed'
            }`}
        >
          {step < 4 ? 'Siguiente' : 'Finalizar'}
        </button>
      </div>

    </div>
  );
}

import { useState } from "react";
import StepCareer from "./steps/StepCareer";
import StepInterests from "./steps/StepInterests";
import StepAvailability from "./steps/StepAvailability";
import CycleStep from "./steps/StepCycle";  
import { useNavigate } from "react-router-dom";
import type { JSX } from "react"
import { updateOnboarding } from "../../api/onboarding.api";
import type { OnboardingData as OnboardingPayload } from "../../api/onboarding.api";
import StepBar from "./components/StepBar";
import { AxiosError } from "axios";

import { useEffect } from "react"
import { checkOnboardingCompleted } from"./functions/isCompleteVerificate";

export type OnboardingData = Omit<OnboardingPayload, "cycle" | "availability"> & {
  cycle: number | null;
  availability: number | null;
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
    availability: null,
  });

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);
  const showCareerInNext = step === 1 && data.career !== "";

  const canContinue = () => {
    if (step === 1) return data.career !== "";
    if (step === 2) return data.cycle !== null;
    if (step === 3) return data.interests.length >= 3;
    if (step === 4) return data.availability !== null;
    return false;
  };

  const finishOnboarding = async (): Promise<void> => {
    try {
      if (data.cycle === null || data.availability === null) {
        return;
      }

      const payload: OnboardingPayload = {
        ...data,
        cycle: data.cycle,
        availability: data.availability,
      };

      await updateOnboarding(payload);    

      // Si llegamos aquí, la petición fue exitosa
      navigate("/app/inicio", { replace: true });

    } catch (error) {
      console.error(error);
      
      // Si el error es 403 (onboarding ya completado), redirigir al inicio
      if (error instanceof AxiosError && error.response?.status === 403) {
        navigate("/app/inicio", { replace: true });
        return;
      }
      
      alert("Error al completar onboarding");
    }
  };

  return (

    <div
      className="px-4"
      style={{ maxWidth: step === 1 ? 400 : 400, margin: "40px auto", transition: "max-width 0.4s ease" }}
    >

      <StepBar step={step}/>
    
      {/* CONTENIDO */}
      <div
        className="pb-28"
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
      <div className="sticky bottom-0 z-20 border-t border-gray-200 bg-white/95 backdrop-blur">
        {step === 1 && data.career && (
          <p className="text-center text-xs text-gray-400 pt-3 px-4 animate-in fade-in duration-300">
            Seleccionaste: <span className="font-semibold text-gray-600">{data.career}</span>
          </p>
        )}
        <div className="flex justify-between gap-4 py-4 px-0">
        
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
          className={`flex-1 py-3 rounded-2xl font-semibold transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center
            ${
              canContinue()
                ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30 hover:brightness-105'
                : 'bg-white/10 text-white/50 cursor-not-allowed'
            }`}
        >
          {step < 4 ? (
            showCareerInNext ? (
              <span className="flex flex-col leading-tight text-center">
                <span>Siguiente</span>
              </span>
            ) : (
              'Siguiente'
            )
          ) : (
            'Finalizar'
          )}
        </button>
        </div>
      </div>

    </div>
  );
}

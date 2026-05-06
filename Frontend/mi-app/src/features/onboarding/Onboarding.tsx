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

  const footerDescription = (): JSX.Element | null => {
    if (step === 1 && data.career) {
      return (
        <p className="text-center text-xs text-violet-100/85 pt-3 px-4 animate-in fade-in duration-300">
          Seleccionaste: <span className="font-semibold text-white">{data.career}</span>
        </p>
      );
    }

    if (step === 3) {
      const selectedCount = data.interests.length;
      return (
        <div className="text-center pt-3 px-4 animate-in fade-in duration-300">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm">
            <span className="text-violet-50 font-medium text-sm">
              {selectedCount} {selectedCount === 1 ? "interés seleccionado" : "intereses seleccionados"}
            </span>
            {selectedCount >= 3 && <span className="text-fuchsia-300 font-semibold">✓</span>}
          </div>
        </div>
      );
    }

    if (step === 4) {
      return (
        <p className="text-center text-xs text-violet-100/85 pt-3 px-4 animate-in fade-in duration-300">
          Esto nos ayuda a recomendarte la cantidad ideal de eventos
        </p>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2B0F56] via-[#220C49] to-[#120826] text-white">
      <div className="mx-auto max-w-md h-screen relative overflow-hidden">
        <header className="sticky top-0 z-30 px-4 pt-6 pb-4 bg-gradient-to-b from-[#2B0F56]/95 via-[#240D4E]/90 to-transparent backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={step > 1 ? back : undefined}
              className={`text-sm font-semibold transition-colors ${
                step > 1 ? "text-violet-100 hover:text-white" : "text-violet-100/40 cursor-default"
              }`}
            >
              {step > 1 ? "←" : " "}
            </button>
            <button
              type="button"
              onClick={() => navigate("/app/inicio", { replace: true })}
              className="text-sm font-semibold text-violet-100/70 hover:text-white transition-colors"
            >
              Saltar
            </button>
          </div>
          <StepBar step={step} />
        </header>

        <main className="h-[calc(100vh-210px)] overflow-y-auto px-4 pb-8">
          <div className="pb-8 transition-all duration-700 opacity-100">
            {step === 1 && <StepCareer data={data} setData={setData} />}
            {step === 2 && <CycleStep data={data} setData={setData} />}
            {step === 3 && <StepInterests data={data} setData={setData} />}
            {step === 4 && <StepAvailability data={data} setData={setData} />}
          </div>
        </main>

        <footer className="sticky bottom-0 z-30 border-t border-white/10 bg-[#140A2D]/90 backdrop-blur-md px-4 pb-5">
          {footerDescription()}
          <div className="flex justify-between gap-4 py-4">
            {step > 1 && (
              <button
                onClick={back}
                className="px-6 py-3 rounded-2xl border border-white/25 bg-white/5 text-violet-50 font-semibold text-sm transition-all duration-300 hover:bg-white/10 active:scale-95"
              >
                ← Atrás
              </button>
            )}

            <button
              disabled={!canContinue()}
              onClick={step < 4 ? next : finishOnboarding}
              className={`flex-1 py-3 rounded-2xl font-semibold transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center ${
                canContinue()
                  ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30 hover:brightness-105"
                  : "bg-white/10 text-white/50 cursor-not-allowed"
              }`}
            >
              {step < 4 ? (showCareerInNext ? <span className="leading-tight text-center">Siguiente</span> : "Siguiente") : "Finalizar"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

import { useState } from "react";
import StepCareer from "./steps/StepCareer";
import StepInterests from "./steps/StepInterests";
import StepAvailability from "./steps/StepAvailability";
import CycleStep from "./steps/StepCycle";
import { useNavigate } from "react-router-dom";
import type { JSX } from "react";
import { updateOnboarding } from "../../api/onboarding.api";
import type { OnboardingData as OnboardingPayload } from "../../api/onboarding.api";
import StepBar from "./components/StepBar";
import { AxiosError } from "axios";
import { Check } from "lucide-react";

import { useEffect } from "react";
import { checkOnboardingCompleted } from "./functions/isCompleteVerificate";

export type OnboardingData = Omit<OnboardingPayload, "cycle" | "availability"> & {
  cycle: number | null;
  availability: number | null;
};

const MIN_INTERESTS = 3;

function OnboardingMeshBackground({ accentMagenta }: { accentMagenta?: boolean }) {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-[#1a0a38] via-[#120826] to-[#0c0518]" />
      <div
        className={`pointer-events-none absolute -left-24 -top-20 z-0 h-72 w-72 rounded-full bg-fuchsia-600/35 blur-3xl ${
          accentMagenta ? "opacity-90 scale-110" : "opacity-50"
        }`}
      />
      <div className="pointer-events-none absolute -right-32 bottom-0 z-0 h-80 w-80 rounded-full bg-teal-400/25 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 top-1/3 z-0 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
    </>
  );
}

export default function Onboarding(): JSX.Element {
  const navigate = useNavigate();

  useEffect(() => {
    checkOnboardingCompleted(navigate);
  }, [navigate]);

  const [flow, setFlow] = useState<"steps" | "success">("steps");
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

  const interestRemaining = Math.max(0, MIN_INTERESTS - data.interests.length);

  const canContinue = () => {
    if (step === 1) return data.career !== "";
    if (step === 2) return data.cycle !== null;
    if (step === 3) return data.interests.length >= MIN_INTERESTS;
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
      setFlow("success");
    } catch (error) {
      console.error(error);

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
              {selectedCount}{" "}
              {selectedCount === 1 ? "interés seleccionado" : "intereses seleccionados"}
            </span>
            {selectedCount >= MIN_INTERESTS && <span className="text-fuchsia-300 font-semibold">✓</span>}
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

  const stepHeading = (): JSX.Element => {
    switch (step) {
      case 1:
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pt-1">
            <h1 className="text-3xl font-bold text-white mb-2">
              Hola{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                estudiante
              </span>
              ,
            </h1>
            <h2 className="text-2xl font-bold text-violet-50 mb-3">¡cuéntanos de ti!</h2>
            <p className="text-violet-100/80 text-base">¿Qué carrera estudias actualmente?</p>
          </div>
        );
      case 2:
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-1">
            <h2 className="text-lg font-semibold text-violet-50">¿En qué ciclo te encuentras?</h2>
            <p className="text-violet-100/80 text-sm mt-2">
              Esto nos ayudará a recomendarte contenidos adecuados a tu nivel.
            </p>
          </div>
        );
      case 3:
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pt-1">
            <h1 className="text-3xl font-bold text-white mb-2">
              Elige{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                {interestRemaining > 0 ? `${interestRemaining} o más` : "tus"}
              </span>{" "}
              intereses
            </h1>
            <h2 className="text-2xl font-bold text-violet-50 mb-3">favoritos</h2>
            <p className="text-violet-100/80 text-base">Personalizaremos tu experiencia de eventos</p>
          </div>
        );
      case 4:
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pt-1">
            <h1 className="text-3xl font-bold text-white mb-2">
              ¿Cuántas horas{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                libres
              </span>{" "}
              tienes?
            </h1>
            <p className="text-violet-100/80 text-base">A la semana, aproximadamente</p>
          </div>
        );
      default:
        return <></>;
    }
  };

  if (flow === "success") {
    return (
      <div className="relative min-h-screen overflow-hidden text-white">
        <OnboardingMeshBackground accentMagenta />
        <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 pb-12 pt-8">
          <div className="relative mb-10">
            <span className="absolute -left-8 top-2 text-lg text-amber-300/90">✦</span>
            <span className="absolute -right-6 top-8 text-sm text-amber-200/80">✦</span>
            <span className="absolute -left-4 bottom-0 text-xs text-amber-300/70">✦</span>
            <span className="absolute -right-10 bottom-6 text-base text-yellow-300/85">✦</span>
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40 ring-4 ring-emerald-400/30">
              <Check className="h-12 w-12 stroke-[3] text-white" strokeLinecap="round" strokeLinejoin="round" />
            </div>
          </div>
          <h1 className="mb-3 text-center text-3xl font-bold text-white">¡Todo listo!</h1>
          <p className="mb-12 max-w-sm text-center text-base text-violet-100/90">
            Tu perfil ya está personalizado.
          </p>
          <button
            type="button"
            onClick={() => navigate("/app/inicio", { replace: true })}
            className="w-full max-w-sm rounded-full bg-white py-4 text-center text-base font-semibold text-[#2B0F56] shadow-lg transition-transform active:scale-[0.98] hover:brightness-105"
          >
            Ir al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <OnboardingMeshBackground />
      <div className="relative z-10 mx-auto flex h-screen max-w-md min-h-0 flex-col">
        <header className="z-30 shrink-0 px-4 pt-6 pb-3 bg-gradient-to-b from-[#1a0a38]/95 via-[#14082a]/85 to-transparent backdrop-blur-sm">
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={() => navigate("/app/inicio", { replace: true })}
              className="text-sm font-semibold text-violet-100/70 transition-colors hover:text-white"
            >
              Saltar
            </button>
          </div>
          <StepBar step={step} />
          {stepHeading()}
        </header>

        <main className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-6">
          <div className="pb-4 transition-all duration-700 opacity-100">
            {step === 1 && <StepCareer data={data} setData={setData} />}
            {step === 2 && <CycleStep data={data} setData={setData} />}
            {step === 3 && <StepInterests data={data} setData={setData} />}
            {step === 4 && <StepAvailability data={data} setData={setData} />}
          </div>
        </main>

        <footer className="z-30 shrink-0 border-t border-white/[0.08] bg-gradient-to-t from-[#0c0518]/70 via-[#1a0a38]/25 to-transparent px-4 pb-5 pt-1 backdrop-blur-2xl">
          {footerDescription()}
          <div className="flex justify-between gap-4 py-4">
            {step > 1 && (
              <button
                type="button"
                onClick={back}
                className="rounded-2xl border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-violet-50 transition-all duration-300 hover:bg-white/10 active:scale-95"
              >
                ← Atrás
              </button>
            )}

            <button
              type="button"
              disabled={!canContinue()}
              onClick={step < 4 ? next : finishOnboarding}
              className={`flex flex-1 items-center justify-center rounded-2xl py-3 font-semibold transition-all duration-300 transform active:scale-[0.98] ${
                canContinue()
                  ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30 hover:brightness-105"
                  : "cursor-not-allowed bg-white/10 text-white/50"
              }`}
            >
              {step < 4
                ? showCareerInNext
                  ? <span className="text-center leading-tight">Siguiente</span>
                  : "Siguiente"
                : "Finalizar"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

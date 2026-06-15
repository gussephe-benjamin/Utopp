import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import StepCareer from "./steps/StepCareer";
import CycleStep from "./steps/StepCycle";
import type { JSX } from "react";
import { updateOnboarding } from "../../api/onboarding.api";
import StepBar from "./components/StepBar";
import { AxiosError } from "axios";
import { Check, ChevronRight } from "lucide-react";
import { checkOnboardingCompleted } from "./functions/isCompleteVerificate";

export type OnboardingData = {
  career: string;
  cycle: number | null;
};

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
  });

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);
  const showCareerInNext = step === 1 && data.career !== "";

  const canContinue = () => {
    if (step === 1) return data.career !== "";
    if (step === 2) return data.cycle !== null;
    return false;
  };

  const skipOnboarding = (): void => {
    navigate("/app/inicio", { replace: true });
  };

  const finishOnboarding = async (): Promise<void> => {
    try {
      if (data.cycle === null) return;

      await updateOnboarding({
        career: data.career,
        cycle: data.cycle,
      });
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

    if (step === 2 && data.cycle !== null) {
      return (
        <p className="text-center text-xs text-violet-100/85 pt-3 px-4 animate-in fade-in duration-300">
          Ciclo <span className="font-semibold text-white">{data.cycle}</span>
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
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40 ring-4 ring-emerald-400/30">
              <Check className="h-12 w-12 stroke-[3] text-white" strokeLinecap="round" strokeLinejoin="round" />
            </div>
          </div>
          <h1 className="mb-3 text-center text-3xl font-bold text-white">¡Todo listo!</h1>
          <p className="mb-8 max-w-sm text-center text-base text-violet-100/90">
            Ya puedes explorar Utopp. Completa tu perfil cuando quieras para mejores recomendaciones.
          </p>
          <button
            type="button"
            onClick={() => navigate("/app/inicio", { replace: true })}
            className="mb-3 w-full max-w-sm rounded-full bg-white py-4 text-center text-base font-semibold text-[#2B0F56] shadow-lg transition-transform active:scale-[0.98] hover:brightness-105"
          >
            Ir al inicio
          </button>
          <button
            type="button"
            onClick={() => navigate("/app/perfil?settings=1", { replace: true })}
            className="w-full max-w-sm rounded-full border border-white/25 bg-white/5 py-3.5 text-center text-sm font-semibold text-violet-50 transition-colors hover:bg-white/10"
          >
            Ir a configurar perfil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <OnboardingMeshBackground />
      <div className="relative z-10 mx-auto flex h-screen max-w-md min-h-0 flex-col">
        <div className="flex shrink-0 items-center justify-end px-4 pt-4 pb-1">
          <button
            type="button"
            onClick={skipOnboarding}
            className="group inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-white/45 transition-colors hover:text-white/80 focus-visible:text-white/80 focus-visible:outline-none"
          >
            Saltar
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </button>
        </div>

        <header className="z-30 shrink-0 bg-transparent px-4 pb-3 pt-1">
          <StepBar step={step} />
          {stepHeading()}
        </header>

        <main className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-6">
          <div className="pb-4 transition-all duration-700 opacity-100">
            {step === 1 && <StepCareer data={data} setData={setData} />}
            {step === 2 && <CycleStep data={data} setData={setData} />}
          </div>
        </main>

        <footer className="z-30 shrink-0 bg-transparent px-4 pb-5 pt-1">
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
              onClick={step < 2 ? next : finishOnboarding}
              className={`flex flex-1 items-center justify-center rounded-2xl py-3 font-semibold transition-all duration-300 transform active:scale-[0.98] ${
                canContinue()
                  ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30 hover:brightness-105"
                  : "cursor-not-allowed bg-white/10 text-white/50"
              }`}
            >
              {step < 2
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

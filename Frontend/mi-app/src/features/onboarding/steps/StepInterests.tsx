import { Check } from "lucide-react";
import type { OnboardingData } from "../Onboarding";
import React from "react";
import { INTERESTS } from "../../../constants/interests";

interface InterestsStepProps {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
  minSelected?: number; // mínimo de intereses a seleccionar
}

export default function InterestsStep({
  data,
  setData,
  minSelected = 3,
}: InterestsStepProps) {
  const toggleInterest = (id: string) => {
    const current = data.interests || [];
    const updated = current.includes(id)
      ? current.filter((i) => i !== id)
      : [...current, id];

    setData({ ...data, interests: updated });
  };

  const selectedCount = data.interests?.length || 0;
  const remaining = Math.max(0, minSelected - selectedCount);

  return (
    <div className="space-y-10 ">
      {/* Title section */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-3xl font-bold text-white mb-2">
          Elige{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
            {remaining > 0 ? `${remaining} o más` : "tus"}
          </span>{" "}
          intereses
        </h1>
        <h2 className="text-2xl font-bold text-violet-50 mb-3">favoritos</h2>
        <p className="text-violet-100/80 text-base">
          Personalizaremos tu experiencia de eventos
        </p>
      </div>

      {/* Interests grid */}
      <div
        className="grid grid-cols-3 gap-3 animate-in fade-in slide-in-from-bottom-6 duration-700"
        style={{ animationDelay: "100ms" }}
      >
        {INTERESTS.map((interest, index) => {
          const isSelected = data.interests?.includes(interest.id);
          return (
            <button
              key={interest.id}
              onClick={() => toggleInterest(interest.id)}
              className={`relative aspect-square rounded-3xl transition-all duration-300 transform active:scale-95 overflow-hidden ${
                isSelected ? "ring-4 ring-white/40 scale-105" : "hover:scale-102"
              }`}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              {/* Background gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${interest.gradient} ${
                  isSelected ? "opacity-100" : "opacity-40"
                } transition-opacity duration-300`}
              />

              {/* Glass overlay */}
              <div
                className={`absolute inset-0 ${
                  isSelected ? "bg-transparent" : "bg-black/30"
                } transition-colors duration-300`}
              />

              {/* Content */}
              <div className="relative h-full flex flex-col items-center justify-center gap-2">
                <span className="text-4xl">{interest.icon}</span>
                <span
                  className={`font-medium text-sm ${
                    isSelected ? "text-white" : "text-white/70"
                  }`}
                >
                  {interest.label}
                </span>
              </div>

              {/* Check indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center animate-in zoom-in duration-200">
                  <Check className="w-4 h-4 text-violet-600" />
                </div>
              )}
            </button>
          );
        })}
      </div>

    </div>
  );
}

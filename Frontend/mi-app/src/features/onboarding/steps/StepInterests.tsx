import { Check } from "lucide-react";
import type { OnboardingData } from "../Onboarding";
import React from "react";
import { INTERESTS } from "../../../constants/interests";

interface InterestsStepProps {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
}

export default function InterestsStep({
  data,
  setData,
}: InterestsStepProps) {
  const toggleInterest = (id: string) => {
    const current = data.interests || [];
    const updated = current.includes(id)
      ? current.filter((i) => i !== id)
      : [...current, id];

    setData({ ...data, interests: updated });
  };

  return (
    <div className="space-y-10 ">
      {/* Interests grid */}
      <div
        className="grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700"
        style={{ animationDelay: "100ms" }}
      >
        {INTERESTS.map((interest, index) => {
          const isSelected = data.interests?.includes(interest.id);
          return (
            <button
              key={interest.id}
              onClick={() => toggleInterest(interest.id)}
              className={`relative aspect-square rounded-3xl transition-all duration-300 active:scale-[0.98] overflow-hidden ${
                isSelected
                  ? "shadow-[0_0_0_2px_rgba(255,255,255,0.55),0_8px_24px_-4px_rgba(0,0,0,0.45)] z-[1]"
                  : "ring-1 ring-white/10 hover:ring-white/20 hover:brightness-110"
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
              <div className="relative flex h-full flex-col items-center justify-center gap-1 px-1 py-2">
                <span className="text-3xl leading-none sm:text-[2rem]">{interest.icon}</span>
                <span
                  className={`text-center font-medium text-xs leading-tight sm:text-sm ${
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

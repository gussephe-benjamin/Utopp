import { Check } from "lucide-react";
import type { OnboardingData } from "../Onboarding";
import React from "react";

interface InterestsStepProps {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
  minSelected?: number; // mínimo de intereses a seleccionar
}

const INTERESTS = [
  { id: "academic", label: "Académico", icon: "📚", gradient: "from-blue-500 to-indigo-500" },
  { id: "tech", label: "Tecnología", icon: "💻", gradient: "from-cyan-500 to-blue-500" },
  { id: "entrepreneurship", label: "Emprendimiento", icon: "🚀", gradient: "from-purple-500 to-violet-500" },
  { id: "exchanges", label: "Intercambios", icon: "🌍", gradient: "from-teal-500 to-cyan-500" },
  { id: "competitions", label: "Competencias", icon: "🏆", gradient: "from-amber-500 to-orange-500" },
  { id: "cultural", label: "Cultural", icon: "🎭", gradient: "from-orange-500 to-amber-500" },
  { id: "music", label: "Música", icon: "🎵", gradient: "from-violet-500 to-fuchsia-500" },
  { id: "sports", label: "Deportes", icon: "⚽", gradient: "from-green-500 to-emerald-500" },
  { id: "volunteering", label: "Voluntariado", icon: "🤝", gradient: "from-emerald-500 to-teal-500" },
  { id: "gaming", label: "Gaming", icon: "🎮", gradient: "from-indigo-500 to-purple-500" },
];

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
        <h1 className="text-3xl font-bold text-black mb-2">
          Elige{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
            {remaining > 0 ? `${remaining} o más` : "tus"}
          </span>{" "}
          intereses
        </h1>
        <h2 className="text-2xl font-bold text-black mb-3">favoritos</h2>
        <p className="text-black text-base">
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

      {/* Counter */}
      <div
        className={`text-center py-4 animate-in fade-in duration-300 ${
          selectedCount > 0 ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
          <span className="text-black font-medium">
            {selectedCount}{" "}
            {selectedCount === 1
              ? "interés seleccionado"
              : "intereses seleccionados"}
          </span>
          {selectedCount >= minSelected && <span className="text-fuchsia-400 font-semibold">✓</span>}
        </div>
      </div>
    </div>
  );
}

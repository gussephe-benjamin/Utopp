import { Check } from "lucide-react";

const steps = [1, 2, 3, 4, 5];

/** Solid fill so the track line does not show through inactive step dots */
const INACTIVE_DOT_BG = "bg-[#220C49]";

export default function StepBar({ step }: { step: number }) {
  return (
    <div className="relative mx-auto mb-2 max-w-md">
      {/* Línea base continua */}
      <div className="absolute top-1/2 left-0 right-0 z-0 h-1 -translate-y-1/2 rounded-full bg-white/15" />

      {/* Línea completada */}
      <div
        className="absolute top-1/2 z-0 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 transition-all duration-300"
        style={{
          left: "0",
          right: `${100 - ((step - 1) / (steps.length - 1)) * 100}%`,
        }}
      />

      {/* Círculos */}
      <div className="relative z-10 flex items-center justify-between">
        {steps.map((s) => {
          const isActive = s === step;
          const isCompleted = s < step;
          const isFuture = s > step;

          return (
            <div
              key={s}
              className={`flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300
                ${
                  isActive
                    ? "scale-110 bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/50 ring-2 ring-white/20"
                    : isCompleted
                      ? "bg-gradient-to-r from-violet-400 to-fuchsia-400 shadow-md shadow-violet-500/30"
                      : `${INACTIVE_DOT_BG} border border-white/25 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]`
                }`}
            >
              {isCompleted ? (
                <Check className="h-3 w-3 text-white" />
              ) : (
                <span
                  className={`text-xs font-semibold ${
                    isActive ? "text-white" : isFuture ? "text-white/70" : "text-white/60"
                  }`}
                >
                  {s}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

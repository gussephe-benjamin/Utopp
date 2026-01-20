import { Check } from "lucide-react";

const steps = [1, 2, 3, 4];

export default function StepBar({ step }: { step: number }) {
  return (
    <div className="max-w-md mx-auto relative mb-6">
      {/* Línea base continua */}
      <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/20 -translate-y-1/2 z-0 rounded-full" />

      {/* Línea completada */}
      <div
        className="absolute top-1/2 h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 -translate-y-1/2 z-0 rounded-full transition-all duration-300"
        style={{
          left: '0',
          right: `${100 - ((step - 1) / (steps.length - 1)) * 100}%`,
        }}
      />

      {/* Círculos */}
      <div className="flex justify-between items-center relative z-10">
        {steps.map((s) => {
          const isActive = s === step;
          const isCompleted = s < step;

          return (
            <div
              key={s}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300
                ${isActive
                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 scale-110 shadow-lg shadow-violet-500/40'
                  : isCompleted
                  ? 'bg-gradient-to-r from-violet-400 to-fuchsia-400'
                  : 'bg-white/10'
                }`}
            >
              {isCompleted ? (
                <Check className="w-3 h-3 text-white" />
              ) : (
                <span className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-white/60'}`}>{s}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

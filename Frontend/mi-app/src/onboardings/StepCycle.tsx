import React from "react";

interface StepCycleProps {
  data: {
    career: string;
    cycle: number | null;
  };
  setData: React.Dispatch<
    React.SetStateAction<{
      career: string;
      cycle: number | null;
      interests: string[];
      availability: number;
    }>
  >;
}

const cycles = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function StepCycle({ data, setData }: StepCycleProps) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-lg font-semibold text-black">
        ¿En qué ciclo te encuentras?
      </h2>

      <p className="text-Black text-sm">
        Esto nos ayudará a recomendarte contenidos adecuados a tu nivel.
      </p>

      <div className="flex flex-wrap gap-3">
        {cycles.map((cycle) => {
          const isSelected = data.cycle === cycle;

          return (
            <button
              key={cycle}
              onClick={() =>
                setData((prev) => ({
                  ...prev,
                  cycle,
                }))
              }
              className={`w-14 h-14 rounded-2xl font-semibold text-lg transition-all duration-300 transform active:scale-95
                ${
                  isSelected
                    ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30"
                    : "bg-white/10 text-black hover:bg-white/15 border border-gray-300 shadow-sm active:translate-y-[1px] active:shadow-none"
                }`}
            >
              {cycle}
            </button>
          );
        })}
      </div>
    </div>
  );
}

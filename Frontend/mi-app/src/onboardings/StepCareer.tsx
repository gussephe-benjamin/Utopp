// import { useState } from 'react';
import { Check } from 'lucide-react';
import type { OnboardingData } from './OnboardingData';

interface CareerStepProps {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
}

const careers = [
  { id: 'software', label: 'Ingeniería de Software', icon: '💻' },
  { id: 'industrial', label: 'Ingeniería Industrial', icon: '🏭' },
  { id: 'mecanica', label: 'Ingeniería Mecánica', icon: '⚙️' },
  { id: 'electronica', label: 'Ingeniería Electrónica', icon: '🔌' },
  { id: 'civil', label: 'Ingeniería Civil', icon: '🏗️' },
  { id: 'datos', label: 'Ciencia de Datos', icon: '📊' },
  { id: 'administracion', label: 'Administración', icon: '📈' },
];

// const cycles = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

export default function CareerStep({ data, setData }: CareerStepProps) {
  return (
    <div className="space-y-8">
      {/* Title section */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-3xl font-bold text-black mb-2">
          Hola <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">estudiante</span>,
        </h1>
        <h2 className="text-2xl font-bold text-black mb-3">¡cuéntanos de ti!</h2>
        <p className="text-black text-base">¿Qué carrera estudias actualmente?</p>
      </div>

      {/* Career selection */}
      <div className="space-y-3 animate-in fade-in slide-in-from-bottom-6 duration-700">
        {careers.map((career, index) => {
          const isSelected = data.career === career.label;
          return (
            <button
              key={career.id}
              onClick={() => setData({ ...data, career: career.label })}
              className={`w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all duration-300 transform active:scale-[0.98] ${
                isSelected
                  ? 'border-violet-500 bg-violet-500/20 shadow-lg shadow-violet-500/20'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="text-2xl">{career.icon}</span>
              <span className={`font-medium flex-1 ${isSelected ? 'text-black' : 'text-gray-600'}`}>
                {career.label}
              </span>
              {isSelected && (
                <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center animate-in zoom-in duration-200">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Cycle selection */}
      {/* {data.career && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <p className="text-white/60 text-base">¿En qué ciclo te encuentras?</p>
          <div className="flex flex-wrap gap-3">
            {cycles.map((cycle) => {
              const isSelected = data.cycle === cycle;
              return (
                <button
                  key={cycle}
                  onClick={() => setData({ ...data, cycle })}
                  className={`w-14 h-14 rounded-2xl font-semibold text-lg flex items-center justify-center transition-all duration-300 transform active:scale-95 ${
                    isSelected
                      ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30'
                      : 'bg-white/10 text-white/70 hover:bg-white/15 border border-white/10'
                  }`}
                >
                  {cycle}
                </button>
              );
            })}
          </div>
        </div>
      )} */}
    </div>
  );
}

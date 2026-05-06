// import { useState } from 'react';
import { Check } from 'lucide-react';
import type { OnboardingData } from '../Onboarding';

interface CareerStepProps {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
}

const faculties = [
  {
    id: 'negocios',
    label: 'Facultad de Negocios',
    accent: 'from-amber-400 to-orange-400',
    ring: 'ring-amber-400/40',
    selected: 'border-amber-400 bg-amber-400/10 shadow-amber-400/20',
    badge: 'bg-amber-100 text-amber-700',
    careers: [
      { id: 'admin_digital',      label: 'Administración y Negocios Digitales', icon: '📱' },
      { id: 'business_analytics', label: 'Business Analytics ✦ Nuevo',          icon: '📊' },
    ],
  },
  {
    id: 'computacion',
    label: 'Facultad de Computación',
    accent: 'from-violet-400 to-fuchsia-400',
    ring: 'ring-violet-400/40',
    selected: 'border-violet-500 bg-violet-500/10 shadow-violet-500/20',
    badge: 'bg-violet-100 text-violet-700',
    careers: [
      { id: 'ciberseguridad',   label: 'Ciberseguridad ✦ Nuevo',                     icon: '🔐' },
      { id: 'ciencia_datos_ia', label: 'Ciencia de Datos e Inteligencia Artificial', icon: '🤖' },
      { id: 'ciencia_computacion', label: 'Ciencia de la Computación',              icon: '💻' },
      { id: 'sistemas_info',    label: 'Sistemas de Información',                    icon: '🗂️' },
    ],
  },
  {
    id: 'ingenieria',
    label: 'Facultad de Ingeniería',
    accent: 'from-cyan-400 to-blue-400',
    ring: 'ring-cyan-400/40',
    selected: 'border-cyan-500 bg-cyan-500/10 shadow-cyan-500/20',
    badge: 'bg-cyan-100 text-cyan-700',
    careers: [
      { id: 'bioingenieria', label: 'Bioingeniería',             icon: '🧬' },
      { id: 'ambiental',     label: 'Ingeniería Ambiental',      icon: '🌱' },
      { id: 'civil',         label: 'Ingeniería Civil',           icon: '🏗️' },
      { id: 'energia',       label: 'Ingeniería de la Energía',  icon: '⚡' },
      { id: 'electronica',   label: 'Ingeniería Electrónica',    icon: '🔌' },
      { id: 'industrial',    label: 'Ingeniería Industrial',     icon: '🏭' },
      { id: 'mecatronica',   label: 'Ingeniería Mecatrónica',    icon: '�' },
      { id: 'mecanica',      label: 'Ingeniería Mecánica',       icon: '⚙️' },
      { id: 'quimica',       label: 'Ingeniería Química',        icon: '⚗️' },
    ],
  },
];

// const cycles = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

export default function CareerStep({ data, setData }: CareerStepProps) {
  const normalizeCareerLabel = (label: string): string =>
    label.replace(/\s*✦\s*Nuevo$/u, '').trim();

  return (
    <div className="space-y-6">
      {/* Title section */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ">
        <h1 className="text-3xl font-bold text-white mb-2">
          Hola <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">estudiante</span>,
        </h1>
        <h2 className="text-2xl font-bold text-violet-50 mb-3">¡cuéntanos de ti!</h2>
        <p className="text-violet-100/80 text-base">¿Qué carrera estudias actualmente?</p>
      </div>

      {/* Faculties in vertical layout */}
      <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
        {faculties.map((faculty) => (
          <div key={faculty.id} className="flex flex-col gap-2">

            {/* Faculty header */}
            <div className={`text-center py-2 px-3 rounded-xl bg-gradient-to-r ${faculty.accent} mb-1`}>
              <span className="text-white text-xs font-bold leading-tight block">{faculty.label}</span>
            </div>

            {/* Career cards — vertical stack */}
            {faculty.careers.map((career, index) => {
              const careerValue = normalizeCareerLabel(career.label);
              const isSelected = data.career === careerValue;

              return (
                <button
                  key={career.id}
                  onClick={() => setData({ ...data, career: careerValue })}
                  className={`w-full p-3 rounded-xl border-2 text-left flex items-start gap-2 transition-all duration-300 transform active:scale-[0.97] shadow-sm ${
                    isSelected
                      ? `${faculty.selected} shadow-lg`
                      : 'border-white/15 bg-white/5 hover:border-white/25 hover:bg-white/10'
                  }`}
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <span className="text-lg leading-none mt-0.5 shrink-0">{career.icon}</span>
                  <span className={`text-xs font-medium leading-snug flex-1 ${isSelected ? 'text-violet-50' : 'text-violet-100/80'}`}>
                    {career.label}
                  </span>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0 animate-in zoom-in duration-200">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
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

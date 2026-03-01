import { Check, Clock, Zap, Coffee, Briefcase, Target } from 'lucide-react';
import type { OnboardingData } from '../Onboarding';
import React from 'react';


interface AvailabilityStepProps {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
}

const hoursOptions = [
  { id: 0, hours: '1-3', label: 'Poco tiempo', description: 'Solo lo esencial', icon: Coffee, gradient: 'from-slate-500 to-gray-500', emoji: '☕' },
  { id: 1, hours: '4-6', label: 'Moderado', description: 'Balance perfecto', icon: Target, gradient: 'from-cyan-500 to-blue-500', emoji: '⚖️' },
  { id: 2, hours: '7-10', label: 'Disponible', description: 'Tiempo para explorar', icon: Zap, gradient: 'from-violet-500 to-fuchsia-500', emoji: '⚡' },
  { id: 3, hours: '11-15', label: 'Muy flexible', description: 'Abierto a todo', icon: Briefcase, gradient: 'from-amber-500 to-orange-500', emoji: '🚀' },
  { id: 4, hours: '15+', label: 'Máxima disponibilidad', description: '¡Aprovecha al máximo!', icon: Clock, gradient: 'from-emerald-500 to-teal-500', emoji: '🌟' },
];

export default function AvailabilityStep({ data, setData }: AvailabilityStepProps) {
  
  // seleccion actual
  const selectedOption = data.availability;

  const selectHours = (optionId: number) => {
    setData({ ...data, availability: optionId });
  };

  return (
    <div className="space-y-7">
      {/* Título */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-3xl font-bold text-black mb-2">
          ¿Cuántas horas <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">libres</span> tienes?
        </h1>
        <p className="text-black text-base">A la semana, aproximadamente</p>
      </div>

      {/* Ilustración
      <div className="flex justify-center py-4 animate-in fade-in zoom-in duration-700">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 flex items-center justify-center animate-pulse">
            <Clock className="w-12 h-12 text-violet-400" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-fuchsia-500/40">?</div>
        </div>
      </div> */}

      {/* Opciones */}
      <div className="space-y-3 animate-in fade-in slide-in-from-bottom-6 duration-700">
        {hoursOptions.map((option, index) => {
          const isSelected = selectedOption === option.id;
          return (
            <button
              key={option.id}
              onClick={() => selectHours(option.id)}
              className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 transform active:scale-[0.98] ${
                isSelected
                  ? `bg-gradient-to-r ${option.gradient} shadow-lg shadow-violet-500/20`
                  : 'bg-white/5 hover:bg-white/10 border border-white/10'
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Emoji/Icono */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isSelected ? 'bg-white/20' : 'bg-white/10'}`}>
                {option.emoji}
              </div>

              {/* Contenido */}
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <p className={`font-semibold ${isSelected ? 'text-white' : 'text-black'}`}>{option.label}</p>
                  <span className={`text-sm px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-white/10 text-black'}`}>
                    {option.hours}h
                  </span>
                </div>
                <p className={`text-sm ${isSelected ? 'text-white/80' : 'text-black'}`}>{option.description}</p>
              </div>

              {/* Check */}
              {isSelected && (
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center animate-in zoom-in duration-200">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Texto auxiliar */}
      <div className="text-center pt-2 animate-in fade-in duration-500">
        <p className="text-black text-sm">
          Esto nos ayuda a recomendarte la cantidad ideal de eventos
        </p>
      </div>
    </div>
  );
}

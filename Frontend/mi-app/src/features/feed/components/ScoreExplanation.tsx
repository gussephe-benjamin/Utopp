import { useState } from "react";
import { Info } from "lucide-react";

const SCORE_FACTORS = [
  { name: "Intereses", pct: 40 },
  { name: "Proximidad social", pct: 25 },
  { name: "Recencia", pct: 20 },
  { name: "Ciclo académico", pct: 10 },
  { name: "Disponibilidad", pct: 5 },
] as const;

/** Popover explicando factores del score de relevancia */
export function ScoreExplanation({ score }: { score?: number }) {
  const [show, setShow] = useState(false);
  if (!score) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        title="¿Por qué te recomendamos esto?"
      >
        <Info className="w-4 h-4 text-gray-400" />
      </button>
      {show && (
        <div className="absolute top-full right-0 w-72 bg-white rounded-lg shadow-lg p-4 z-50 border border-gray-200">
          <h4 className="font-semibold mb-3 text-gray-900 text-sm">¿Por qué te lo recomendamos?</h4>
          <div className="space-y-2">
            {SCORE_FACTORS.map((f) => (
              <div key={f.name} className="flex justify-between items-center">
                <span className="text-xs text-gray-700">{f.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-1.5">
                    <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${f.pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-400">{f.pct}%</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between text-xs">
            <span className="text-gray-500">Score total</span>
            <span className="font-bold text-purple-600">{score.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

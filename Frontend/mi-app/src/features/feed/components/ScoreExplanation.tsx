import { useState } from "react";
import { Info } from "lucide-react";

/** Etiquetas legibles para los factores que devuelve `score_breakdown` del backend. */
const FACTOR_LABELS: Record<string, string> = {
  interest_overlap: "Intereses",
  social_proximity: "Proximidad social",
  recency: "Recencia",
  engagement: "Interacción",
  urgency: "Urgencia",
  availability_match: "Disponibilidad",
};

// Reservado en el backend (peso 0 en todos los perfiles): no hay campo
// estructurado de fecha/hora de evento para calcularlo todavía.
const HIDDEN_FACTORS = new Set(["availability_match"]);

type ScoreExplanationProps = {
  /** Score total del post (suma del breakdown). Ausente para posts pineados. */
  score?: number;
  /** Desglose feature × peso efectivo por factor, tal como lo devuelve el backend. */
  breakdown?: Record<string, number>;
};

/** Popover explicando los factores reales del score de relevancia (sort=recommended). */
export function ScoreExplanation({ score, breakdown }: ScoreExplanationProps) {
  const [show, setShow] = useState(false);
  if (score == null || !breakdown) return null;

  const total = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
  const factors = Object.entries(breakdown)
    .filter(([key]) => !HIDDEN_FACTORS.has(key))
    .map(([key, value]) => ({
      key,
      label: FACTOR_LABELS[key] ?? key,
      pct: total > 0 ? (value / total) * 100 : 0,
    }))
    .sort((a, b) => b.pct - a.pct);

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
            {factors.map((f) => (
              <div key={f.key} className="flex justify-between items-center">
                <span className="text-xs text-gray-700">{f.label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-1.5">
                    <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, f.pct)}%` }} />
                  </div>
                  <span className="text-xs text-gray-400">{f.pct.toFixed(0)}%</span>
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

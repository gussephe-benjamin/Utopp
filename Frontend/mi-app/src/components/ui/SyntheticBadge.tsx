import { Sparkles } from "lucide-react";

export function SyntheticBadge() {
  return (
    <div
      className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700"
      title="Datos simulados (Synthetic Data)"
    >
      <Sparkles className="h-3 w-3" />
      <span>Data Sintética</span>
    </div>
  );
}

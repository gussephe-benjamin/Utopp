import type { Dispatch, SetStateAction } from "react";
import { INTERESTS } from "../../../constants/interests";
import { TW_UTOPP_GRADIENT_R } from "../../../shared/constants/brand";

type FeedHorizontalFiltersProps = {
  statusFilter: string | undefined;
  setStatusFilter: (v: string | undefined) => void;
  sortOrder: "urgency" | "recent";
  setSortOrder: (v: "urgency" | "recent") => void;
  selectedTags: string[];
  setSelectedTags: Dispatch<SetStateAction<string[]>>;
};

export function FeedHorizontalFilters({
  statusFilter,
  setStatusFilter,
  sortOrder,
  setSortOrder,
  selectedTags,
  setSelectedTags,
}: FeedHorizontalFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Row 1: Status and Sort */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {(
          [
            { value: undefined, label: "Todas" },
            { value: "vigente", label: "Vigentes" },
            { value: "vencida", label: "Vencidas" },
          ] as const
        ).map((opt) => {
          const active = opt.value === undefined ? statusFilter === undefined : statusFilter === opt.value;
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => {
                if (opt.value === undefined) setStatusFilter(undefined);
                else setStatusFilter(statusFilter === opt.value ? undefined : opt.value);
              }}
              className={`shrink-0 px-5 py-1.5 text-sm font-semibold rounded-full border transition-all ${
                active
                  ? `${TW_UTOPP_GRADIENT_R} text-white border-transparent shadow-sm`
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          );
        })}

        {/* Separator */}
        <div className="w-px h-6 bg-gray-200 mx-1 shrink-0" />

        {(
          [
            { value: "urgency" as const, label: "⌛ Urgencia" },
            { value: "recent" as const, label: "🕐 Recientes" },
          ] as const
        ).map((opt) => {
          const active = sortOrder === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSortOrder(opt.value)}
              className={`shrink-0 px-5 py-1.5 text-sm font-semibold rounded-full border transition-all ${
                active
                  ? `${TW_UTOPP_GRADIENT_R} text-white border-transparent shadow-sm`
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Row 2: Categories */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {INTERESTS.map((interest) => {
          const active = selectedTags.includes(interest.id);
          return (
            <button
              key={interest.id}
              type="button"
              onClick={() =>
                setSelectedTags((prev) =>
                  active ? prev.filter((t) => t !== interest.id) : [...prev, interest.id],
                )
              }
              className={`shrink-0 px-4 py-1.5 text-[13px] font-medium rounded-full border transition-all ${
                active
                  ? `${TW_UTOPP_GRADIENT_R} text-white border-transparent shadow-sm`
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {interest.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

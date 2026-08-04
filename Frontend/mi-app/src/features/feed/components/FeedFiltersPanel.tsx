import { Clock, Sparkles, Timer } from "lucide-react"
import { INTERESTS } from "../../../constants/interests"
import { TW_AUTH_FOOTER_LINK, TW_UTOPP_GRADIENT_R } from "../../../shared/constants/brand"
import type { FeedFiltersPanelProps } from "../types"

export function FeedFiltersPanel({
  statusFilter,
  setStatusFilter,
  sortOrder,
  setSortOrder,
  selectedTags,
  setSelectedTags,
}: FeedFiltersPanelProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-0">
        <div className="flex w-full flex-wrap items-center justify-center gap-2 px-1 py-0.5">
          {(
            [
              { value: undefined as undefined, label: "Todas" },
              { value: "vigente" as const, label: "Vigentes" },
              { value: "vencida" as const, label: "Vencidas" },
            ] as const
          ).map((opt) => {
            const active =
              opt.value === undefined ? statusFilter === undefined : statusFilter === opt.value
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => {
                  if (opt.value === undefined) setStatusFilter(undefined)
                  else setStatusFilter(statusFilter === opt.value ? undefined : opt.value)
                }}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? `${TW_UTOPP_GRADIENT_R} border-transparent text-white shadow-sm`
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>

        <div className="flex justify-center px-4 py-2" aria-hidden>
          <div className="h-px w-full max-w-[14rem] bg-gradient-to-r from-transparent via-violet-200/85 to-transparent" />
        </div>

        <div className="flex w-full flex-wrap items-center justify-center gap-2 px-1 py-0.5">
          {(
            [
              { value: "recent" as const, label: "Recientes", Icon: Clock },
              { value: "urgency" as const, label: "Urgencia", Icon: Timer },
              { value: "recommended" as const, label: "Para ti", Icon: Sparkles },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSortOrder(opt.value)}
              className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                sortOrder === opt.value
                  ? `${TW_UTOPP_GRADIENT_R} border-transparent text-white shadow-sm`
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <opt.Icon className="h-3 w-3 shrink-0" />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {selectedTags.length > 0 && (
        <div className="rounded-xl border border-violet-100 bg-white/70 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-gray-500">Filtros seleccionados</p>
            <button
              type="button"
              onClick={() => setSelectedTags([])}
              className={`text-xs font-semibold ${TW_AUTH_FOOTER_LINK} underline-offset-2`}
            >
              Limpiar
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedTags.map((tagId) => {
              const info = INTERESTS.find((x) => x.id === tagId)
              if (!info) return null
              const InfoIcon = info.icon
              return (
                <button
                  key={tagId}
                  type="button"
                  onClick={() => setSelectedTags((prev) => prev.filter((t) => t !== tagId))}
                  className={`flex items-center gap-1 rounded-full border border-transparent px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all ${TW_UTOPP_GRADIENT_R}`}
                  title="Quitar filtro"
                >
                  <InfoIcon className="h-3 w-3 shrink-0" />
                  {info.label}
                  <span className="ml-1 opacity-90">x</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-3">
        <p className="mb-2 text-xs font-semibold text-gray-500">Categorias</p>
        <div className="flex flex-wrap gap-1.5">
          {INTERESTS.map((interest) => {
            const active = selectedTags.includes(interest.id)
            const IconComponent = interest.icon
            return (
              <button
                key={interest.id}
                type="button"
                onClick={() =>
                  setSelectedTags((prev) =>
                    active ? prev.filter((t) => t !== interest.id) : [...prev, interest.id],
                  )
                }
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                  active
                    ? `${TW_UTOPP_GRADIENT_R} border-transparent text-white shadow-sm`
                    : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <IconComponent className="h-3.5 w-3.5 shrink-0" />
                {interest.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

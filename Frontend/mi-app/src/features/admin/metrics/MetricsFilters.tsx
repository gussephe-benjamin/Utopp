import type { DatePreset } from "./metricsUtils"

interface OrgOption {
  id: number
  name: string
}

interface Props {
  preset: DatePreset
  onPresetChange: (p: DatePreset) => void
  customFrom: string
  customTo: string
  onCustomFromChange: (v: string) => void
  onCustomToChange: (v: string) => void
  organizationId: number | ""
  onOrganizationChange: (v: number | "") => void
  organizations: OrgOption[]
  status: string
  onStatusChange: (v: string) => void
  groupBy: "day" | "week" | "month"
  onGroupByChange: (v: "day" | "week" | "month") => void
}

export function MetricsFilters({
  preset,
  onPresetChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
  organizationId,
  onOrganizationChange,
  organizations,
  status,
  onStatusChange,
  groupBy,
  onGroupByChange,
}: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["today", "Hoy"],
            ["last7", "Últimos 7 días"],
            ["last30", "Últimos 30 días"],
            ["thisMonth", "Este mes"],
            ["prevMonth", "Mes anterior"],
            ["custom", "Personalizado"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => onPresetChange(key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              preset === key
                ? "bg-violet-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {preset === "custom" ? (
        <div className="flex flex-wrap gap-3">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => onCustomFromChange(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
          />
          <input
            type="date"
            value={customTo}
            onChange={(e) => onCustomToChange(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
          />
        </div>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <select
          value={organizationId === "" ? "" : String(organizationId)}
          onChange={(e) =>
            onOrganizationChange(e.target.value ? Number(e.target.value) : "")
          }
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
        >
          <option value="">Todas las organizaciones</option>
          {organizations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="muy_activo">Muy activo</option>
          <option value="activo">Activo</option>
          <option value="uso_moderado">Uso moderado</option>
          <option value="bajo_uso">Bajo uso</option>
          <option value="riesgo_abandono">Riesgo de abandono</option>
          <option value="inactivo">Inactivo</option>
        </select>
        <select
          value={groupBy}
          onChange={(e) => onGroupByChange(e.target.value as "day" | "week" | "month")}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
        >
          <option value="day">Por día</option>
          <option value="week">Por semana</option>
          <option value="month">Por mes</option>
        </select>
      </div>
    </div>
  )
}

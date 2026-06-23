export type DatePreset =
  | "today"
  | "last7"
  | "last30"
  | "thisMonth"
  | "prevMonth"
  | "custom"

export interface DateRange {
  from: string
  to: string
  preset: DatePreset
}

export function toIsoDate(d: Date): string {
  return d.toISOString()
}

export function getDateRange(preset: DatePreset, customFrom?: string, customTo?: string): DateRange {
  const now = new Date()
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  let start = new Date(now)
  start.setHours(0, 0, 0, 0)

  if (preset === "last7") {
    start.setDate(start.getDate() - 6)
  } else if (preset === "last30") {
    start.setDate(start.getDate() - 29)
  } else if (preset === "thisMonth") {
    start = new Date(now.getFullYear(), now.getMonth(), 1)
  } else if (preset === "prevMonth") {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    end.setTime(new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime())
  } else if (preset === "custom" && customFrom && customTo) {
    return {
      preset,
      from: new Date(customFrom).toISOString(),
      to: new Date(customTo + "T23:59:59").toISOString(),
    }
  }

  return { preset, from: start.toISOString(), to: end.toISOString() }
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return rm > 0 ? `${h}h ${rm}m` : `${h}h`
}

export const STATUS_BADGE: Record<string, string> = {
  "Muy activo": "bg-emerald-100 text-emerald-800",
  Activo: "bg-blue-100 text-blue-800",
  "Uso moderado": "bg-yellow-100 text-yellow-800",
  "Bajo uso": "bg-orange-100 text-orange-800",
  "Riesgo de abandono": "bg-red-100 text-red-800",
  Inactivo: "bg-gray-100 text-gray-600",
}

export const RISK_BADGE: Record<string, string> = {
  Bajo: "bg-yellow-100 text-yellow-800",
  Medio: "bg-orange-100 text-orange-800",
  Crítico: "bg-red-100 text-red-800",
}

import type { LucideIcon } from "lucide-react"

interface Props {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: { percent: number; direction: string } | null
  trendLabel?: string
}

export function MetricsKpiCard({ title, value, icon: Icon, trend, trendLabel }: Props) {
  const trendColor =
    trend?.direction === "up"
      ? "text-emerald-600"
      : trend?.direction === "down"
        ? "text-red-600"
        : "text-gray-500"

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-extrabold text-gray-900">{value}</p>
      {trend && trendLabel ? (
        <p className={`mt-1 text-xs font-medium ${trendColor}`}>
          {trend.direction === "up" ? "+" : trend.direction === "down" ? "" : ""}
          {trend.percent}% {trendLabel}
        </p>
      ) : null}
    </div>
  )
}

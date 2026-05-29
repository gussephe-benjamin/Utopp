import type { ReactNode } from "react"

export interface ProfileMetricCardProps {
  label?: string
  value?: string
  subValue?: string
  icon?: ReactNode
  iconBg?: string
  textColor?: string
  grayPlaceholder?: boolean
  placeholderText?: string
}

/**
 * Tarjeta de métrica de perfil (estilo alumno público): icono, borde suave y sombra al hover.
 */
export function ProfileMetricCard({
  label,
  value,
  subValue,
  icon,
  iconBg = "bg-violet-50",
  textColor = "text-violet-700",
  grayPlaceholder,
  placeholderText,
}: ProfileMetricCardProps) {
  if (grayPlaceholder) {
    return (
      <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-gray-200 bg-gray-50 p-4 text-center shadow-[0_4px_20px_rgba(0,0,0,0.005)]">
        <span className="text-xs font-bold leading-snug text-gray-400">{placeholderText}</span>
      </div>
    )
  }

  return (
    <div className="flex min-h-[120px] flex-col items-start justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.005)] transition-shadow duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
      <div className={`mb-2 rounded-lg p-1.5 ${iconBg}`}>{icon}</div>
      <div className="flex w-full flex-1 flex-col justify-end">
        <span className="mb-1 text-[9px] font-bold uppercase leading-none tracking-wider text-gray-400">
          {label}
        </span>
        <span className={`max-w-full break-words text-sm font-black leading-tight md:text-base ${textColor}`}>
          {value}
        </span>
        {subValue ? (
          <span className="mt-1 text-[9px] font-semibold leading-none text-gray-400">{subValue}</span>
        ) : null}
      </div>
    </div>
  )
}

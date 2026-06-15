import { Check, Scale, Zap, Coffee, Rocket, Star } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { AVAILABILITY_OPTIONS } from "../../constants/profileOptions"

export type SettingsVariant = "onboarding" | "profile"

const HOURS_META: Record<
  number,
  { hours: string; icon: LucideIcon; gradient: string }
> = {
  0: { hours: "1-3", icon: Coffee, gradient: "from-slate-500 to-gray-500" },
  1: { hours: "4-6", icon: Scale, gradient: "from-cyan-500 to-blue-500" },
  2: { hours: "7-10", icon: Zap, gradient: "from-violet-500 to-fuchsia-500" },
  3: { hours: "11-15", icon: Rocket, gradient: "from-amber-500 to-orange-500" },
  4: { hours: "15+", icon: Star, gradient: "from-emerald-500 to-teal-500" },
}

interface AvailabilitySelectorProps {
  value: number | null
  onChange: (value: number) => void
  variant?: SettingsVariant
}

export function AvailabilitySelector({
  value,
  onChange,
  variant = "profile",
}: AvailabilitySelectorProps) {
  if (variant === "onboarding") {
    return (
      <div className="space-y-3 animate-in fade-in slide-in-from-bottom-6 duration-700">
        {AVAILABILITY_OPTIONS.map((option, index) => {
          const meta = HOURS_META[option.id]
          const isSelected = value === option.id
          const Icon = meta.icon
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 transform active:scale-[0.98] ${
                isSelected
                  ? `bg-gradient-to-r ${meta.gradient} shadow-lg shadow-violet-500/20`
                  : "bg-white/5 hover:bg-white/10 border border-white/15"
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isSelected ? "bg-white/20" : "bg-white/10"
                }`}
              >
                <Icon className={`w-6 h-6 ${isSelected ? "text-white" : "text-violet-300"}`} />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <p className={`font-semibold ${isSelected ? "text-white" : "text-violet-50"}`}>
                    {option.label}
                  </p>
                  <span
                    className={`text-sm px-2 py-0.5 rounded-full ${
                      isSelected ? "bg-white/20 text-white" : "bg-white/10 text-violet-100"
                    }`}
                  >
                    {meta.hours}h
                  </span>
                </div>
                <p className={`text-sm ${isSelected ? "text-white/80" : "text-violet-100/80"}`}>
                  {option.description}
                </p>
              </div>
              {isSelected && (
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center animate-in zoom-in duration-200">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {AVAILABILITY_OPTIONS.map((option) => {
        const meta = HOURS_META[option.id]
        const isSelected = value === option.id
        const Icon = meta.icon
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`w-full rounded-xl border p-3 flex items-center gap-3 transition-all duration-200 active:scale-[0.98] ${
              isSelected
                ? "border-violet-300 bg-violet-50 ring-1 ring-violet-200"
                : "border-gray-200 bg-gray-50/50 hover:border-violet-200"
            }`}
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                isSelected ? "bg-violet-100" : "bg-white"
              }`}
            >
              <Icon className={`h-5 w-5 ${isSelected ? "text-violet-600" : "text-gray-500"}`} />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${isSelected ? "text-violet-900" : "text-gray-800"}`}>
                  {option.label}
                </span>
                <span className="text-xs text-gray-500">{meta.hours}h</span>
              </div>
              <p className="text-xs text-gray-500">{option.description}</p>
            </div>
            {isSelected && <Check className="h-4 w-4 text-violet-600 shrink-0" />}
          </button>
        )
      })}
    </div>
  )
}

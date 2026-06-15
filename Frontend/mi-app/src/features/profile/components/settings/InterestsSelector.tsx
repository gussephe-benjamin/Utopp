import { Check } from "lucide-react"
import { INTERESTS } from "../../../../constants/interests"

export type SettingsVariant = "onboarding" | "profile"

interface InterestsSelectorProps {
  interests: string[]
  onChange: (interests: string[]) => void
  variant?: SettingsVariant
}

export function InterestsSelector({
  interests,
  onChange,
  variant = "profile",
}: InterestsSelectorProps) {
  const toggleInterest = (id: string) => {
    const updated = interests.includes(id)
      ? interests.filter((item) => item !== id)
      : [...interests, id]
    onChange(updated)
  }

  if (variant === "onboarding") {
    return (
      <div className="grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
        {INTERESTS.map((interest, index) => {
          const isSelected = interests.includes(interest.id)
          const IconComponent = interest.icon
          return (
            <button
              key={interest.id}
              type="button"
              onClick={() => toggleInterest(interest.id)}
              className={`relative aspect-square rounded-3xl transition-all duration-300 active:scale-[0.98] overflow-hidden ${
                isSelected
                  ? "shadow-[0_0_0_2px_rgba(255,255,255,0.55),0_8px_24px_-4px_rgba(0,0,0,0.45)] z-[1]"
                  : "ring-1 ring-white/10 hover:ring-white/20 hover:brightness-110"
              }`}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${interest.gradient} ${
                  isSelected ? "opacity-100" : "opacity-40"
                } transition-opacity duration-300`}
              />
              <div
                className={`absolute inset-0 ${
                  isSelected ? "bg-transparent" : "bg-black/30"
                } transition-colors duration-300`}
              />
              <div className="relative flex h-full flex-col items-center justify-center gap-1 px-1 py-2">
                <IconComponent className="w-8 h-8 sm:w-9 sm:h-9 text-white drop-shadow" />
                <span
                  className={`text-center font-medium text-xs leading-tight sm:text-sm ${
                    isSelected ? "text-white" : "text-white/70"
                  }`}
                >
                  {interest.label}
                </span>
              </div>
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center animate-in zoom-in duration-200">
                  <Check className="w-4 h-4 text-violet-600" />
                </div>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {INTERESTS.map((interest) => {
        const isSelected = interests.includes(interest.id)
        const IconComponent = interest.icon
        return (
          <button
            key={interest.id}
            type="button"
            onClick={() => toggleInterest(interest.id)}
            className={`relative flex flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-3 transition-all duration-200 active:scale-[0.98] ${
              isSelected
                ? "border-violet-300 bg-violet-50 shadow-sm ring-1 ring-violet-200"
                : "border-gray-200 bg-gray-50/50 hover:border-violet-200 hover:bg-violet-50/40"
            }`}
          >
            <IconComponent className={`h-6 w-6 ${isSelected ? "text-violet-600" : "text-gray-500"}`} />
            <span
              className={`text-center text-xs font-semibold leading-tight ${
                isSelected ? "text-violet-800" : "text-gray-600"
              }`}
            >
              {interest.label}
            </span>
            {isSelected && (
              <div className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600">
                <Check className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

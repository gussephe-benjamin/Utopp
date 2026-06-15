import { Check } from "lucide-react"
import {
  TIME_SLOTS,
  WEEK_DAYS,
  clearDaySlots,
  type TimeSlot,
  type WeekDay,
  type WeeklyAvailabilityPayload,
} from "../../../onboarding/lib/weeklyAvailability"

export type SettingsVariant = "onboarding" | "profile"

interface WeeklyScheduleEditorProps {
  weeklyAvailability: WeeklyAvailabilityPayload
  selectedDays: WeekDay[]
  onWeeklyAvailabilityChange: (value: WeeklyAvailabilityPayload) => void
  onSelectedDaysChange: (days: WeekDay[]) => void
  variant?: SettingsVariant
}

export function WeeklyScheduleEditor({
  weeklyAvailability,
  selectedDays,
  onWeeklyAvailabilityChange,
  onSelectedDaysChange,
  variant = "profile",
}: WeeklyScheduleEditorProps) {
  const schedule = weeklyAvailability["disponibilidad a la semana"]
  const selectedDaySet = new Set(selectedDays)
  const isOnboarding = variant === "onboarding"

  const toggleDay = (day: WeekDay) => {
    if (selectedDaySet.has(day)) {
      onSelectedDaysChange(selectedDays.filter((item) => item !== day))
      onWeeklyAvailabilityChange(clearDaySlots(weeklyAvailability, day))
      return
    }
    onSelectedDaysChange([...selectedDays, day])
  }

  const toggleSlot = (day: WeekDay, slot: TimeSlot) => {
    const currentSlots = schedule[day]
    const updatedSlots = currentSlots.includes(slot)
      ? currentSlots.filter((item) => item !== slot)
      : [...currentSlots, slot]

    onWeeklyAvailabilityChange({
      "disponibilidad a la semana": {
        ...schedule,
        [day]: updatedSlots,
      },
    })
  }

  const orderedSelectedDays = WEEK_DAYS.filter(({ id }) => selectedDaySet.has(id))

  const dayButtonClass = (isSelected: boolean) =>
    isOnboarding
      ? isSelected
        ? "border-orange-400/40 bg-orange-500/10 text-orange-100"
        : "border-white/15 bg-white/5 text-violet-50 hover:bg-white/10"
      : isSelected
        ? "border-orange-300 bg-orange-50 text-orange-900"
        : "border-gray-200 bg-gray-50/50 text-gray-700 hover:border-orange-200"

  const slotButtonClass = (isSelected: boolean) =>
    isOnboarding
      ? isSelected
        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20"
        : "border border-white/10 bg-white/5 text-violet-100 hover:bg-white/10"
      : isSelected
        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm"
        : "border border-gray-200 bg-white text-gray-600 hover:border-orange-200"

  const dayCardClass = (hasSlotSelection: boolean) =>
    isOnboarding
      ? hasSlotSelection
        ? "border-orange-400/40 bg-orange-500/10"
        : "border-white/15 bg-white/5"
      : hasSlotSelection
        ? "border-orange-200 bg-orange-50/60"
        : "border-gray-200 bg-gray-50/40"

  return (
    <div className={`space-y-5 ${isOnboarding ? "animate-in fade-in slide-in-from-bottom-6 duration-700" : ""}`}>
      <div>
        <p
          className={`mb-3 text-sm font-medium ${
            isOnboarding ? "text-violet-100/90" : "text-gray-600"
          }`}
        >
          Marca los días en los que estás disponible
        </p>
        <div className="grid grid-cols-3 gap-2">
          {WEEK_DAYS.map((day) => {
            const isSelected = selectedDaySet.has(day.id)
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => toggleDay(day.id)}
                className={`rounded-2xl border px-3 py-3 text-center transition-all duration-300 active:scale-[0.98] ${dayButtonClass(isSelected)}`}
              >
                <span className="text-sm font-semibold">{day.label}</span>
                {isSelected && (
                  <div className="mt-1 flex justify-center">
                    <Check className={`h-3.5 w-3.5 ${isOnboarding ? "text-orange-200" : "text-orange-600"}`} />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {orderedSelectedDays.length > 0 && (
        <div className="space-y-3">
          <p
            className={`text-sm font-medium ${
              isOnboarding ? "text-violet-100/90" : "text-gray-600"
            }`}
          >
            Indica tus horarios disponibles
          </p>
          {orderedSelectedDays.map((day) => {
            const selectedSlots = schedule[day.id]
            const hasSlotSelection = selectedSlots.length > 0

            return (
              <div
                key={day.id}
                className={`rounded-2xl border p-4 transition-all duration-300 ${dayCardClass(hasSlotSelection)}`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className={`font-semibold ${isOnboarding ? "text-violet-50" : "text-gray-900"}`}>
                    {day.label}
                  </p>
                  {hasSlotSelection && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        isOnboarding
                          ? "bg-orange-500/20 text-orange-200"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {selectedSlots.length}{" "}
                      {selectedSlots.length === 1 ? "horario" : "horarios"}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = selectedSlots.includes(slot.id)
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => toggleSlot(day.id, slot.id)}
                        className={`rounded-xl px-2 py-3 text-center transition-all duration-300 active:scale-[0.98] ${slotButtonClass(isSelected)}`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-xs font-semibold">{slot.label}</span>
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <p
                          className={`mt-1 text-[10px] ${
                            isSelected
                              ? isOnboarding
                                ? "text-white/85"
                                : "text-white/90"
                              : isOnboarding
                                ? "text-violet-200/70"
                                : "text-gray-400"
                          }`}
                        >
                          {slot.hours}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

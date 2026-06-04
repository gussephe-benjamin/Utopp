import { Check } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { OnboardingData } from "../Onboarding";
import {
  TIME_SLOTS,
  WEEK_DAYS,
  clearDaySlots,
  type TimeSlot,
  type WeekDay,
} from "../lib/weeklyAvailability";

interface StepWeeklyScheduleProps {
  data: OnboardingData;
  setData: Dispatch<SetStateAction<OnboardingData>>;
  selectedDays: WeekDay[];
  setSelectedDays: Dispatch<SetStateAction<WeekDay[]>>;
}

export default function StepWeeklySchedule({
  data,
  setData,
  selectedDays,
  setSelectedDays,
}: StepWeeklyScheduleProps) {
  const schedule = data.weekly_availability["disponibilidad a la semana"];
  const selectedDaySet = new Set(selectedDays);

  const toggleDay = (day: WeekDay) => {
    if (selectedDaySet.has(day)) {
      setSelectedDays((current) => current.filter((item) => item !== day));
      setData((current) => ({
        ...current,
        weekly_availability: clearDaySlots(current.weekly_availability, day),
      }));
      return;
    }

    setSelectedDays((current) => [...current, day]);
  };

  const toggleSlot = (day: WeekDay, slot: TimeSlot) => {
    const currentSlots = schedule[day];
    const updatedSlots = currentSlots.includes(slot)
      ? currentSlots.filter((item) => item !== slot)
      : [...currentSlots, slot];

    setData((current) => ({
      ...current,
      weekly_availability: {
        "disponibilidad a la semana": {
          ...current.weekly_availability["disponibilidad a la semana"],
          [day]: updatedSlots,
        },
      },
    }));
  };

  const orderedSelectedDays = WEEK_DAYS.filter(({ id }) => selectedDaySet.has(id));

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div>
        <p className="mb-3 text-sm font-medium text-violet-100/90">
          Marca los días en los que estás disponible
        </p>
        <div className="grid grid-cols-3 gap-2">
          {WEEK_DAYS.map((day, index) => {
            const isSelected = selectedDaySet.has(day.id);

            return (
              <button
                key={day.id}
                type="button"
                onClick={() => toggleDay(day.id)}
                className={`rounded-2xl border px-3 py-3 text-center transition-all duration-300 active:scale-[0.98] ${
                  isSelected
                    ? "border-orange-400/40 bg-orange-500/10 text-orange-100"
                    : "border-white/15 bg-white/5 text-violet-50 hover:bg-white/10"
                }`}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <span className="text-sm font-semibold">{day.label}</span>
                {isSelected && (
                  <div className="mt-1 flex justify-center">
                    <Check className="h-3.5 w-3.5 text-orange-200" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {orderedSelectedDays.length > 0 && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <p className="text-sm font-medium text-violet-100/90">
            Indica tus horarios disponibles
          </p>
          {orderedSelectedDays.map((day, index) => {
            const selectedSlots = schedule[day.id];
            const hasSlotSelection = selectedSlots.length > 0;

            return (
              <div
                key={day.id}
                className={`rounded-2xl border p-4 transition-all duration-300 ${
                  hasSlotSelection
                    ? "border-orange-400/40 bg-orange-500/10"
                    : "border-white/15 bg-white/5"
                }`}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold text-violet-50">{day.label}</p>
                  {hasSlotSelection && (
                    <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-xs font-medium text-orange-200">
                      {selectedSlots.length}{" "}
                      {selectedSlots.length === 1 ? "horario" : "horarios"}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = selectedSlots.includes(slot.id);

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => toggleSlot(day.id, slot.id)}
                        className={`rounded-xl px-2 py-3 text-center transition-all duration-300 active:scale-[0.98] ${
                          isSelected
                            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20"
                            : "border border-white/10 bg-white/5 text-violet-100 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-xs font-semibold">{slot.label}</span>
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <p
                          className={`mt-1 text-[10px] ${
                            isSelected ? "text-white/85" : "text-violet-200/70"
                          }`}
                        >
                          {slot.hours}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

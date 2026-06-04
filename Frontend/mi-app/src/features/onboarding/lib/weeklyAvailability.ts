export type TimeSlot = "mañana" | "tarde" | "noche";

export type WeekDay =
  | "lunes"
  | "martes"
  | "miercoles"
  | "jueves"
  | "viernes"
  | "sabado";

export type WeeklyAvailabilityPayload = {
  "disponibilidad a la semana": Record<WeekDay, TimeSlot[]>;
};

export const WEEK_DAYS: { id: WeekDay; label: string }[] = [
  { id: "lunes", label: "Lunes" },
  { id: "martes", label: "Martes" },
  { id: "miercoles", label: "Miércoles" },
  { id: "jueves", label: "Jueves" },
  { id: "viernes", label: "Viernes" },
  { id: "sabado", label: "Sábado" },
];

export const TIME_SLOTS: { id: TimeSlot; label: string; hours: string }[] = [
  { id: "mañana", label: "Mañana", hours: "7–12" },
  { id: "tarde", label: "Tarde", hours: "1–5" },
  { id: "noche", label: "Noche", hours: "6–10" },
];

export function createEmptyWeeklyAvailability(): WeeklyAvailabilityPayload {
  return {
    "disponibilidad a la semana": {
      lunes: [],
      martes: [],
      miercoles: [],
      jueves: [],
      viernes: [],
      sabado: [],
    },
  };
}

export function countSelectedSlots(payload: WeeklyAvailabilityPayload): number {
  return Object.values(payload["disponibilidad a la semana"]).reduce(
    (total, slots) => total + slots.length,
    0,
  );
}

export function countDaysWithSelection(payload: WeeklyAvailabilityPayload): number {
  return Object.values(payload["disponibilidad a la semana"]).filter(
    (slots) => slots.length > 0,
  ).length;
}

export function getInitiallySelectedDays(payload: WeeklyAvailabilityPayload): WeekDay[] {
  const schedule = payload["disponibilidad a la semana"];
  return WEEK_DAYS.filter(({ id }) => schedule[id].length > 0).map(({ id }) => id);
}

export function clearDaySlots(
  payload: WeeklyAvailabilityPayload,
  day: WeekDay,
): WeeklyAvailabilityPayload {
  return {
    "disponibilidad a la semana": {
      ...payload["disponibilidad a la semana"],
      [day]: [],
    },
  };
}

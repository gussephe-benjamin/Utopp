import type { SharedEvent } from "../../../api/events.api"
import { canonicalizeUtoppFormularioUrl } from "../../../shared/lib/utoppFormularioUrl"

export type CountdownTone = "urgent" | "soon" | "neutral" | "expired"

export interface CountdownInfo {
  label: string
  tone: CountdownTone
}

/** Clases pill por tono del countdown (reutiliza la paleta de PostCard). */
export const COUNTDOWN_TONE_CLASSES: Record<CountdownTone, string> = {
  urgent: "border-red-200 bg-red-50 text-red-600",
  soon: "border-amber-200 bg-amber-50 text-amber-700",
  neutral: "border-gray-200 bg-gray-50 text-gray-600",
  expired: "border-gray-200 bg-gray-100 text-gray-500",
}

/**
 * Deriva el estado de cuenta regresiva a partir de `date_time`.
 * Reglas de color: rojo <24h, ámbar 24h–7d, neutro >7d, gris si ya pasó.
 */
export function getEventCountdown(event: SharedEvent, now: Date = new Date()): CountdownInfo | null {
  if (!event.date_time) return null

  const startsAt = new Date(event.date_time)
  const diffMs = startsAt.getTime() - now.getTime()

  if (diffMs <= 0) {
    return { label: "Finalizado", tone: "expired" }
  }

  const hours = diffMs / (1000 * 60 * 60)
  const days = Math.floor(hours / 24)

  if (hours < 1) {
    const minutes = Math.max(1, Math.round(diffMs / (1000 * 60)))
    return { label: `Quedan ${minutes} min`, tone: "urgent" }
  }

  if (hours < 24) {
    const roundedHours = Math.max(1, Math.round(hours))
    return { label: `Quedan ${roundedHours} h`, tone: "urgent" }
  }

  if (days < 7) {
    return { label: days === 1 ? "Queda 1 día" : `Quedan ${days} días`, tone: "soon" }
  }

  return { label: `Faltan ${days} días`, tone: "neutral" }
}

/** Fecha legible corta para eventos (ej: "mar 12 ago, 18:30"). */
export function formatEventDate(dateStr?: string | null): string {
  if (!dateStr) return "Fecha por confirmar"
  const date = new Date(dateStr)
  return date.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/** Mezcla aleatoria (Fisher–Yates). Incluye todos los eventos, con o sin imagen. */
export function shuffleEvents(events: SharedEvent[]): SharedEvent[] {
  const shuffled = [...events]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Orden estable para el carrusel destacado: conserva el orden ya mostrado y
 * solo baraja los eventos nuevos (p. ej. al paginar).
 */
export function mergeFeaturedEvents(
  previous: SharedEvent[],
  incoming: SharedEvent[],
): SharedEvent[] {
  if (incoming.length === 0) return []

  const byId = new Map(incoming.map((event) => [event.id, event]))
  const keptIds = previous.map((event) => event.id).filter((id) => byId.has(id))
  const keptSet = new Set(keptIds)
  const newcomers = shuffleEvents(incoming.filter((event) => !keptSet.has(event.id)))

  if (keptIds.length === 0) {
    return shuffleEvents(incoming)
  }

  return [...keptIds.map((id) => byId.get(id)!), ...newcomers]
}

/** Abre el formulario de inscripción de Utopp Formulario para este evento. */
export function getRegistrationUrl(event: SharedEvent): string {
  const raw =
    event.registration_url ||
    `${((import.meta.env.VITE_UF_FRONTEND_URL as string | undefined) ?? "http://localhost:5174").replace(/\/$/, "")}/e/${event.id}`
  return canonicalizeUtoppFormularioUrl(raw)
}

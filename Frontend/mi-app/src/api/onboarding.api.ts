/**
 * API de Onboarding
 *
 * Endpoints del backend (prefix: /onboarding):
 *   POST /onboarding/isComplete — Verifica si un usuario completó el onboarding
 *   GET  /onboarding/me         — Estado de onboarding del usuario autenticado
 *   POST /onboarding/update     — Completa el onboarding (career, interests, cycle, availability)
 */

import api from "./axios"

export interface OnboardingData {
  career: string
  interests: string[]
  cycle: number
  availability: Record<string, unknown>[]
}

/**
 * POST /onboarding/isComplete
 * Verifica si un usuario ha completado el onboarding.
 * Recibe el ID del usuario y devuelve { user_id, onboarding_completed }.
 * Auth: No requerida.
 */
export async function isComplete(userId: number) {
  const { data } = await api.post("/onboarding/isComplete", { id: userId })
  return data
}

/**
 * GET /onboarding/me
 * Devuelve { id, email, onboarding_completed } del usuario autenticado.
 * Auth: Requerida.
 */
export async function getOnboardingStatus() {
  const { data } = await api.get("/onboarding/me")
  return data
}

/**
 * POST /onboarding/update
 * Completa el proceso de onboarding del usuario autenticado.
 * Guarda career, interests, availability y cycle.
 * Solo se puede ejecutar una vez por usuario. Error 403 si ya fue completado.
 * Auth: Requerida.
 */
export async function updateOnboarding(payload: OnboardingData) {
  const { data } = await api.post("/onboarding/update", payload)
  return data
}

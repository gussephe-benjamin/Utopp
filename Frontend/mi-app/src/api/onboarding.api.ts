/**
 * API de Onboarding
 *
 * Endpoints del backend (prefix: /onboarding):
 *   POST /onboarding/isComplete — Verifica si un usuario completó el onboarding
 *   GET  /onboarding/me         — Estado de onboarding del usuario autenticado
 *   POST /onboarding/update     — Completa el onboarding (career, cycle)
 */

import api from "./axios"

export interface OnboardingData {
  career: string
  cycle: number
}

export async function isComplete(userId: number) {
  const { data } = await api.post("/onboarding/isComplete", { id: userId })
  return data
}

export async function getOnboardingStatus() {
  const { data } = await api.get("/onboarding/me")
  return data
}

export async function updateOnboarding(payload: OnboardingData) {
  const { data } = await api.post("/onboarding/update", payload)
  return data
}

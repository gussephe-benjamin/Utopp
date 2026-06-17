import api from "./axios"

export interface AuthMeUser {
  id: number
  email: string
  full_name?: string | null
  onboarding_completed: boolean
  needs_terms?: boolean
  needs_terms_consent?: boolean
  needs_privacy_consent?: boolean
  profile_image_url?: string | null
}

export interface AuthMeResponse {
  authenticated: boolean
  user?: AuthMeUser
}

/**
 * GET /auth/me
 * Estado de sesión basado en cookie HttpOnly. No requiere Authorization header.
 */
export async function fetchAuthMe(): Promise<AuthMeResponse> {
  const { data } = await api.get<AuthMeResponse>("/auth/me")
  return data
}

/** Usuario autenticado actual; lanza si no hay sesión. */
export async function getMe(): Promise<AuthMeUser> {
  const data = await fetchAuthMe()
  if (!data.authenticated || !data.user) {
    throw new Error("No autenticado")
  }
  return data.user
}

/**
 * POST /auth/refresh
 * Renueva la sesión (cookie HttpOnly).
 */
export async function refreshToken() {
  const { data } = await api.post("/auth/refresh")
  return data
}

/**
 * POST /auth/logout
 * Cierra sesión eliminando la cookie HttpOnly.
 */
export async function logoutSession() {
  const { data } = await api.post("/auth/logout")
  return data
}

export interface GoogleOAuthPendingResponse {
  pending: boolean
  email?: string
  full_name?: string
}

export async function fetchGoogleOAuthPending(pendingToken?: string | null) {
  const { data } = await api.get<GoogleOAuthPendingResponse>("/auth/google/pending", {
    params: pendingToken ? { pending_token: pendingToken } : undefined,
  })
  return data
}

export async function completeGoogleOAuthRegister(payload: {
  terms_document_id: number
  privacy_document_id: number
  pending_token?: string | null
}) {
  const { data } = await api.post("/auth/google/register", payload)
  return data
}

export async function cancelGoogleOAuthPending() {
  const { data } = await api.post("/auth/google/cancel-pending")
  return data
}

/** URL absoluta para iniciar OAuth server-side con Google. */
export function getGoogleOAuthLoginUrl(): string {
  const base = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? ""
  return `${base}/auth/google/login`
}

export async function loginSession(payload: { email: string; password: string }) {
  const { data } = await api.post("/auth/login", payload)
  return data
}

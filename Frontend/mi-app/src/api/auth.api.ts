/**
 * API de Autenticación
 *
 * Endpoints del backend:
 *   POST /auth/login      — Login con email y contraseña (UTEC)
 *   POST /auth/register   — Registro con email, contraseña y nombre
 *   POST /auth/refresh    — Renueva el JWT del usuario autenticado
 *   GET  /auth/me         — Datos básicos del usuario autenticado
 *   POST /google/register — Registro con token de Google OAuth
 *   POST /google/login    — Login con token de Google OAuth
 *
 * Nota: El interceptor de axios.ts ya adjunta el header Authorization
 * automáticamente. No es necesario agregarlo manualmente.
 */

import api from "./axios"

// ─── Auth clásica ────────────────────────────────────────

/**
 * POST /auth/login
 * Autentica un usuario con email y contraseña.
 * Valida dominio UTEC. Devuelve { access_token }.
 * Auth: No requerida.
 */
export async function login(email: string, password: string) {
  const { data } = await api.post("/auth/login", { email, password })
  return data
}

/**
 * POST /auth/register
 * Registra un nuevo usuario con email, contraseña y nombre.
 * Error 400 si el email ya existe. Valida dominio UTEC.
 * Auth: No requerida.
 */
export async function register(email: string, password: string, fullName?: string) {
  const { data } = await api.post("/auth/register", {
    email,
    password,
    full_name: fullName || undefined,
  })
  return data
}

/**
 * POST /auth/refresh
 * Genera un nuevo JWT para el usuario autenticado.
 * Auth: Requerida.
 */
export async function refreshToken() {
  const { data } = await api.post("/auth/refresh")
  return data
}

/**
 * GET /auth/me
 * Devuelve { id, email, onboarding_completed } del usuario autenticado.
 * Auth: Requerida.
 */
export async function getMe() {
  const { data } = await api.get("/auth/me")
  return data
}

// ─── Google OAuth ────────────────────────────────────────

/**
 * POST /google/register
 * Registra un usuario nuevo usando su token de Google.
 * Devuelve { access_token, token_type }.
 * Error 409 si el usuario ya existe.
 * Auth: No requerida (usa token de Google).
 */
export async function googleRegister(googleToken: string) {
  const { data } = await api.post("/google/register", { token: googleToken })
  return data
}

/**
 * POST /google/login
 * Autentica un usuario existente con su token de Google.
 * Si no tiene google_id vinculado, lo asigna automáticamente.
 * Error 401 si el usuario no está registrado.
 * Auth: No requerida (usa token de Google).
 */
export async function googleLogin(googleToken: string) {
  const { data } = await api.post("/google/login", { token: googleToken })
  return data
}

import type { AxiosError } from "axios";
import { AUTH_UTEC } from "../../features/auth/constants/authCopy";

const INSTITUTIONAL_EMAIL_MESSAGE = AUTH_UTEC.accessDenied;

/** Errores de login / sesión (respuesta típica `{ detail: string }`). */
export function parseAuthApiError(err: unknown): string {
  const axiosErr = err as AxiosError<{ detail?: string }>;
  const detail = axiosErr?.response?.data?.detail;
  if (detail) {
    if (detail.includes("Credenciales") || detail.includes("credenciales"))
      return "Correo o contraseña incorrectos. Verifica tus datos.";
    if (
      detail.includes("organización") ||
      detail.includes("dominio") ||
      detail.includes("autorizado") ||
      detail.includes("institucional")
    )
      return INSTITUTIONAL_EMAIL_MESSAGE;
    return detail;
  }
  const status = axiosErr?.response?.status;
  if (status === 401) return "Correo o contraseña incorrectos.";
  if (status === 403) return "No tienes permiso para acceder.";
  if (axiosErr?.code === "ERR_NETWORK") return "No se pudo conectar al servidor. Verifica tu conexión.";
  return "Error inesperado. Intenta de nuevo.";
}

/** Errores de registro (detail puede ser string o lista de validación). */
export function parseRegisterApiError(err: unknown): string {
  const axiosErr = err as AxiosError<{ detail?: string | { msg: string }[] }>;
  const detail = axiosErr?.response?.data?.detail;
  if (!detail) {
    if (axiosErr?.code === "ERR_NETWORK") return "No se pudo conectar al servidor. Verifica tu conexión.";
    return "Error inesperado. Intenta de nuevo.";
  }
  if (typeof detail === "string") {
    if (detail.includes("ya registrado")) return "Este email ya está registrado. Intenta iniciar sesión.";
    if (
      detail.includes("organización") ||
      detail.includes("dominio") ||
      detail.includes("autorizado") ||
      detail.includes("institucional")
    )
      return INSTITUTIONAL_EMAIL_MESSAGE;
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg).join(" ");
  }
  return "Error al registrar. Intenta de nuevo.";
}

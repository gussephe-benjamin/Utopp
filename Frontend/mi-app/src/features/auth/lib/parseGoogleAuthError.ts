import type { AxiosError } from "axios";
import { AUTH_UTEC } from "../constants/authCopy";

/** Muestra el detail del backend; fallback institucional en 403. */
export function parseGoogleAuthError(err: unknown, fallback: string): string {
  const axiosErr = err as AxiosError<{ detail?: string }>;
  const detail = axiosErr?.response?.data?.detail;

  if (typeof detail === "string" && detail.trim().length > 0) {
    return detail;
  }

  if (axiosErr?.response?.status === 403) {
    return AUTH_UTEC.accessDenied;
  }

  if (axiosErr?.response?.status === 401) {
    return "Token de Google inválido o usuario no registrado.";
  }

  if (axiosErr?.code === "ERR_NETWORK") {
    return "No se pudo conectar al servidor. Verifica tu conexión.";
  }

  return fallback;
}

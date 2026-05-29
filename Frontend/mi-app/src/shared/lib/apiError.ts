/** Formatea el cuerpo `detail` de errores FastAPI/Axios para mostrarlo al usuario. */
export function formatApiError(error: unknown, fallback = "Error desconocido"): string {
  const err = error as {
    response?: { data?: { detail?: unknown } }
    message?: string
  }
  const detail = err.response?.data?.detail

  if (typeof detail === "string") return detail

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (item && typeof item === "object" && "msg" in item) {
          const loc = "loc" in item && Array.isArray(item.loc) ? item.loc.filter(Boolean).join(".") : ""
          return loc ? `${loc}: ${String(item.msg)}` : String(item.msg)
        }
        return JSON.stringify(item)
      })
      .join(" · ")
  }

  if (detail && typeof detail === "object") {
    return JSON.stringify(detail)
  }

  return err.message ?? fallback
}

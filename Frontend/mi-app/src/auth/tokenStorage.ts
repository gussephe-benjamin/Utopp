// Token JWT compartido entre pestañas del mismo origen.
// Persiste mientras el JWT sea válido (según expiración configurada en backend).

export const TOKEN_STORAGE_KEY = "token"

const TOKEN_CHANGED_EVENT = "utopp:token-change"

function notifyTokenChange(): void {
  window.dispatchEvent(new Event(TOKEN_CHANGED_EVENT))
}

export function getToken(): string | null {
  const fromLocal = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (fromLocal) return fromLocal

  // Migración desde sessionStorage (comportamiento anterior por pestaña).
  const fromSession = sessionStorage.getItem(TOKEN_STORAGE_KEY)
  if (fromSession) {
    localStorage.setItem(TOKEN_STORAGE_KEY, fromSession)
    sessionStorage.removeItem(TOKEN_STORAGE_KEY)
    return fromSession
  }

  return null
}

export function setToken(jwt: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, jwt)
  sessionStorage.removeItem(TOKEN_STORAGE_KEY)
  notifyTokenChange()
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  sessionStorage.removeItem(TOKEN_STORAGE_KEY)
  notifyTokenChange()
}

/** Sincroniza React AuthContext cuando el token cambia en otra pestaña o vía refresh. */
export function subscribeTokenChanges(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === TOKEN_STORAGE_KEY || event.key === null) {
      onChange()
    }
  }

  window.addEventListener("storage", onStorage)
  window.addEventListener(TOKEN_CHANGED_EVENT, onChange)

  return () => {
    window.removeEventListener("storage", onStorage)
    window.removeEventListener(TOKEN_CHANGED_EVENT, onChange)
  }
}

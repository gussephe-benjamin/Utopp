// Almacenamiento del token de sesión por pestaña.
// Usamos sessionStorage (exclusivo de cada pestaña) para que cada tab
// pueda tener una cuenta distinta sin pisarse con las demás.

const TOKEN_KEY = "token"

export function getToken(): string | null {
  const token = sessionStorage.getItem(TOKEN_KEY)
  if (token) return token

  // Limpieza del token legado en localStorage: no lo heredamos para
  // mantener el aislamiento por pestaña.
  if (localStorage.getItem(TOKEN_KEY)) {
    localStorage.removeItem(TOKEN_KEY)
  }
  return null
}

export function setToken(jwt: string): void {
  sessionStorage.setItem(TOKEN_KEY, jwt)
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY)
}

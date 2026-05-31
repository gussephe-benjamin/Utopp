// Correo del formulario de login por pestaña. Persiste en sessionStorage
// para que no se pierda tras un intento fallido o recarga de la página.

const LOGIN_EMAIL_KEY = "login_email"

export function getLoginEmail(): string {
  return sessionStorage.getItem(LOGIN_EMAIL_KEY) ?? ""
}

export function setLoginEmail(email: string): void {
  const trimmed = email.trim()
  if (trimmed) {
    sessionStorage.setItem(LOGIN_EMAIL_KEY, trimmed)
  } else {
    sessionStorage.removeItem(LOGIN_EMAIL_KEY)
  }
}

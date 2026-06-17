import axios from "axios"

const baseURL = import.meta.env.VITE_API_URL

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
})

let logoutHandler: (() => Promise<void>) | null = null

export function registerAuthLogoutHandler(handler: () => Promise<void>) {
  logoutHandler = handler
}

export default api

api.defaults.withCredentials = true

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 403) {
      const detail = error.response?.data?.detail
      const code =
        typeof detail === "object" && detail !== null && "code" in detail
          ? String((detail as { code: string }).code)
          : null
      if (code === "TERMS_RECONSENT_REQUIRED") {
        if (window.location.pathname !== "/app/terms") {
          window.location.assign("/app/terms")
        }
        return Promise.reject(error)
      }
    }

    const isAuthMe = originalRequest?.url?.includes("/auth/me")
    const isLogout = originalRequest?.url?.includes("/auth/logout")
    const isOnLogin = window.location.pathname === "/login"

    if (error.response?.status === 401 && !originalRequest._retried) {
      if (isAuthMe || isLogout || isOnLogin) {
        return Promise.reject(error)
      }

      originalRequest._retried = true
      try {
        await api.post("/auth/refresh")
        return api.request(originalRequest)
      } catch {
        if (logoutHandler) {
          await logoutHandler()
        }
        if (!isOnLogin) {
          window.location.href = "/login"
        }
      }
    }
    return Promise.reject(error)
  },
)

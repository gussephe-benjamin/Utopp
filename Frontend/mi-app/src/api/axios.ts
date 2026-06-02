import axios from "axios"
import { getToken, setToken, clearToken } from "../auth/tokenStorage"

const baseURL = import.meta.env.VITE_API_URL 

const api = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  paramsSerializer: (params) => {
    const parts: string[] = []
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue
      if (Array.isArray(value)) {
        value.forEach(v => parts.push(`${key}=${encodeURIComponent(v)}`))
      } else {
        parts.push(`${key}=${encodeURIComponent(String(value))}`)
      }
    }
    return parts.join('&')
  },
})

// Interceptor → adjunta el token automáticamente
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor → maneja errores de autenticación (con guard anti-loop)
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
    if (error.response?.status === 401 && !originalRequest._retried) {
      const isAuthRequest = originalRequest.url?.includes("/auth/login") || originalRequest.url?.includes("/google/login")
      if (isAuthRequest || window.location.pathname === "/login") {
        return Promise.reject(error)
      }
      originalRequest._retried = true
      try {
        const refreshResponse = await axios.post(`${baseURL}/auth/refresh`, {}, {
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        })
        const newToken = refreshResponse.data.access_token
        setToken(newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return axios.request(originalRequest)
      } catch {
        clearToken()
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  }
)

export default api

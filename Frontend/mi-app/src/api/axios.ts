import axios from "axios"

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
  const token = localStorage.getItem("token")
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
    if (error.response?.status === 401 && !originalRequest._retried) {
      originalRequest._retried = true
      try {
        const refreshResponse = await axios.post(`${baseURL}/auth/refresh`, {}, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        })
        const newToken = refreshResponse.data.access_token
        localStorage.setItem("token", newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return axios.request(originalRequest)
      } catch {
        localStorage.removeItem("token")
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  }
)

export default api

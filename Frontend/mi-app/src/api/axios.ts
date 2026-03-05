import axios from "axios"

const baseURL = import.meta.env.VITE_API_URL 

const api = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
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

// Interceptor → maneja errores de autenticación
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log(" Token expirado o inválido, intentando refresh...")
      
      try {
        // Intentar refresh automático del token
        const refreshResponse = await axios.post("http://localhost:8000/auth/refresh", {}, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });
        
        // Guardar nuevo token
        localStorage.setItem("token", refreshResponse.data.access_token);
        console.log(" Token refresh exitoso")
        
        // Reintentar la petición original con el nuevo token
        error.config.headers.Authorization = `Bearer ${refreshResponse.data.access_token}`;
        return axios.request(error.config);
        
      } catch (refreshError) {
        console.log(" Refresh falló, redirigiendo al login")
        console.log(refreshError)
        localStorage.removeItem("token")
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  }
)

export default api

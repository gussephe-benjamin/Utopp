import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./auth/AuthContext"
import ProtectedRoute from "./auth/ProtectedRoute"
import AppRoute from "./auth/AppRoute"
import Login from "./pages/auth/Login"
import Login1 from "./pages/auth/Login1"
import Login2 from "./pages/auth/Login2"
import DashboardLayout from "./pages/Dashboard"
import Onboarding from "./onboardings/Onboarding"
import Register from "./pages/auth/Register"
import Feed from "./pages/Feed"
import Schedule from "./pages/Schedule"
import Profile from "./pages/Profile"

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta por defecto - redirige según estado de autenticación y onboarding */}
          <Route path="/" element={<AppRoute />} />

          {/* Ruta direccionamiento al Login Original */}
          <Route path="/login" element={<Login />} />

          {/* Rutas del dashboard con navegación compartida */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="inicio" element={<Feed />} />
            <Route path="horario" element={<Schedule />} />
            <Route path="perfil/:id?" element={<Profile />} />
          </Route>

          {/* Ruta direccionamiento al Login sin register */}
          <Route
            path="/login1"
            element={
              <ProtectedRoute>
                <Login1 />
              </ProtectedRoute>
            }
          />

          {/* Ruta direccionamiento al Login Only Google */}
          <Route
            path="/login2"
            element={
              <ProtectedRoute>
                <Login2 />
              </ProtectedRoute>
            }
          />

          {/* Ruta direccionamiento al onboarding */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          {/* Ruta direccionamiento al Register */}
          <Route
            path="/register"
            element={
          
                <Register/>
          
            }
          />
          
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./auth/AuthContext"
import ProtectedRoute from "./auth/ProtectedRoute"
import AppRoute from "./auth/AppRoute"
import Login from "./pages/auth/Login"
//import LoginOG from "./pages/auth/LoginOG"
import DashboardLayout from "./pages/Dashboard"
import Onboarding from "./features/onboarding/Onboarding"
//import Register from "./pages/auth/Register"
import RegisterOG from "./pages/auth/RegisterOG"
import Schedule from "./pages/Schedule"

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta por defecto - redirige según estado de autenticación y onboarding */}
          <Route path="/" element={<AppRoute />} />

          {/* Ruta direccionamiento al Login */}
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
            <Route path="horario" element={<Schedule />} />
            <Route path="*" element={null} />
          </Route>

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
          
                <RegisterOG/>
          
            }
          />
          
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

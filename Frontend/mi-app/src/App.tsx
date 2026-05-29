import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./auth/AuthContext"
import ProtectedRoute from "./auth/ProtectedRoute"
import AppRoute from "./auth/AppRoute"
import Login from "./pages/auth/Login"
import DashboardLayout from "./pages/Dashboard"
import Onboarding from "./features/onboarding/Onboarding"
import RegisterOG from "./pages/auth/RegisterOG"
import TermsAcceptance from "./pages/TermsAcceptance"
import TermsPublic from "./pages/TermsPublic"
import PrivacyPublic from "./pages/PrivacyPublic"

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta por defecto - redirige según estado de autenticación y onboarding */}
          <Route path="/" element={<AppRoute />} />

          {/* Ruta direccionamiento al Login */}
          <Route path="/login" element={<Login />} />

          <Route path="/terms" element={<TermsPublic />} />
          <Route path="/privacy" element={<PrivacyPublic />} />

          <Route
            path="/app/terms"
            element={
              <ProtectedRoute>
                <TermsAcceptance />
              </ProtectedRoute>
            }
          />

          {/* Rutas del dashboard con navegación compartida */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
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
          
          {/* Ruta comodín para capturar cualquier ruta inexistente y redirigir a la raíz */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App


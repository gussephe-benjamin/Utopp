import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
// import { AuthProvider } from "./auth/AuthContext"
// import ProtectedRoute from "./auth/ProtectedRoute"
import Login from "./pages/auth/Login"
import Login1 from "./pages/auth/Login1"
import Login2 from "./pages/auth/Login2"
import Dashboard from "./pages/Dashboard"
import Onboarding from "./onboardings/Onboarding"
import Register from "./pages/auth/Register"

function App() {
  return (
    //<AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta por defecto */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Ruta direccionamiento al Login Original */}

          <Route path="/login" element={<Login />} />

          {/* Ruta direccionamiento al dashboard */}

          <Route
            path="/dashboard"
            element={
              //<ProtectedRoute>
                <Dashboard />
              //</ProtectedRoute>
            }
          />

          {/* Ruta direccionamiento al Login sin register */}

          <Route
            path="/login1"
            element={
              //<ProtectedRoute>
                <Login1 />
              //</ProtectedRoute>
            }
          />

          {/* Ruta direccionamiento al Login Only Google */}

          <Route
            path="/login2"
            element={
              //<ProtectedRoute>
                <Login2 />
              //</ProtectedRoute>
            }
          />

          {/* Ruta direccionamiento al onboarding */}

          <Route
            path="/onboarding"
            element={
              //<ProtectedRoute>
                <Onboarding />
             // </ProtectedRoute>
            }
          />

          {/* Ruta direccionamiento al Register */}

          <Route
            path="/register"
            element={
              //<ProtectedRoute>
                <Register/>
              //</ProtectedRoute>
            }
          />
          
        </Routes>
      </BrowserRouter>
    //</AuthProvider>
  )
}

export default App

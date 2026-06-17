import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./auth/AuthContext"
import ProtectedRoute from "./auth/ProtectedRoute"
import AppRoute from "./auth/AppRoute"
import AuthEntry from "./pages/auth/AuthEntry"
import DashboardLayout from "./pages/Dashboard"
import Onboarding from "./features/onboarding/Onboarding"
import { AuthRouteLayout } from "./features/auth/components/AuthRouteLayout"
import TermsAcceptance from "./pages/TermsAcceptance"
import TermsPublic from "./pages/TermsPublic"
import PrivacyPublic from "./pages/PrivacyPublic"
import { AdminGuard } from "./features/admin/AdminGuard"
import AdminLayout from "./features/admin/components/AdminLayout"
import AdminOverviewPage from "./pages/admin/AdminOverviewPage"
import AdminStudentsPage from "./pages/admin/AdminStudentsPage"
import AdminOrganizationsPage from "./pages/admin/AdminOrganizationsPage"
import AdminRolesPage from "./pages/admin/AdminRolesPage"
import AdminTermsPage from "./pages/admin/AdminTermsPage"
import AdminPostsPage from "./pages/AdminPostsPage"

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppRoute />} />

          <Route element={<AuthRouteLayout />}>
            <Route path="/login" element={<AuthEntry />} />
            <Route path="/register" element={<Navigate to="/login" replace />} />
          </Route>

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

          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route
              path="admin"
              element={
                <AdminGuard>
                  <AdminLayout />
                </AdminGuard>
              }
            >
              <Route index element={<AdminOverviewPage />} />
              <Route path="alumnos" element={<AdminStudentsPage />} />
              <Route path="organizaciones" element={<AdminOrganizationsPage />} />
              <Route path="publicaciones" element={<AdminPostsPage />} />
              <Route path="roles" element={<AdminRolesPage />} />
              <Route path="terminos" element={<AdminTermsPage />} />
            </Route>
            <Route path="*" element={null} />
          </Route>

          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

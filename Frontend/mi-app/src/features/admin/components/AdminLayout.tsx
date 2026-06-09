import { NavLink, Outlet } from "react-router-dom"
import {
  LayoutDashboard,
  GraduationCap,
  Building2,
  FileText,
  ShieldCheck,
  ScrollText,
  ArrowLeft,
} from "lucide-react"
import { AppLink } from "../../../shared/navigation/AppLink"
import { TW_UTOPP_GRADIENT_R, TW_UTOPP_GRADIENT_TEXT } from "../../../shared/constants/brand"

const NAV_ITEMS = [
  { to: "/app/admin", label: "Resumen", icon: LayoutDashboard, end: true },
  { to: "/app/admin/alumnos", label: "Alumnos", icon: GraduationCap, end: false },
  { to: "/app/admin/organizaciones", label: "Organizaciones", icon: Building2, end: false },
  { to: "/app/admin/publicaciones", label: "Publicaciones", icon: FileText, end: false },
  { to: "/app/admin/roles", label: "Roles", icon: ShieldCheck, end: false },
  { to: "/app/admin/terminos", label: "Términos", icon: ScrollText, end: false },
]

export default function AdminLayout() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row md:py-8">
      {/* Sidebar */}
      <aside className="md:w-60 md:shrink-0">
        <div className="mb-4 hidden md:block">
          <span className={`text-lg font-extrabold ${TW_UTOPP_GRADIENT_TEXT}`}>Administración</span>
          <p className="mt-0.5 text-xs text-gray-400">Panel de control Utopp</p>
        </div>

        <nav className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:gap-1 md:overflow-visible">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? `${TW_UTOPP_GRADIENT_R} text-white shadow-sm`
                    : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
              <span className="whitespace-nowrap">{label}</span>
            </NavLink>
          ))}
        </nav>

        <AppLink
          to="/app/inicio"
          className="mt-4 hidden items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 md:flex"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al feed
        </AppLink>
      </aside>

      {/* Contenido */}
      <section className="min-w-0 flex-1">
        <Outlet />
      </section>
    </div>
  )
}

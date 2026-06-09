import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Building2, FileText, GraduationCap, ScrollText, ShieldCheck } from "lucide-react"
import { getAdminUsers } from "../../api/admin.api"
import { getAdminPosts } from "../../api/posts.api"
import { ROLE_ESTUDIANTE, ROLE_ORGANIZACION } from "../../hooks/useRole"
import { TW_UTOPP_GRADIENT_BR } from "../../shared/constants/brand"

type Counts = {
  students: number | null
  organizations: number | null
  posts: number | null
}

const QUICK_LINKS = [
  { to: "/app/admin/alumnos", label: "Gestionar alumnos", icon: GraduationCap },
  { to: "/app/admin/organizaciones", label: "Gestionar organizaciones", icon: Building2 },
  { to: "/app/admin/publicaciones", label: "Moderar publicaciones", icon: FileText },
  { to: "/app/admin/roles", label: "Asignar roles", icon: ShieldCheck },
  { to: "/app/admin/terminos", label: "Editar términos", icon: ScrollText },
]

export default function AdminOverviewPage() {
  const [counts, setCounts] = useState<Counts>({ students: null, organizations: null, posts: null })

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [students, orgs, posts] = await Promise.allSettled([
        getAdminUsers({ role: ROLE_ESTUDIANTE, page: 1, size: 1 }),
        getAdminUsers({ role: ROLE_ORGANIZACION, page: 1, size: 1 }),
        getAdminPosts({ page: 1, size: 1 }),
      ])
      if (cancelled) return
      setCounts({
        students: students.status === "fulfilled" ? students.value.total : null,
        organizations: orgs.status === "fulfilled" ? orgs.value.total : null,
        posts: posts.status === "fulfilled" ? posts.value.total : null,
      })
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const cards = [
    { label: "Alumnos", value: counts.students, icon: GraduationCap },
    { label: "Organizaciones", value: counts.organizations, icon: Building2 },
    { label: "Publicaciones", value: counts.posts, icon: FileText },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Resumen</h1>
        <p className="mt-1 text-sm text-gray-500">Vista general de la plataforma Utopp.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">{label}</span>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${TW_UTOPP_GRADIENT_BR} text-white`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-gray-900">
              {value == null ? "—" : value}
            </p>
          </div>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-gray-400">
        Accesos rápidos
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {QUICK_LINKS.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-colors hover:border-violet-200 hover:bg-violet-50/40"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <Icon className="h-5 w-5" />
            </div>
            <span className="font-medium text-gray-800">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

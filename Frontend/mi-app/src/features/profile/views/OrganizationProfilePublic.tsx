import type { ProfileUserData } from "./types"

interface OrganizationProfilePublicProps {
  user: ProfileUserData
  avatarUrl: string | null
}

export function OrganizationProfilePublic({ user, avatarUrl }: OrganizationProfilePublicProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
      <section className="rounded-2xl border border-violet-100 bg-white shadow-sm">
        <div className="h-[240px] w-full rounded-t-2xl bg-gradient-to-r from-[#4f46e5] via-[#7c3aed] to-[#a21caf]" />
        <div className="p-4 md:p-6">
          <div className="mb-4 flex items-end gap-4">
            <div className="-mt-20 h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-gray-100">
              {avatarUrl ? <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" /> : null}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.full_name ?? "Organización"}</h1>
              <p className="text-sm text-gray-600">Perfil público de organización (base)</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <PlaceholderCard title="Información pública" />
            <PlaceholderCard title="Próximos espacios de contenido" />
          </div>
        </div>
      </section>
    </div>
  )
}

function PlaceholderCard({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-dashed border-violet-200 bg-violet-50 p-4">
      <p className="text-sm font-semibold text-violet-900">{title}</p>
      <p className="mt-1 text-xs text-violet-700">Componente base para detallar en la próxima fase de diseño.</p>
    </div>
  )
}

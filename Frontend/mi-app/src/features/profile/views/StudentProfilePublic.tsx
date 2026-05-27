import { useMemo } from "react"
import { AVAILABILITY_OPTIONS, CAREER_OPTIONS } from "../constants/profileOptions"
import { INTERESTS } from "../../../constants/interests"
import type { OrganizationSummary } from "../../../api/users.api"
import type { ProfileUserData } from "./types"

interface StudentProfilePublicProps {
  user: ProfileUserData
  avatarUrl: string | null
  followingOrganizations: OrganizationSummary[]
}

export function StudentProfilePublic({ user, avatarUrl, followingOrganizations }: StudentProfilePublicProps) {
  const careerLabel = useMemo(
    () => CAREER_OPTIONS.find((career) => career.id === user.career)?.label ?? user.career ?? "No definida",
    [user.career],
  )
  const availabilityLabel = AVAILABILITY_OPTIONS.find((item) => item.id === (user.availability ?? 0))?.label ?? "No definida"

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
      <section className="rounded-2xl border border-violet-100 bg-white shadow-sm">
        <div className="h-[240px] w-full rounded-t-2xl bg-gradient-to-r from-[#6f46ff] via-[#8d5dff] to-[#aa7cff]" />
        <div className="p-4 md:p-6">
          <div className="mb-4 flex items-end gap-4">
            <div className="-mt-20 h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-gray-100">
              {avatarUrl ? <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" /> : null}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.full_name ?? "Usuario"}</h1>
              <p className="text-sm text-gray-600">{careerLabel}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <InfoCard label="Ciclo" value={`Ciclo ${user.cycle ?? "-"}`} />
            <InfoCard label="Disponibilidad" value={availabilityLabel} />
            <InfoCard label="Organizaciones seguidas" value={`${followingOrganizations.length}`} />
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm md:p-6">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Métricas</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <InfoCard label="Disponibilidad" value={availabilityLabel} />
          <InfoCard label="Métrica futura 1" value="-" />
          <InfoCard label="Métrica futura 2" value="-" />
          <InfoCard label="Métrica futura 3" value="-" />
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm md:p-6">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Comunidades que sigue</h2>
        {(user.interests ?? []).length === 0 ? (
          <p className="text-sm text-gray-600">Sin comunidades visibles.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(user.interests ?? []).map((interestId) => {
              const label = INTERESTS.find((interest) => interest.id === interestId)?.label ?? interestId
              return (
                <span key={interestId} className="rounded-full bg-violet-50 px-3 py-1 text-sm font-medium text-violet-800">
                  {label}
                </span>
              )
            })}
          </div>
        )}
      </section>

      <section className="mt-5 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm md:p-6">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Organizaciones que sigue</h2>
        {followingOrganizations.length === 0 ? (
          <p className="text-sm text-gray-600">Este alumno aún no sigue organizaciones.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {followingOrganizations.map((org) => (
              <div key={org.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
                <div className="mx-auto mb-2 h-12 w-12 overflow-hidden rounded-full bg-white">
                  {org.profile_image_url ? <img src={org.profile_image_url} alt={org.full_name ?? "org"} className="h-full w-full object-cover" /> : null}
                </div>
                <p className="truncate text-sm font-semibold text-gray-900">{org.full_name ?? `Org ${org.id}`}</p>
                <p className="text-xs text-gray-500">{org.followers_count} seguidores</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  )
}

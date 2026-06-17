  import { useMemo, useState } from "react"
import { Mail, Copy, Check, BarChart3, Clock } from "lucide-react"
import { AVAILABILITY_OPTIONS, CAREER_OPTIONS } from "../constants/profileOptions"
import type { OrganizationSummary } from "../../../api/users.api"
import type { ProfileUserData } from "./types"
import { TW_UTOPP_GRADIENT_R } from "../../../shared/constants/brand"
import { formatShortDisplayName } from "../../feed/lib/display"
import { ProfileMetricCard } from "../components/ProfileMetricCard"
import { ProfileAvatar } from "../components/ProfileAvatar"
import { resolveOrgImageUrl } from "../../../shared/lib/cloudinaryUrl"

interface StudentProfilePublicProps {
  user: ProfileUserData
  avatarUrl: string | null
  followingOrganizations: OrganizationSummary[]
}

export function StudentProfilePublic({
  user,
  avatarUrl,
  followingOrganizations,
}: StudentProfilePublicProps) {
  const [emailCopied, setEmailCopied] = useState(false)

  const careerLabel = useMemo(
    () => CAREER_OPTIONS.find((career) => career.id === user.career)?.label ?? user.career ?? "No definida",
    [user.career],
  )

  const availabilityOption = useMemo(
    () => AVAILABILITY_OPTIONS.find((item) => item.id === (user.availability ?? 0)),
    [user.availability],
  )
  const availabilityLabel = availabilityOption?.label ?? "No definida"

  const copyEmail = async () => {
    if (!user.email) return
    await navigator.clipboard.writeText(user.email)
    setEmailCopied(true)
    setTimeout(() => setEmailCopied(false), 2000)
  }

  const displayName = useMemo(
    () => (user.full_name ? formatShortDisplayName(user.full_name) : "Estudiante"),
    [user.full_name],
  )


  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 space-y-6">
      <section className="rounded-[22px] border border-violet-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
        {/* Banner */}
        <div className={`relative h-44 w-full ${TW_UTOPP_GRADIENT_R} md:h-56`} />

        {/* Content Container with Padding */}
        <div className="px-6 pb-6 pt-4">
          {/* Two-Column Grid matching the mockup */}
          <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 items-start">
            
            {/* Left Column: Avatar & Profile Info */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left relative px-2">
              {/* Avatar (overlapping the banner) */}
              <div className="relative -mt-20 mb-4 md:-mt-24 md:mb-5 h-28 w-28 md:h-32 md:w-32 rounded-full bg-white p-1 ring-4 ring-[#C026D3] shadow-lg z-10">
              <div className="h-full w-full overflow-hidden rounded-full bg-gray-50">
                <ProfileAvatar
                  name={user.full_name}
                  userId={user.id}
                  imageUrl={avatarUrl}
                  size="lg"
                  fallbackClassName="bg-gradient-to-br from-fuchsia-500 to-violet-600"
                />
              </div>
          </div>

          {/* Name & Details */}
          <h1 className="text-2xl font-black tracking-tight text-gray-900 md:text-3xl uppercase leading-none break-words w-full">
            {displayName}
          </h1>
          <p className="mt-2 text-xs md:text-sm font-semibold text-gray-600 leading-snug">
            {careerLabel}{user.cycle ? ` · Ciclo ${user.cycle}` : ""}
          </p>

          {user.email && (
            <div className="mt-3 flex items-center justify-center md:justify-start gap-1.5 text-xs md:text-sm text-gray-500 font-medium">
              <Mail className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="truncate max-w-[200px]">{user.email}</span>
              <button
                onClick={copyEmail}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                title="Copiar correo"
              >
                {emailCopied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Cards, Orgs */}
        <div className="space-y-6">
          {/* Fila de Métricas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <ProfileMetricCard
              locked
              label="Asistencia"
              value="12"
              subValue="Eventos este ciclo"
              icon={<BarChart3 className="h-5 w-5 text-violet-500" />}
              iconBg="bg-violet-50"
              textColor="text-violet-700"
            />
            <ProfileMetricCard
              label="Disponibilidad"
              value={availabilityLabel}
              icon={<Clock className="h-5 w-5 text-amber-500" />}
              iconBg="bg-amber-50"
              textColor="text-amber-700"
            />
            <ProfileMetricCard grayPlaceholder placeholderText="Publicaciones" />
            <ProfileMetricCard grayPlaceholder placeholderText="Funcionalidad Extra" />
          </div>

          {/* Mis Organizaciones */}
          <section className={`rounded-[22px] ${TW_UTOPP_GRADIENT_R} p-6 shadow-md text-white`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold tracking-tight">Mis organizaciones</h2>
              <span className="text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md px-3 py-1 rounded-full select-none">
                Siguiendo {followingOrganizations.length}
              </span>
            </div>

            {followingOrganizations.length === 0 ? (
              <p className="text-sm text-violet-100 italic py-4">Este estudiante aún no sigue organizaciones.</p>
            ) : (
              <div className="flex flex-wrap gap-4 pt-2">
                {followingOrganizations.map((org) => (
                  <div key={org.id} className="flex flex-col items-center gap-2 group cursor-pointer">
                    {/* Círculo Blanco con logo/iniciales */}
                    <div className="h-20 w-20 rounded-full bg-white p-1 shadow-md transition-transform group-hover:scale-105 duration-200 flex items-center justify-center overflow-hidden">
                      {org.profile_image_url ? (
                        <img
                          src={resolveOrgImageUrl(org.profile_image_url) ?? org.profile_image_url}
                          alt={org.full_name ?? "org"}
                          className="h-full w-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="text-2xl font-black text-violet-600 select-none">
                          {(org.full_name ?? "O").charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    {/* Nombre de la Organización */}
                    <span className="text-xs font-bold text-white/90 truncate max-w-[96px] text-center">
                      {org.full_name ?? `Org ${org.id}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  </section>
</div>
  )
}


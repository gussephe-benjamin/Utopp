import { type ChangeEvent, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  Check,
  Copy,
  Pencil,
  Mail,
  GraduationCap,
  BookOpen,
  User,
  X,
  Settings2,
  AlertCircle,
  Camera,
  Loader2,
  BarChart3,
  Clock,
  FileText,
  Trophy,
} from "lucide-react"
import { AVAILABILITY_OPTIONS, CAREER_OPTIONS } from "../constants/profileOptions"
import type { OrganizationSummary } from "../../../api/users.api"
import type { FeedPostOut } from "../../../types/post.types"
import type { ProfileUserData } from "./types"
import { PostCard } from "../../feed/components/PostCard"
import { TW_UTOPP_GRADIENT_R } from "../../../shared/constants/brand"
import { EditProfileModal } from "../components/EditProfileModal"
import { OrganizationsManagerModal } from "../components/OrganizationsManagerModal"

interface StudentProfileSelfProps {
  user: ProfileUserData
  avatarUrl: string | null
  eventSavedPosts: FeedPostOut[]
  followingOrganizations: OrganizationSummary[]
  allOrganizations: OrganizationSummary[]
  onSaveProfile: (payload: { cycle: number; availability: number }) => Promise<void>
  onFollowOrganization: (orgId: number) => Promise<void>
  onUnfollowOrganization: (orgId: number) => Promise<void>
  onCloseOrganizationsManager?: (unfollowedIds?: Set<number>) => void
  profileSaving: boolean
  avatarSaving: boolean
  avatarError: string | null
  orgActionId: number | null
  orgError: string | null
  onChangeAvatar: (file: File) => Promise<void>
  onDismissAvatarError: () => void
  onDismissOrgError: () => void
  onSavedPostEdited: (post: FeedPostOut) => void
  onSavedPostUnsaved: (postId: number) => void
}

export function StudentProfileSelf({
  user,
  avatarUrl,
  eventSavedPosts,
  followingOrganizations,
  allOrganizations,
  onSaveProfile,
  onFollowOrganization,
  onUnfollowOrganization,
  onCloseOrganizationsManager,
  profileSaving,
  avatarSaving,
  avatarError,
  orgActionId,
  orgError,
  onChangeAvatar,
  onDismissAvatarError,
  onDismissOrgError,
  onSavedPostEdited,
  onSavedPostUnsaved,
}: StudentProfileSelfProps) {
  const [emailCopied, setEmailCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [managingOrgs, setManagingOrgs] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const careerLabel = useMemo(
    () => CAREER_OPTIONS.find((career) => career.id === user.career)?.label ?? user.career ?? "No definida",
    [user.career],
  )

  const availabilityOption = useMemo(
    () => AVAILABILITY_OPTIONS.find((item) => item.id === (user.availability ?? 0)),
    [user.availability],
  )
  const availabilityLabel = availabilityOption?.label ?? "No definida"
  const availabilityEmoji = availabilityOption?.emoji ?? "⏰"
  const roleLabel = user.role_name ?? "Estudiante"

  const copyEmail = async () => {
    if (!user.email) return
    await navigator.clipboard.writeText(user.email)
    setEmailCopied(true)
    setTimeout(() => setEmailCopied(false), 2000)
  }

  const handleSubmitEdit = async (payload: { cycle: number; availability: number }) => {
    await onSaveProfile(payload)
    setEditing(false)
  }

  const handleAvatarFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await onChangeAvatar(file)
    event.target.value = ""
  }

  const avatarInitial = (user.full_name ?? "U").charAt(0).toUpperCase()

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 space-y-6">
      <AnimatePresence>
        {editing && (
          <EditProfileModal
            initialCycle={user.cycle ?? 1}
            initialAvailability={user.availability ?? 0}
            saving={profileSaving}
            onClose={() => setEditing(false)}
            onSubmit={handleSubmitEdit}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {managingOrgs && (
          <OrganizationsManagerModal
            followingOrganizations={followingOrganizations}
            allOrganizations={allOrganizations}
            currentUserId={user.id}
            orgActionId={orgActionId}
            onFollow={onFollowOrganization}
            onUnfollow={onUnfollowOrganization}
            onClose={(unfollowedIds) => {
              setManagingOrgs(false)
              if (unfollowedIds) {
                onCloseOrganizationsManager?.(unfollowedIds)
              }
            }}
          />
        )}
      </AnimatePresence>

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
                <div className="h-full w-full overflow-hidden rounded-full bg-gray-50 flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-4xl font-bold text-[#C026D3] select-none">
                      {avatarInitial}
                    </div>
                  )}
                </div>

                {/* Botón cambiar foto de perfil */}
                <button
                  type="button"
                  disabled={avatarSaving}
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute right-0 bottom-0 inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-150 bg-white text-gray-600 shadow-md hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 transition-all active:scale-90"
                  title="Cambiar foto de perfil"
                >
                  {avatarSaving ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin text-[#C026D3]" />
                  ) : (
                    <Camera className="h-4 w-4 text-[#C026D3]" />
                  )}
                </button>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFileChange}
              />

              {/* Name & Details */}
              <h1 className="text-2xl font-black tracking-tight text-gray-900 md:text-3xl uppercase leading-none break-words w-full">
                {user.full_name ?? "Estudiante"}
              </h1>
              <p className="mt-2 text-xs md:text-sm font-semibold text-gray-600 leading-snug">
                {careerLabel} {user.cycle ? `· Ciclo ${user.cycle}` : ""} · UTEC
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

              {/* Botón Editar Perfil */}
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-white px-4 py-1.5 text-xs font-bold text-violet-700 shadow-sm hover:bg-violet-50 transition-all active:scale-95 w-full justify-center md:w-auto"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar perfil
              </button>
            </div>

            {/* Right Column: Cards, Orgs */}
            <div className="space-y-6">
              {/* Fila de Métricas */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  label="Asistencia"
                  value="12"
                  subValue="Eventos este ciclo"
                  icon={<BarChart3 className="h-5 w-5 text-violet-500" />}
                  iconBg="bg-violet-50"
                  textColor="text-violet-700"
                />
                <MetricCard
                  label="Disponibilidad"
                  value={availabilityLabel}
                  icon={<Clock className="h-5 w-5 text-amber-500" />}
                  iconBg="bg-amber-50"
                  textColor="text-amber-700"
                />
                <MetricCard
                  grayPlaceholder
                  placeholderText="Publicaciones"
                />
                <MetricCard
                  grayPlaceholder
                  placeholderText="Funcionalidad Extra"
                />
              </div>

              {/* Mis Organizaciones */}
              <section className={`rounded-[22px] ${TW_UTOPP_GRADIENT_R} p-6 shadow-md text-white`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold tracking-tight">Mis organizaciones</h2>
                  <button
                    type="button"
                    onClick={() => setManagingOrgs(true)}
                    className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 px-3 py-1 text-xs font-semibold text-white transition-all active:scale-95"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    Ver todas
                  </button>
                </div>

                {followingOrganizations.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => setManagingOrgs(true)}
                    className="block w-full rounded-[18px] border border-dashed border-white/30 bg-white/5 px-3 py-6 text-center text-sm text-white hover:bg-white/10 transition-colors"
                  >
                    Aún no sigues organizaciones. Haz clic para gestionarlas.
                  </button>
                ) : (
                  <div className="flex flex-wrap gap-4 pt-2">
                    {followingOrganizations.map((org) => (
                      <div
                        key={org.id}
                        onClick={() => setManagingOrgs(true)}
                        className="flex flex-col items-center gap-2 group cursor-pointer"
                      >
                        {/* Círculo Blanco con logo/iniciales */}
                        <div className="h-20 w-20 rounded-full bg-white p-1 shadow-md transition-transform group-hover:scale-105 duration-200 flex items-center justify-center overflow-hidden">
                          {org.profile_image_url ? (
                            <img
                              src={org.profile_image_url}
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

              {/* Eventos Guardados */}
              <section className="space-y-4 pt-6 border-t border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Eventos guardados</h2>
                {eventSavedPosts.length === 0 ? (
                  <div className="rounded-[22px] border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center text-sm text-gray-500">
                    No tienes eventos guardados por ahora. Los eventos que guardes desde el feed aparecerán aquí.
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {eventSavedPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        currentUserId={user.id}
                        onEdited={onSavedPostEdited}
                        onDeleted={onSavedPostUnsaved}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>

          </div>
        </div>
      </section>

      {/* Alertas de error (abajo) */}
      <div className="space-y-3">
        {orgError && (
          <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">{orgError}</div>
            <button
              type="button"
              onClick={onDismissOrgError}
              className="rounded p-0.5 hover:bg-rose-100"
              aria-label="Cerrar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {avatarError && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">{avatarError}</div>
            <button
              type="button"
              onClick={onDismissAvatarError}
              className="rounded p-0.5 hover:bg-amber-100"
              aria-label="Cerrar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  subValue,
  icon,
  iconBg = "bg-purple-50",
  textColor = "text-purple-600",
  grayPlaceholder,
  placeholderText,
}: {
  label?: string
  value?: string
  subValue?: string
  icon?: React.ReactNode
  iconBg?: string
  textColor?: string
  grayPlaceholder?: boolean
  placeholderText?: string
}) {
  if (grayPlaceholder) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 p-4 text-center aspect-square shadow-[0_4px_20px_rgba(0,0,0,0.005)]">
        <span className="text-xs font-bold text-gray-400 leading-snug">
          {placeholderText}
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start justify-between rounded-xl border border-gray-200 bg-white p-4 aspect-square shadow-[0_4px_20px_rgba(0,0,0,0.005)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.015)] transition-shadow duration-300">
      <div className={`p-1.5 ${iconBg} rounded-lg mb-2`}>
        {icon}
      </div>
      <div className="flex-1 flex flex-col justify-end w-full">
        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 leading-none mb-1">
          {label}
        </span>
        <span className={`text-sm md:text-base font-black ${textColor} leading-tight break-words max-w-full`}>
          {value}
        </span>
        {subValue && (
          <span className="mt-1 text-[9px] font-semibold text-gray-400 leading-none">
            {subValue}
          </span>
        )}
      </div>
    </div>
  )
}

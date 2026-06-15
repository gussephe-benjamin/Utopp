import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ProfileLink } from "../components/ProfileLink"
import { AnimatePresence, motion } from "framer-motion"
import {
  Check,
  Copy,
  Pencil,
  Mail,
  X,
  Settings2,
  AlertCircle,
  Camera,
  Loader2,
  BarChart3,
  Clock,
  Trophy,
  Bookmark,
  LogOut,
  Sparkles,
  FileText,
  Archive,
  Plus,
} from "lucide-react"
import { useAuth } from "../../../auth/useAuth"
import { AVAILABILITY_OPTIONS, CAREER_OPTIONS } from "../constants/profileOptions"
import type { OrganizationSummary } from "../../../api/users.api"
import type { FeedPostOut } from "../../../types/post.types"
import type { ProfileUserData } from "./types"
import { ProfileMetricCard } from "../components/ProfileMetricCard"
import { ProfilePostItem } from "../components/ProfilePostItem"
import { TW_UTOPP_GRADIENT_R } from "../../../shared/constants/brand"
import { formatShortDisplayName } from "../../feed/lib/display"
import {
  ProfileSettingsModal,
  type ProfileSettingsPayload,
} from "../components/ProfileSettingsModal"
import { OrganizationsManagerModal } from "../components/OrganizationsManagerModal"
import { INTERESTS } from "../../../constants/interests"
import { resolveAvatarUrl, resolveOrgImageUrl } from "../../../shared/lib/cloudinaryUrl"
import { isProfileSettingsIncomplete } from "../lib/profileSettingsComplete"

interface StudentProfileSelfProps {
  user: ProfileUserData
  avatarUrl: string | null
  posts: FeedPostOut[]
  eventSavedPosts: FeedPostOut[]
  followingOrganizations: OrganizationSummary[]
  allOrganizations: OrganizationSummary[]
  onSaveProfile: (payload: ProfileSettingsPayload) => Promise<void>
  openSettingsOnMount?: boolean
  onSettingsOpened?: () => void
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
  onPostEdited: (post: FeedPostOut) => void
  onPostDeleted: (postId: number) => void
  onOpenCreate?: () => void
}

export function StudentProfileSelf({
  user,
  avatarUrl,
  posts,
  eventSavedPosts,
  followingOrganizations,
  allOrganizations,
  onSaveProfile,
  openSettingsOnMount = false,
  onSettingsOpened,
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
  onPostEdited,
  onPostDeleted,
  onOpenCreate,
}: StudentProfileSelfProps) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [emailCopied, setEmailCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [managingOrgs, setManagingOrgs] = useState(false)
  const [activeTab, setActiveTab] = useState<"posts" | "saved" | "archived">("posts")
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

  const copyEmail = async () => {
    if (!user.email) return
    await navigator.clipboard.writeText(user.email)
    setEmailCopied(true)
    setTimeout(() => setEmailCopied(false), 2000)
  }

  const handleSubmitEdit = async (payload: ProfileSettingsPayload) => {
    await onSaveProfile(payload)
    setEditing(false)
  }

  const handleAvatarFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await onChangeAvatar(file)
    event.target.value = ""
  }

  const displayName = useMemo(
    () => (user.full_name ? formatShortDisplayName(user.full_name) : "Estudiante"),
    [user.full_name],
  )

  const avatarInitial = (user.full_name ?? "U").charAt(0).toUpperCase()

  const settingsIncomplete = useMemo(
    () =>
      isProfileSettingsIncomplete({
        interests: user.interests,
        availability: user.availability,
        weekly_availability: user.weekly_availability,
      }),
    [user.interests, user.availability, user.weekly_availability],
  )

  const filteredPosts = useMemo(() => {
    if (activeTab === "posts") {
      return posts.filter((p) => p.status === "published" || !p.status)
    }
    if (activeTab === "archived") {
      return posts.filter((p) => p.status === "archived")
    }
    return eventSavedPosts
  }, [posts, eventSavedPosts, activeTab])

  useEffect(() => {
    if (openSettingsOnMount) {
      setEditing(true)
      onSettingsOpened?.()
    }
  }, [openSettingsOnMount, onSettingsOpened])

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
      <AnimatePresence>
        {editing && (
          <ProfileSettingsModal
            initialCycle={user.cycle ?? 1}
            initialAvailability={user.availability ?? 0}
            initialInterests={user.interests ?? []}
            initialWeeklyAvailability={user.weekly_availability}
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

      {settingsIncomplete && (
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-violet-200 bg-violet-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
            <p className="text-sm font-medium text-violet-900">
              Completa tu configuración para personalizar recomendaciones de eventos.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="shrink-0 rounded-full bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700 transition-colors"
          >
            Configurar perfil
          </button>
        </div>
      )}

      {/* ─── Cabecera con banner y avatar ─────────────────────────────── */}
      <section className="rounded-[22px] border border-violet-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
        {/* Banner */}
        <div className={`relative h-44 w-full ${TW_UTOPP_GRADIENT_R} md:h-56`}>
          {/* Avatar con borde de color de marca fucsia */}
          <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 md:left-10 md:translate-x-0">
            <div className="relative h-28 w-28 rounded-full bg-white p-1 ring-4 ring-[#C026D3] shadow-lg md:h-32 md:w-32">
              <div className="h-full w-full overflow-hidden rounded-full bg-gray-50 flex items-center justify-center">
                {avatarUrl ? (
                  <img src={resolveAvatarUrl(avatarUrl) ?? avatarUrl} alt="avatar" className="h-full w-full object-cover" />
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
          </div>
        </div>

        {/* Nombre, carrera y correo */}
        <div className="px-6 pt-16 pb-5 text-center md:pt-4 md:text-left">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:pl-[152px]">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-black tracking-tight text-gray-900 md:text-3xl uppercase leading-none break-words w-full">
                {displayName}
              </h1>
              <p className="mt-2 text-xs md:text-sm font-semibold text-gray-600 leading-snug">
                {careerLabel}{user.cycle ? ` · Ciclo ${user.cycle}` : ""}
              </p>

              {user.email && (
                <div className="mt-1.5 flex items-center justify-center md:justify-start gap-1.5 text-sm text-gray-600">
                  <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="font-medium truncate max-w-[250px]">{user.email}</span>
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

            {/* Botón Editar Perfil y Cerrar Sesión */}
            <div className="mt-3 md:mt-0 flex justify-center md:justify-end md:pb-1 shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-white px-3.5 py-1.5 text-xs font-bold text-violet-700 shadow-sm hover:bg-violet-50 transition-all active:scale-95"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar perfil
              </button>
              <button
                type="button"
                onClick={() => {
                  logout()
                  navigate("/login")
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-3.5 py-1.5 text-xs font-bold text-red-600 shadow-sm hover:bg-red-50 transition-all active:scale-95"
              >
                <LogOut className="h-3.5 w-3.5" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Alertas de error */}
      {avatarError && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
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

      {/* ─── Métricas ─── */}
      <section className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
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
          subValue={availabilityEmoji}
          icon={<Clock className="h-5 w-5 text-amber-500" />}
          iconBg="bg-amber-50"
          textColor="text-amber-700"
        />
        <ProfileMetricCard
          label="Organizaciones seguidas"
          value={`${followingOrganizations.length}`}
          icon={<Trophy className="h-5 w-5 text-fuchsia-500" />}
          iconBg="bg-fuchsia-50"
          textColor="text-fuchsia-700"
        />
        <ProfileMetricCard
          label="Eventos guardados"
          value={`${eventSavedPosts.length}`}
          icon={<Bookmark className="h-5 w-5 text-blue-500" />}
          iconBg="bg-blue-50"
          textColor="text-blue-700"
        />
      </section>

      {/* ─── Dos Columnas ─── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Columna Izquierda (Sidebar) */}
        <div className="space-y-6">
          {/* Mis Organizaciones */}
          <article className="rounded-[22px] border border-violet-100 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Mis organizaciones
              </h2>
              <button
                type="button"
                onClick={() => setManagingOrgs(true)}
                className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-white hover:bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700 transition-all active:scale-95 shadow-sm"
              >
                <Settings2 className="h-3.5 w-3.5" />
                Ver todas
              </button>
            </div>

            {followingOrganizations.length === 0 ? (
              <button
                type="button"
                onClick={() => setManagingOrgs(true)}
                className="block w-full rounded-[18px] border border-dashed border-gray-200 bg-gray-50/50 px-3 py-6 text-center text-sm text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Aún no sigues organizaciones. Haz clic para gestionarlas.
              </button>
            ) : (
              <div className="flex flex-wrap gap-4 pt-2 justify-center sm:justify-start">
                {followingOrganizations.map((org) => (
                  <ProfileLink
                    key={org.id}
                    userId={org.id}
                    currentUserId={user.id}
                    className="flex flex-col items-center gap-2 group"
                  >
                    {/* Círculo con logo/iniciales */}
                    <div className="h-16 w-16 rounded-full bg-white p-0.5 border border-gray-100 shadow-sm transition-transform group-hover:scale-105 duration-200 flex items-center justify-center overflow-hidden">
                      {org.profile_image_url ? (
                        <img
                          src={resolveOrgImageUrl(org.profile_image_url) ?? org.profile_image_url}
                          alt={org.full_name ?? "org"}
                          className="h-full w-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="text-xl font-black text-violet-600 select-none">
                          {(org.full_name ?? "O").charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    {/* Nombre de la Organización */}
                    <span className="text-[11px] font-bold text-gray-600 group-hover:text-violet-600 transition-colors truncate max-w-[80px] text-center">
                      {org.full_name ?? `Org ${org.id}`}
                    </span>
                  </ProfileLink>
                ))}
              </div>
            )}
          </article>

          {/* Intereses */}
          <article className="rounded-[22px] border border-violet-100 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              Intereses
            </h2>
            {(!user.interests || user.interests.length === 0) ? (
              <p className="text-xs text-gray-400 italic">Sin intereses seleccionados.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {user.interests.map((interestId) => {
                  const item = INTERESTS.find((i) => i.id === interestId)
                  if (!item) return null
                  return (
                    <span
                      key={interestId}
                      className="inline-flex items-center gap-1 rounded-full bg-violet-50 border border-violet-100/50 px-2.5 py-1 text-xs font-semibold text-violet-700"
                    >
                      <item.icon className="h-3 w-3" />
                      {item.label}
                    </span>
                  )
                })}
              </div>
            )}
          </article>
        </div>

        {/* Columna Derecha (Publicaciones y guardados) */}
        <div className="space-y-4">
          <div className="flex flex-col gap-3 border-b border-gray-150 pb-2 sm:flex-row sm:items-center sm:justify-between">
            <nav className="flex flex-wrap gap-4">
              <TabButton
                id="posts"
                active={activeTab === "posts"}
                onClick={() => setActiveTab("posts")}
                label="Mis publicaciones"
                icon={<FileText className="h-4 w-4" />}
              />
              <TabButton
                id="saved"
                active={activeTab === "saved"}
                onClick={() => setActiveTab("saved")}
                label="Eventos guardados"
                icon={<Bookmark className="h-4 w-4" />}
              />
              <TabButton
                id="archived"
                active={activeTab === "archived"}
                onClick={() => setActiveTab("archived")}
                label="Archivados"
                icon={<Archive className="h-4 w-4" />}
              />
            </nav>
            {onOpenCreate && (
              <button
                type="button"
                onClick={onOpenCreate}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:from-purple-700 hover:to-blue-700 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                Nueva publicación
              </button>
            )}
          </div>

          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
                {activeTab === "posts" && (
                  <>
                    Aún no has publicado nada.
                    {onOpenCreate ? (
                      <>
                        {" "}
                        <button
                          type="button"
                          onClick={onOpenCreate}
                          className="font-semibold text-violet-600 hover:text-violet-700 underline underline-offset-2"
                        >
                          Crea tu primera publicación
                        </button>
                        .
                      </>
                    ) : (
                      " Crea una publicación desde el feed."
                    )}
                  </>
                )}
                {activeTab === "saved" && "No tienes eventos guardados por ahora. Los eventos que guardes desde el feed aparecerán aquí."}
                {activeTab === "archived" && "No tienes publicaciones archivadas."}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredPosts.map((post) => (
                  <ProfilePostItem
                    key={post.id}
                    post={post}
                    currentUserId={user.id}
                    onEdited={activeTab === "saved" ? onSavedPostEdited : onPostEdited}
                    onDeleted={activeTab === "saved" ? onSavedPostUnsaved : onPostDeleted}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {orgError && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
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
    </div>
  )
}

interface TabButtonProps {
  id: string
  active: boolean
  onClick: () => void
  label: string
  icon: React.ReactNode
}

function TabButton({ active, onClick, label, icon }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1.5 py-2 px-1 text-sm font-semibold transition-colors ${
        active ? "text-violet-600" : "text-gray-500 hover:text-gray-800"
      }`}
    >
      {icon}
      <span>{label}</span>
      {active && (
        <motion.div
          layoutId="studentActiveTabLine"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
    </button>
  )
}

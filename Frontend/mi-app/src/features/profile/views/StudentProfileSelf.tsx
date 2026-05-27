import { type ChangeEvent, useMemo, useRef, useState } from "react"
import {
  Check,
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
} from "lucide-react"
import { AVAILABILITY_OPTIONS, CAREER_OPTIONS } from "../constants/profileOptions"
import type { OrganizationSummary } from "../../../api/users.api"
import type { FeedPostOut } from "../../../types/post.types"
import type { ProfileUserData } from "./types"
import { PostCard } from "../../feed/components/PostCard"
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

/**
 * Vista de perfil interno para alumno (propietario).
 *
 * Layout:
 *  - Banner con avatar superpuesto (centrado en móvil, izquierda en desktop).
 *    Nombre y carrera se ubican debajo (móvil) o a la derecha (desktop) del
 *    avatar, sin colisión con el botón "Editar perfil".
 *  - Grid 2 columnas en desktop bajo el banner:
 *      - Columna izquierda: Información personal + Métricas + Mis organizaciones.
 *      - Columna derecha: Eventos guardados (formato PostCard del feed).
 *    En móvil todo se apila verticalmente.
 *  - La sección de "Mis organizaciones" tiene botón "Ver más" que abre un
 *    modal con buscador para seguir/dejar de seguir desde un solo lugar.
 */
export function StudentProfileSelf({
  user,
  avatarUrl,
  eventSavedPosts,
  followingOrganizations,
  allOrganizations,
  onSaveProfile,
  onFollowOrganization,
  onUnfollowOrganization,
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
    () =>
      CAREER_OPTIONS.find((career) => career.id === user.career)?.label ?? user.career ?? "No definida",
    [user.career],
  )

  const availabilityOption = useMemo(
    () => AVAILABILITY_OPTIONS.find((item) => item.id === (user.availability ?? 0)),
    [user.availability],
  )
  const availabilityLabel = availabilityOption?.label ?? "No definida"
  const availabilityEmoji = availabilityOption?.emoji ?? ""
  const roleLabel = user.role_name ?? "Alumno"

  const copyEmail = async () => {
    if (!user.email) return
    await navigator.clipboard.writeText(user.email)
    setEmailCopied(true)
    setTimeout(() => setEmailCopied(false), 1500)
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
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
      {editing ? (
        <EditProfileModal
          initialCycle={user.cycle ?? 1}
          initialAvailability={user.availability ?? 0}
          saving={profileSaving}
          onClose={() => setEditing(false)}
          onSubmit={handleSubmitEdit}
        />
      ) : null}

      {managingOrgs ? (
        <OrganizationsManagerModal
          followingOrganizations={followingOrganizations}
          allOrganizations={allOrganizations}
          currentUserId={user.id}
          orgActionId={orgActionId}
          onFollow={onFollowOrganization}
          onUnfollow={onUnfollowOrganization}
          onClose={() => setManagingOrgs(false)}
        />
      ) : null}

      {/* ─── Cabecera con banner ─────────────────────────────── */}
      <section className="rounded-2xl border border-violet-100 bg-white shadow-sm">
        <div className="relative h-44 w-full rounded-t-2xl bg-gradient-to-r from-[#6f46ff] via-[#8d5dff] to-[#aa7cff] md:h-56">
          {/* Avatar: centrado en móvil, izquierda en desktop. Mismo posicionamiento absoluto. */}
          <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 md:left-10 md:translate-x-0">
            <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-md md:h-32 md:w-32">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-violet-300">
                  {avatarInitial}
                </div>
              )}
            </div>
            <button
              type="button"
              disabled={avatarSaving}
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -right-1 -bottom-1 inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-violet-600 text-white shadow-md transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              title="Cambiar foto de perfil"
              aria-label="Cambiar foto de perfil"
            >
              {avatarSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileChange}
            />
          </div>
        </div>

        {/* Cuerpo del header con padding superior que reserva espacio para el avatar */}
        <div className="px-4 pt-16 pb-5 text-center md:px-6 md:pt-5 md:text-left">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between md:gap-4 md:pl-[160px]">
            <div>
              <h1 className="text-2xl font-bold leading-tight text-gray-900 md:text-3xl">
                {user.full_name ?? "Usuario"}
              </h1>
              <p className="mt-1 text-sm text-gray-600">{careerLabel}</p>
            </div>
            <div className="flex justify-center md:justify-end md:pb-1">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-white px-3.5 py-1.5 text-xs font-bold text-violet-700 shadow-sm hover:bg-violet-50"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar perfil
              </button>
            </div>
          </div>
        </div>
      </section>

      {orgError ? (
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
      ) : null}

      {avatarError ? (
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
      ) : null}

      {/* ─── Layout principal: izquierda (info) | derecha (publicaciones) ─── */}
      <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        {/* Columna izquierda: información, métricas y organizaciones */}
        <div className="flex min-w-0 w-full flex-col gap-4">
          <article className="w-full rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">
              Información
            </h2>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase text-gray-400">Correo</p>
                  <button
                    type="button"
                    onClick={copyEmail}
                    className="group mt-0.5 inline-flex max-w-full items-center gap-1 rounded-md px-1 py-0.5 text-left text-gray-900 transition hover:bg-violet-50"
                    title="Haz clic para copiar el correo"
                  >
                    <span className="truncate underline-offset-2 group-hover:underline">
                      {user.email ?? "Sin correo"}
                    </span>
                    {emailCopied ? <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" /> : null}
                  </button>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <User className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400">Rol</p>
                  <p className="text-gray-900">{roleLabel}</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400">Carrera</p>
                  <p className="text-gray-900">{careerLabel}</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400">Ciclo</p>
                  <p className="text-gray-900">Ciclo {user.cycle ?? "-"}</p>
                </div>
              </li>
            </ul>
          </article>

          <article className="w-full rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500 sm:mb-4">
              Métricas
            </h2>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
              <MetricCard
                label="Disponibilidad"
                value={`${availabilityEmoji} ${availabilityLabel}`.trim()}
              />
              <MetricCard label="Próxima métrica" value="—" />
              <MetricCard label="Próxima métrica" value="—" />
              <MetricCard label="Próxima métrica" value="—" />
            </div>
          </article>

          <article className="w-full overflow-hidden rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">
                Mis organizaciones
              </h2>
              <button
                type="button"
                onClick={() => setManagingOrgs(true)}
                className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-white px-2.5 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-50"
              >
                <Settings2 className="h-3 w-3" />
                Ver más
              </button>
            </div>
            {followingOrganizations.length === 0 ? (
              <button
                type="button"
                onClick={() => setManagingOrgs(true)}
                className="block w-full rounded-lg border border-dashed border-violet-200 bg-violet-50/40 px-3 py-4 text-center text-sm text-violet-700 hover:bg-violet-50"
              >
                Aún no sigues organizaciones. Haz clic para gestionarlas.
              </button>
            ) : (
              <ul className="grid gap-2.5">
                {followingOrganizations.slice(0, 5).map((org) => (
                  <li
                    key={org.id}
                    className="flex min-w-0 items-center justify-between gap-3 overflow-hidden rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white">
                        {org.profile_image_url ? (
                          <img
                            src={org.profile_image_url}
                            alt={org.full_name ?? "org"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-bold text-violet-400">
                            {(org.full_name ?? "O").charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {org.full_name ?? `Org ${org.id}`}
                        </p>
                        <p className="text-xs text-gray-500">{org.followers_count} seguidores</p>
                      </div>
                    </div>
                    <div className="ml-2 shrink-0">
                      <button
                        type="button"
                        disabled={orgActionId === org.id}
                        onClick={() => onUnfollowOrganization(org.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-white disabled:opacity-50"
                        title="Quitar organización"
                      >
                        <X className="h-3 w-3" />
                        Quitar
                      </button>
                    </div>
                  </li>
                ))}
                {followingOrganizations.length > 5 ? (
                  <li>
                    <button
                      type="button"
                      onClick={() => setManagingOrgs(true)}
                      className="block w-full rounded-lg border border-dashed border-violet-200 bg-white px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-50"
                    >
                      Ver todas ({followingOrganizations.length})
                    </button>
                  </li>
                ) : null}
              </ul>
            )}
          </article>
        </div>

        {/* Columna derecha: Eventos guardados */}
        <div className="min-w-0 w-full">
          <div className="mx-auto w-full max-w-[700px] lg:max-w-[680px]">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Eventos guardados</h2>
          </div>
          {eventSavedPosts.length === 0 ? (
            <div className="mx-auto w-full max-w-[700px] rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500 lg:max-w-[680px]">
              No tienes eventos guardados por ahora. Los eventos que guardes desde el feed aparecerán aquí.
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-[700px] flex-col gap-4 lg:max-w-[680px]">
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
        </div>
      </section>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center rounded-xl border border-gray-100 bg-gray-50 p-2.5 text-center sm:p-3">
      <p className="w-full break-words text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 w-full break-words text-xs font-bold leading-snug text-gray-900 sm:mt-1.5 sm:text-sm">
        {value}
      </p>
    </div>
  )
}

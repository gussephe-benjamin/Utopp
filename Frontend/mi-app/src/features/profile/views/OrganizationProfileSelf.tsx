import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import {
  Check,
  Copy,
  Pencil,
  Mail,
  Globe,
  Instagram,
  Linkedin,
  Youtube,
  Send,
  MessageSquare,
  Link as LinkIcon,
  Camera,
  Loader2,
  AlertCircle,
  X,
  FileText,
  Bookmark,
  Archive,
  BarChart3,
  Star,
  Users,
  LogOut,
} from "lucide-react"
import { useAuth } from "../../../auth/useAuth"
import type { ProfileUserData } from "./types"
import type { FeedPostOut } from "../../../types/post.types"
import { ProfileMetricCard } from "../components/ProfileMetricCard"
import { ProfilePostItem } from "../components/ProfilePostItem"
import { EditOrgProfileModal } from "../components/EditOrgProfileModal"
import { INTERESTS } from "../../../constants/interests"
import { TW_UTOPP_GRADIENT_R } from "../../../shared/constants/brand"
import { resolveAvatarUrl } from "../../../shared/lib/cloudinaryUrl"

interface OrganizationProfileSelfProps {
  user: ProfileUserData
  avatarUrl: string | null
  posts: FeedPostOut[]
  savedPosts: FeedPostOut[]
  savingProfile: boolean
  avatarSaving: boolean
  avatarError: string | null
  onSaveProfile: (payload: {
    fullName: string
    description: string
    contacts: Record<string, string>
    interests: string[]
  }) => Promise<void>
  onChangeAvatar: (file: File) => Promise<void>
  onDismissAvatarError: () => void
  onPostEdited: (post: FeedPostOut) => void
  onPostDeleted: (postId: number) => void
}

type TabType = "posts" | "saved" | "archived"

function getContactIcon(key: string) {
  const lower = key.toLowerCase()
  if (lower.includes("instagram") || lower.includes("ig")) {
    return <Instagram className="h-4.5 w-4.5 text-violet-500 shrink-0" />
  }
  if (lower.includes("linkedin") || lower.includes("li")) {
    return <Linkedin className="h-4.5 w-4.5 text-violet-500 shrink-0" />
  }
  if (lower.includes("website") || lower.includes("web") || lower.includes("pag") || lower.includes("pág") || lower.includes("site")) {
    return <Globe className="h-4.5 w-4.5 text-violet-500 shrink-0" />
  }
  if (lower.includes("youtube") || lower.includes("yt")) {
    return <Youtube className="h-4.5 w-4.5 text-violet-500 shrink-0" />
  }
  if (lower.includes("telegram") || lower.includes("tg")) {
    return <Send className="h-4.5 w-4.5 text-violet-500 shrink-0" />
  }
  if (lower.includes("whatsapp") || lower.includes("wa")) {
    return <MessageSquare className="h-4.5 w-4.5 text-violet-500 shrink-0" />
  }
  return <LinkIcon className="h-4.5 w-4.5 text-violet-500 shrink-0" />
}

function getContactLabel(key: string) {
  return key.charAt(0).toUpperCase() + key.slice(1)
}

export function OrganizationProfileSelf({
  user,
  avatarUrl,
  posts,
  savedPosts,
  savingProfile,
  avatarSaving,
  avatarError,
  onSaveProfile,
  onChangeAvatar,
  onDismissAvatarError,
  onPostEdited,
  onPostDeleted,
}: OrganizationProfileSelfProps) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [emailCopied, setEmailCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>("posts")
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const [searchParams] = useSearchParams()
  const highlightPostId = searchParams.get("postId")
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null)

  useEffect(() => {
    if (highlightPostId) {
      setActiveHighlightId(highlightPostId)
      setActiveTab("posts") // Ensure we are on the posts tab

      const scrollTimer = setTimeout(() => {
        const element = document.getElementById(`post-${highlightPostId}`)
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }, 400)

      const fadeTimer = setTimeout(() => {
        setActiveHighlightId(null)
      }, 3500)

      return () => {
        clearTimeout(scrollTimer)
        clearTimeout(fadeTimer)
      }
    }
  }, [highlightPostId, posts])

  const copyEmail = async () => {
    if (!user.email) return
    await navigator.clipboard.writeText(user.email)
    setEmailCopied(true)
    setTimeout(() => setEmailCopied(false), 2000)
  }

  const handleAvatarFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await onChangeAvatar(file)
    event.target.value = ""
  }

  const filteredPosts = useMemo(() => {
    if (activeTab === "posts") {
      return posts.filter((p) => p.status === "published" || !p.status)
    }
    if (activeTab === "archived") {
      return posts.filter((p) => p.status === "archived")
    }
    return savedPosts
  }, [posts, savedPosts, activeTab])

  const avatarInitial = (user.full_name ?? "O").charAt(0).toUpperCase()

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
      <AnimatePresence>
        {editing && (
          <EditOrgProfileModal
            initialName={user.full_name ?? ""}
            initialDescription={user.description ?? ""}
            initialContacts={user.contacts ?? {}}
            initialInterests={user.interests ?? []}
            saving={savingProfile}
            onClose={() => setEditing(false)}
            onSubmit={async (payload) => {
              await onSaveProfile(payload)
              setEditing(false)
            }}
          />
        )}
      </AnimatePresence>

      {/* ─── Cabecera con banner y avatar ─────────────────────────────── */}
      <section className="rounded-[22px] border border-violet-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
        {/* Banner */}
        <div className={`relative h-44 w-full ${TW_UTOPP_GRADIENT_R} md:h-56`}>
          {/* Avatar con borde de color de marca fucsia y badge "FP" */}
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

        {/* Nombre y correo */}
        <div className="px-6 pt-16 pb-5 text-center md:pt-4 md:text-left">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:pl-[152px]">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-black tracking-tight text-gray-900 md:text-3xl uppercase">
                {user.full_name ?? "Mi Organización"}
              </h1>
              {user.email && (
                <div className="mt-1.5 flex items-center justify-center md:justify-start gap-1.5 text-sm text-gray-600">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{user.email}</span>
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
          label="Alumnos siguiendo totales"
          value={`${user.followers_count ?? 0}`}
          icon={<Users className="h-5 w-5 text-violet-500" />}
          iconBg="bg-violet-50"
          textColor="text-violet-700"
        />
        <ProfileMetricCard
          label="Cantidad de publicaciones"
          value={`${posts.filter((p) => p.status === "published" || !p.status).length}`}
          icon={<FileText className="h-5 w-5 text-blue-500" />}
          iconBg="bg-blue-50"
          textColor="text-blue-700"
        />
        <ProfileMetricCard
          locked
          label="Promedio de satisfacción"
          value={user.satisfaction_score !== undefined && user.satisfaction_score !== null ? `${user.satisfaction_score} ★` : "-"}
          icon={<Star className="h-5 w-5 text-amber-500" />}
          iconBg="bg-amber-50"
          textColor="text-amber-700"
        />
        <ProfileMetricCard
          locked
          label="# promedio de alumnos por evento"
          value={user.avg_students_per_event !== undefined && user.avg_students_per_event !== null ? `${user.avg_students_per_event}` : "-"}
          subValue={user.avg_students_per_event !== undefined && user.avg_students_per_event !== null ? (user.avg_students_per_event === 1 ? "alumno" : "alumnos") : undefined}
          icon={<BarChart3 className="h-5 w-5 text-emerald-500" />}
          iconBg="bg-emerald-50"
          textColor="text-emerald-700"
        />
      </section>

      {/* ─── Dos Columnas ─── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Columna Izquierda */}
        <div className="space-y-6">
          {/* Sobre Nosotros */}
          <article className="rounded-[22px] border border-violet-100 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              Sobre nosotros
            </h2>
            {user.description?.trim() ? (
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {user.description}
              </p>
            ) : (
              <p className="text-xs text-gray-400 italic">
                Aún no hay descripción. Edita tu perfil para agregar información sobre la organización.
              </p>
            )}
          </article>

          {/* Contactos */}
          <article className="rounded-[22px] border border-violet-100 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              Contactos
            </h2>
            <ul className="space-y-3">
              {user.contacts && Object.entries(user.contacts).map(([key, val]) => {
                if (!val || !val.trim()) return null
                const icon = getContactIcon(key)
                const label = getContactLabel(key)
                return (
                  <li key={key} className="flex items-center gap-2.5 text-sm text-gray-600 min-w-0">
                    {icon}
                    <a
                      href={val}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline hover:text-violet-600 truncate min-w-0 flex-1"
                    >
                      {label}
                    </a>
                  </li>
                )
              })}
              {(!user.contacts || Object.keys(user.contacts).length === 0) && (
                <p className="text-xs text-gray-400 italic">No se han registrado redes de contacto.</p>
              )}
            </ul>
          </article>

          {/* Categorías */}
          <article className="rounded-[22px] border border-violet-100 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              Categorías
            </h2>
            {(!user.interests || user.interests.length === 0) ? (
              <p className="text-xs text-gray-400 italic">Sin categorías asociadas.</p>
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

        {/* Columna Derecha (Tabs con indicador animado) */}
        <div className="space-y-4">
          <div className="border-b border-gray-150 pb-2">
            <nav className="flex gap-4">
              <TabButton
                id="posts"
                active={activeTab === "posts"}
                onClick={() => setActiveTab("posts")}
                label="Publicaciones"
                icon={<FileText className="h-4 w-4" />}
              />
              <TabButton
                id="saved"
                active={activeTab === "saved"}
                onClick={() => setActiveTab("saved")}
                label="Guardados"
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
          </div>

          {/* Listado de publicaciones */}
          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
                {activeTab === "posts" && "No has publicado eventos todavía."}
                {activeTab === "saved" && "No tienes eventos guardados."}
                {activeTab === "archived" && "No tienes publicaciones archivadas."}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredPosts.map((post) => (
                  <ProfilePostItem
                    key={post.id}
                    post={post}
                    currentUserId={user.id}
                    highlighted={String(post.id) === activeHighlightId}
                    onEdited={onPostEdited}
                    onDeleted={onPostDeleted}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
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
          layoutId="orgActiveTabLine"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
    </button>
  )
}

import { useState } from "react"
import {
  Check,
  Copy,
  Mail,
  Globe,
  Instagram,
  Linkedin,
  Youtube,
  Send,
  MessageSquare,
  Link as LinkIcon,
  Loader2,
  UserMinus,
  UserPlus,
} from "lucide-react"
import type { ProfileUserData } from "./types"
import type { FeedPostOut } from "../../../types/post.types"
import { PostCard } from "../../feed/components/PostCard"
import { INTERESTS } from "../../../constants/interests"
import { TW_UTOPP_GRADIENT_R } from "../../../shared/constants/brand"

interface OrganizationProfilePublicProps {
  user: ProfileUserData
  avatarUrl: string | null
  posts: FeedPostOut[]
  isFollowing: boolean
  followSaving: boolean
  onFollowToggle: () => Promise<void>
}

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

export function OrganizationProfilePublic({
  user,
  avatarUrl,
  posts,
  isFollowing,
  followSaving,
  onFollowToggle,
}: OrganizationProfilePublicProps) {
  const [emailCopied, setEmailCopied] = useState(false)

  const copyEmail = async () => {
    if (!user.email) return
    await navigator.clipboard.writeText(user.email)
    setEmailCopied(true)
    setTimeout(() => setEmailCopied(false), 2000)
  }

  const avatarInitial = (user.full_name ?? "O").charAt(0).toUpperCase()
  const publishedPosts = posts.filter((p) => p.status === "published" || !p.status)

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
      {/* ─── Cabecera con banner y avatar ─────────────────────────────── */}
      <section className="rounded-[22px] border border-violet-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
        {/* Banner */}
        <div className={`relative h-44 w-full ${TW_UTOPP_GRADIENT_R} md:h-56`}>
          {/* Botón Seguir (Esquina superior derecha en Desktop) */}
          <div className="absolute top-4 right-4 hidden md:block">
            <button
              type="button"
              disabled={followSaving}
              onClick={onFollowToggle}
              className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-75 ${
                isFollowing
                  ? "border border-[#9333EA] bg-white text-[#9333EA] hover:bg-purple-50"
                  : `${TW_UTOPP_GRADIENT_R} text-white hover:brightness-110`
              }`}
            >
              {followSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isFollowing ? (
                <>
                  <UserMinus className="h-3.5 w-3.5" />
                  Dejar de seguir
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5" />
                  Seguir
                </>
              )}
            </button>
          </div>

          {/* Avatar con borde de color de marca fucsia y badge "FP" */}
          <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 md:left-10 md:translate-x-0">
            <div className="relative h-28 w-28 rounded-full bg-white p-1 ring-4 ring-[#C026D3] shadow-lg md:h-32 md:w-32">
              <div className="h-full w-full overflow-hidden rounded-full bg-gray-50 flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="text-4xl font-bold text-[#C026D3] select-none">
                    {avatarInitial}
                  </div>
                )}
              </div>

              {/* Badge FP */}
              <div className="absolute -left-2 bottom-0 inline-flex h-6 px-2 items-center justify-center rounded-full bg-gray-200 border border-gray-300 text-[10px] font-bold text-gray-700 shadow-sm select-none">
                FP
              </div>
            </div>
          </div>
        </div>

        {/* Nombre y correo */}
        <div className="px-6 pt-16 pb-5 text-center md:pt-4 md:text-left">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:pl-[152px]">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-black tracking-tight text-gray-900 md:text-3xl uppercase">
                {user.full_name ?? "Organización"}
              </h1>
              <p className="mt-1 text-sm font-semibold text-gray-600">
                Organización Estudiantil · UTEC
              </p>
              {user.email && (
                <div className="mt-2 flex items-center justify-center md:justify-start gap-1.5 text-sm text-gray-600">
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

            {/* Botón Seguir (Sólo visible en móviles) */}
            <div className="mt-4 md:hidden">
              <button
                type="button"
                disabled={followSaving}
                onClick={onFollowToggle}
                className={`w-full inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-75 ${
                  isFollowing
                    ? "border border-[#9333EA] bg-white text-[#9333EA] hover:bg-purple-50"
                    : `${TW_UTOPP_GRADIENT_R} text-white hover:brightness-110`
                }`}
              >
                {followSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : isFollowing ? (
                  <>
                    <UserMinus className="h-3.5 w-3.5" />
                    Dejar de seguir
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3.5 w-3.5" />
                    Seguir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Métricas ─── */}
      <section className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Alumnos Siguiendo Totales" value={`${user.followers_count ?? 0}`} />
        <MetricCard label="Cantidad de publicaciones" value={`${publishedPosts.length}`} />
        <MetricCard label="Promedio de satisfacción" value="4.8 ★" />
        <MetricCard label="# promedio de alumnos por evento" value="PROM" subValue="24 alumnos" />
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
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {user.description}
            </p>
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

        {/* Columna Derecha: Sin pestañas, listado directo de publicaciones */}
        <div className="space-y-4">
          <div className="border-b border-gray-150 pb-2">
            <h2 className="text-lg font-bold text-gray-900">Publicaciones</h2>
          </div>

          <div className="space-y-4">
            {publishedPosts.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
                Esta organización aún no ha realizado publicaciones.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {publishedPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={0} // Read-only view
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

function MetricCard({ label, value, subValue }: { label: string; value: string; subValue?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[18px] border border-gray-100 bg-gray-50/50 p-4 text-center shadow-[0_2px_8px_rgba(0,0,0,0.005)]">
      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 leading-tight">
        {label}
      </span>
      <span className="mt-2 text-2xl font-black text-gray-900 leading-none">
        {value}
      </span>
      {subValue && (
        <span className="mt-1 text-xs font-semibold text-gray-500">
          {subValue}
        </span>
      )}
    </div>
  )
}

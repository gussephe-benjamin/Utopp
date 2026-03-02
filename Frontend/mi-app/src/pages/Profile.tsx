import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import {
  getMyProfile, getUserProfile as apiGetProfile,
  followUser, unfollowUser, updateInterests,
  getUserPosts, getFollowers, getFollowing,
} from "../api/users.api"
import { updatePost, archivePost, deletePost } from "../api/posts.api"
import { uploadToCloudinary } from "../api/cloudinary"
import {
  Edit2, Users, Calendar, BookOpen, Clock, Camera, Check, X,
  FileText, UserPlus, UserMinus, Trash2, Archive, Pencil,
  AlertTriangle, ChevronDown, ChevronUp, Bookmark,
} from "lucide-react"
import { getSavedPosts, unsavePost } from "../api/saved-posts.api"
import { POST_TYPE_LABELS, POST_TYPE_ICONS, SUBTYPE_LABELS } from "../types/post.types"

// ─── Tipos unificados ──────────────────────────────────────

interface ProfileData {
  id: number
  email?: string
  full_name?: string
  interests?: string[]
  career?: string
  cycle?: number
  availability?: number
  followers_count: number
  following_count: number
  posts_count: number
}

interface PostItem {
  id: number
  title?: string
  description: string
  post_type: string
  subtype?: string
  status: string
  tags?: string[]
  deadline_at?: string
  created_at: string
}

interface FollowerItem {
  user_id: number
  full_name?: string
  email: string
  followed_at: string
}

// ─── Constantes ────────────────────────────────────────────

const AVAILABILITY_OPTIONS = [
  { id: 0, label: 'Poco tiempo',         emoji: '☕', description: '1-3 hrs/semana' },
  { id: 1, label: 'Moderado',            emoji: '⚖️', description: '4-6 hrs/semana' },
  { id: 2, label: 'Disponible',          emoji: '⚡', description: '7-10 hrs/semana' },
  { id: 3, label: 'Muy flexible',        emoji: '🚀', description: '11-15 hrs/semana' },
  { id: 4, label: 'Máxima disponibilidad', emoji: '🌟', description: '15+ hrs/semana' },
]

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  published: { label: 'Publicado',  color: 'bg-green-100 text-green-700' },
  draft:     { label: 'Borrador',   color: 'bg-yellow-100 text-yellow-700' },
  archived:  { label: 'Archivado',  color: 'bg-gray-100 text-gray-500' },
}

type Tab = 'posts' | 'followers' | 'following' | 'info' | 'saved'

// ─── Componente modal de confirmación ─────────────────────

function ConfirmModal({
  title, message, onConfirm, onCancel, danger = false,
}: {
  title: string; message: string; onConfirm: () => void; onCancel: () => void; danger?: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${danger ? 'bg-red-100' : 'bg-yellow-100'}`}>
            <AlertTriangle className={`w-5 h-5 ${danger ? 'text-red-500' : 'text-yellow-500'}`} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 text-sm mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl text-white font-medium transition-colors ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-yellow-500 hover:bg-yellow-600'}`}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Componente de card de post con acciones ──────────────

function PostCard({
  post, onUpdated, onDeleted,
}: {
  post: PostItem; onUpdated: (p: PostItem) => void; onDeleted: (id: number) => void
}) {
  const [editing, setEditing]     = useState(false)
  const [editTitle, setEditTitle] = useState(post.title ?? "")
  const [editDesc, setEditDesc]   = useState(post.description)
  const [saving, setSaving]       = useState(false)
  const [confirm, setConfirm]     = useState<null | 'archive' | 'delete'>(null)

  const isArchived = post.status === 'archived'

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await updatePost(post.id, { title: editTitle || undefined, description: editDesc })
      onUpdated({ ...post, ...updated })
      setEditing(false)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const handleArchive = async () => {
    try { const updated = await archivePost(post.id); onUpdated({ ...post, ...updated }) }
    catch (e) { console.error(e) }
    finally { setConfirm(null) }
  }

  const handleDelete = async () => {
    try { await deletePost(post.id); onDeleted(post.id) }
    catch (e) { console.error(e) }
    finally { setConfirm(null) }
  }

  return (
    <>
      {confirm === 'archive' && (
        <ConfirmModal
          title="Archivar publicación"
          message="El post dejará de aparecer en el feed y no podrás editarlo. ¿Continuar?"
          onConfirm={handleArchive}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === 'delete' && (
        <ConfirmModal
          title="Eliminar publicación"
          message="Esta acción es permanente. El post se eliminará completamente. ¿Estás seguro?"
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
          danger
        />
      )}

      <div className={`bg-white border rounded-xl p-4 space-y-3 transition-opacity ${isArchived ? 'opacity-60' : ''}`}>
        {/* Header del post */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {POST_TYPE_ICONS[post.post_type as keyof typeof POST_TYPE_ICONS]} {POST_TYPE_LABELS[post.post_type as keyof typeof POST_TYPE_LABELS]}
              </span>
              {post.subtype && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                  {SUBTYPE_LABELS[post.subtype as keyof typeof SUBTYPE_LABELS]}
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[post.status]?.color ?? 'bg-gray-100 text-gray-500'}`}>
                {STATUS_BADGE[post.status]?.label ?? post.status}
              </span>
            </div>

            {/* Modo edición */}
            {editing ? (
              <div className="space-y-2">
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="Título"
                />
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none"
                  rows={3}
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  placeholder="Descripción"
                />
              </div>
            ) : (
              <>
                {post.title && <p className="font-semibold text-gray-900 text-sm">{post.title}</p>}
                <p className="text-gray-600 text-sm line-clamp-2">{post.description}</p>
              </>
            )}
          </div>

          {/* Acciones */}
          {!isArchived && (
            <div className="flex items-center gap-1 shrink-0">
              {editing ? (
                <>
                  <button onClick={handleSave} disabled={saving} className="p-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors" title="Guardar">
                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors" title="Cancelar">
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors" title="Editar">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setConfirm('archive')} className="p-1.5 rounded-lg text-gray-400 hover:bg-yellow-50 hover:text-yellow-600 transition-colors" title="Archivar">
                    <Archive className="w-4 h-4" />
                  </button>
                  <button onClick={() => setConfirm('delete')} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="Eliminar">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.map(t => (
              <span key={t} className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">#{t}</span>
            ))}
          </div>
        )}

        {/* Fecha */}
        <p className="text-xs text-gray-400">
          {new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(post.created_at))}
        </p>
      </div>
    </>
  )
}

// ─── Componente principal ──────────────────────────────────

export default function Profile() {
  const params = useParams()
  const isMe   = useMemo(() => !params.id, [params.id])
  const userId  = params.id ? Number(params.id) : null

  const [data, setData]             = useState<ProfileData | null>(null)
  const [activeTab, setActiveTab]   = useState<Tab>('posts')
  const [posts, setPosts]           = useState<PostItem[]>([])
  const [followers, setFollowers]   = useState<FollowerItem[]>([])
  const [following, setFollowing]   = useState<FollowerItem[]>([])
  const [loadingTab, setLoadingTab] = useState(false)

  // Intereses edición
  const [editingInterests, setEditingInterests] = useState(false)
  const [interestInput, setInterestInput]       = useState("")

  // Foto de perfil — MVP: almacenada en localStorage por user id
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarUrl, setAvatarUrl]   = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // Follow state
  const [isFollowing, setIsFollowing]   = useState(false)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)

  // Saved posts
  const [savedPosts, setSavedPosts] = useState<PostItem[]>([])

  // ── Carga de datos del perfil ────────────────────────────

  useEffect(() => {
    (async () => {
      if (isMe) {
        const d = await getMyProfile()
        setCurrentUserId(d.id)
        setData({
          id: d.id, email: d.email, full_name: d.full_name,
          interests: d.interests, career: d.career, cycle: d.cycle,
          availability: d.availability,
          followers_count: 0, following_count: 0, posts_count: 0,
        })
        setInterestInput((d.interests || []).join(", "))
        const saved = localStorage.getItem(`avatar_${d.id}`)
        if (saved) setAvatarUrl(saved)
      } else if (userId) {
        const [d, me] = await Promise.all([apiGetProfile(userId), getMyProfile().catch(() => null)])
        if (me) setCurrentUserId(me.id)
        setData({
          id: d.id, full_name: d.full_name, interests: d.interests,
          career: d.career, cycle: d.cycle, availability: undefined,
          followers_count: d.followers_count,
          following_count: d.following_count,
          posts_count: d.posts_count,
        })
        const saved = localStorage.getItem(`avatar_${d.id}`)
        if (saved) setAvatarUrl(saved)
      }
    })()
  }, [isMe, userId])

  // ── Carga del tab activo ─────────────────────────────────

  const loadTab = useCallback(async (tab: Tab) => {
    if (!data) return
    const targetId = data.id
    setLoadingTab(true)
    try {
      if (tab === 'posts') {
        const res = await getUserPosts(targetId)
        setPosts(res)
      } else if (tab === 'followers') {
        const res = await getFollowers(targetId)
        setFollowers(res)
      } else if (tab === 'following') {
        const res = await getFollowing(targetId)
        setFollowing(res)
      } else if (tab === 'saved') {
        const res = await getSavedPosts()
        setSavedPosts(res)
      }
    } catch (e) { console.error(e) }
    finally { setLoadingTab(false) }
  }, [data])

  useEffect(() => {
    loadTab(activeTab)
  }, [activeTab, loadTab])

  // ── Foto de perfil ───────────────────────────────────────

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !data) return
    setUploadingPhoto(true)
    try {
      const result = await uploadToCloudinary(file)
      setAvatarUrl(result.secure_url)
      localStorage.setItem(`avatar_${data.id}`, result.secure_url)
    } catch (err) { console.error("Error subiendo foto:", err) }
    finally { setUploadingPhoto(false) }
  }

  // ── Intereses ────────────────────────────────────────────

  const saveInterests = async () => {
    const arr = interestInput.split(",").map(s => s.trim()).filter(Boolean)
    const d = await updateInterests(arr)
    setData(prev => prev ? { ...prev, interests: d.interests } : prev)
    setEditingInterests(false)
  }

  // ── Follow/unfollow ──────────────────────────────────────

  const handleFollow = async () => {
    if (!userId) return
    await followUser(userId)
    setIsFollowing(true)
    setData(prev => prev ? { ...prev, followers_count: prev.followers_count + 1 } : prev)
  }

  const handleUnfollow = async () => {
    if (!userId) return
    await unfollowUser(userId)
    setIsFollowing(false)
    setData(prev => prev ? { ...prev, followers_count: Math.max(0, prev.followers_count - 1) } : prev)
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin" />
          <span>Cargando perfil...</span>
        </div>
      </div>
    )
  }

  const displayName = data.full_name || "Usuario"
  const initial     = displayName.charAt(0).toUpperCase()
  const avail       = AVAILABILITY_OPTIONS.find(o => o.id === data.availability) ?? AVAILABILITY_OPTIONS[0]

  const shouldHideFollow = isMe || (data.id === currentUserId)

  const TABS: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'posts',     label: 'Publicaciones', icon: <FileText className="w-4 h-4" />,  count: data.posts_count },
    { id: 'followers', label: 'Seguidores',    icon: <Users className="w-4 h-4" />,     count: data.followers_count },
    { id: 'following', label: 'Seguidos',      icon: <UserPlus className="w-4 h-4" />,  count: data.following_count },
    { id: 'info',      label: 'Info',          icon: <BookOpen className="w-4 h-4" /> },
    ...(isMe ? [{ id: 'saved' as Tab, label: 'Guardadas', icon: <Bookmark className="w-4 h-4" /> }] : []),
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Input oculto para foto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoChange}
      />

      {/* ── Cover / Banner ─────────────────────────────── */}
      <div className="relative z-0 h-36 bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#EC4899]">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }}
        />
      </div>

      {/* ── Contenedor principal ───────────────────────── */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 -mt-16 pb-24">

        {/* ── Card de cabecera ───────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-6 pt-4 pb-6 mb-4">
          <div className="flex items-end gap-4 mb-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-3xl font-bold">{initial}</span>
                )}
              </div>
              {/* Botón de cambiar foto — solo para perfil propio */}
              {isMe && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                  title="Cambiar foto de perfil"
                >
                  {uploadingPhoto
                    ? <div className="w-4 h-4 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin" />
                    : <Camera className="w-4 h-4" />}
                </button>
              )}
            </div>

            {/* Nombre + acciones */}
            <div className="flex-1 min-w-0 pb-1">
              <h1 className="text-xl font-bold text-gray-900 truncate">{displayName}</h1>
              {data.email && <p className="text-sm text-gray-500 truncate">{data.email}</p>}
              {data.career && (
                <p className="text-sm text-purple-600 font-medium mt-0.5 truncate">
                  {data.career}{data.cycle ? ` · Ciclo ${data.cycle}` : ""}
                </p>
              )}
            </div>

            {/* Botón follow (perfil ajeno) — oculto si es el propio perfil */}
            {!shouldHideFollow && (
              <button
                onClick={isFollowing ? handleUnfollow : handleFollow}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isFollowing
                    ? 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600'
                    : 'bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white shadow-md hover:shadow-lg'
                }`}
              >
                {isFollowing ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {isFollowing ? 'Siguiendo' : 'Seguir'}
              </button>
            )}
          </div>

          {/* Stats rápidas */}
          <div className="flex gap-4 border-t border-gray-100 pt-4">
            {[
              { label: 'Publicaciones', value: data.posts_count },
              { label: 'Seguidores',    value: data.followers_count },
              { label: 'Siguiendo',     value: data.following_count },
            ].map(s => (
              <div key={s.label} className="flex-1 text-center">
                <p className="text-lg font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-4">
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#4F46E5] text-[#4F46E5]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-4">
            {loadingTab && (
              <div className="flex items-center justify-center py-8 text-gray-400 gap-2">
                <div className="w-5 h-5 border-2 border-gray-200 border-t-purple-500 rounded-full animate-spin" />
                <span className="text-sm">Cargando...</span>
              </div>
            )}

            {/* ── Tab: Publicaciones ─────────────────────── */}
            {!loadingTab && activeTab === 'posts' && (
              <div className="space-y-3">
                {posts.length === 0 ? (
                  <div className="py-10 text-center">
                    <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Sin publicaciones aún</p>
                  </div>
                ) : posts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onUpdated={updated => setPosts(prev => prev.map(p => p.id === updated.id ? updated : p))}
                    onDeleted={id => setPosts(prev => prev.filter(p => p.id !== id))}
                  />
                ))}
              </div>
            )}

            {/* ── Tab: Seguidores ───────────────────────── */}
            {!loadingTab && activeTab === 'followers' && (
              <FollowerList items={followers} emptyLabel="Sin seguidores aún" />
            )}

            {/* ── Tab: Seguidos ─────────────────────────── */}
            {!loadingTab && activeTab === 'following' && (
              <FollowerList items={following} emptyLabel="No sigue a nadie aún" />
            )}

            {/* ── Tab: Guardadas ────────────────────────── */}
            {!loadingTab && activeTab === 'saved' && (
              <SavedPostsTab
                posts={savedPosts}
                onUnsave={async (id: number) => {
                  try {
                    await unsavePost(id)
                    setSavedPosts(prev => prev.filter(p => p.id !== id))
                  } catch (e) { console.error(e) }
                }}
              />
            )}

            {/* ── Tab: Info ─────────────────────────────── */}
            {!loadingTab && activeTab === 'info' && (
              <InfoTab
                data={data}
                isMe={isMe}
                avail={avail}
                editingInterests={editingInterests}
                interestInput={interestInput}
                onEditInterests={() => setEditingInterests(true)}
                onCancelInterests={() => setEditingInterests(false)}
                onSaveInterests={saveInterests}
                onInterestInputChange={setInterestInput}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-componente: lista de seguidores/seguidos ─────────

function FollowerList({ items, emptyLabel }: { items: FollowerItem[]; emptyLabel: string }) {
  if (items.length === 0) {
    return (
      <div className="py-10 text-center">
        <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">{emptyLabel}</p>
      </div>
    )
  }
  return (
    <div className="space-y-2">
      {items.map(item => (
        <div key={item.user_id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
            {(item.full_name || item.email).charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{item.full_name || 'Usuario'}</p>
            <p className="text-xs text-gray-500 truncate">{item.email}</p>
          </div>
          <p className="text-xs text-gray-400 shrink-0">
            {new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' }).format(new Date(item.followed_at))}
          </p>
        </div>
      ))}
    </div>
  )
}

// ─── Sub-componente: tab de guardadas ───────────────────

function SavedPostsTab({
  posts, onUnsave,
}: {
  posts: PostItem[]
  onUnsave: (id: number) => void
}) {
  if (posts.length === 0) {
    return (
      <div className="py-10 text-center">
        <Bookmark className="w-10 h-10 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">Aún no has guardado publicaciones</p>
        <p className="text-xs text-gray-400 mt-1">Usa el menú ⋮ en cualquier post para guardarlos</p>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {posts.map(post => (
        <div key={post.id} className="bg-white border rounded-xl p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {POST_TYPE_ICONS[post.post_type as keyof typeof POST_TYPE_ICONS]} {POST_TYPE_LABELS[post.post_type as keyof typeof POST_TYPE_LABELS]}
                </span>
                {post.subtype && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                    {SUBTYPE_LABELS[post.subtype as keyof typeof SUBTYPE_LABELS]}
                  </span>
                )}
              </div>
              {post.title && <p className="font-semibold text-gray-900 text-sm">{post.title}</p>}
              <p className="text-gray-600 text-sm line-clamp-2">{post.description}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(post.created_at))}
              </p>
            </div>
            <button
              onClick={() => onUnsave(post.id)}
              className="shrink-0 p-2 rounded-lg text-[#4F46E5] hover:bg-indigo-50 transition-colors"
              title="Quitar de guardados"
            >
              <Bookmark className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Sub-componente: tab de información ──────────────────

function InfoTab({
  data, isMe, avail,
  editingInterests, interestInput,
  onEditInterests, onCancelInterests, onSaveInterests, onInterestInputChange,
}: {
  data: ProfileData
  isMe: boolean
  avail: typeof AVAILABILITY_OPTIONS[number]
  editingInterests: boolean
  interestInput: string
  onEditInterests: () => void
  onCancelInterests: () => void
  onSaveInterests: () => void
  onInterestInputChange: (v: string) => void
}) {
  const [showAllInterests, setShowAllInterests] = useState(false)
  const interests = data.interests ?? []
  const visible   = showAllInterests ? interests : interests.slice(0, 6)

  return (
    <div className="space-y-4">
      {/* Carrera y Ciclo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-purple-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Carrera</span>
          </div>
          <p className="text-gray-800 font-medium text-sm">{data.career || "No especificada"}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Ciclo</span>
          </div>
          <p className="text-gray-800 font-bold text-xl">{data.cycle ?? "—"}</p>
        </div>
      </div>

      {/* Disponibilidad */}
      {data.availability !== undefined && (
        <div className="bg-green-50 rounded-xl p-4 flex items-center gap-4">
          <span className="text-3xl">{avail.emoji}</span>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Clock className="w-4 h-4 text-green-600" />
              <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Disponibilidad</span>
            </div>
            <p className="font-bold text-gray-900">{avail.label}</p>
            <p className="text-xs text-gray-500">{avail.description}</p>
          </div>
        </div>
      )}

      {/* Intereses */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Intereses</span>
          {isMe && !editingInterests && (
            <button onClick={onEditInterests} className="text-purple-600 hover:text-purple-700 transition-colors">
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {editingInterests ? (
          <div className="space-y-3">
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none outline-none"
              rows={3}
              value={interestInput}
              onChange={e => onInterestInputChange(e.target.value)}
              placeholder="Separa los intereses con comas: programación, diseño, IA..."
            />
            <div className="flex gap-2">
              <button onClick={onSaveInterests} className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
                <Check className="w-4 h-4" /> Guardar
              </button>
              <button onClick={onCancelInterests} className="flex items-center gap-1.5 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
                <X className="w-4 h-4" /> Cancelar
              </button>
            </div>
          </div>
        ) : (
          <>
            {interests.length === 0 ? (
              <p className="text-gray-400 text-sm">Sin intereses registrados</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {visible.map((tag, i) => (
                  <span key={i} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
                    #{tag}
                  </span>
                ))}
                {interests.length > 6 && (
                  <button
                    onClick={() => setShowAllInterests(v => !v)}
                    className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 transition-colors px-1"
                  >
                    {showAllInterests
                      ? <><ChevronUp className="w-3 h-3" /> Ver menos</>
                      : <><ChevronDown className="w-3 h-3" /> +{interests.length - 6} más</>
                    }
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

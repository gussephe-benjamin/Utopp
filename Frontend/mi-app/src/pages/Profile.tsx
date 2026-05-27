import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import {
  getMyProfile, getUserProfile as apiGetProfile,
  followUser, unfollowUser, updateInterests, updateMyProfile,
  getUserPosts, getFollowers, getFollowing, removeFollower, setProfileImage,
} from "../api/users.api"
import { unarchivePost, deletePost } from "../api/posts.api"
import { uploadToCloudinary } from "../api/cloudinary"
import { getMyRoles, getUserRoles } from '../api/roles.api'
import {
  Edit2, Users, Calendar, BookOpen, Clock, Camera, Check, X,
  FileText, UserPlus, UserMinus, Trash2, Archive, ArchiveRestore, Pencil,
  ChevronDown, ChevronUp, Bookmark,
  Zap, ShieldCheck, Building, GraduationCap,
  Smartphone, BarChart3, Shield, Cpu, Laptop, Database,
  Dna, Leaf, Hammer, Cable, Factory, Wrench, Settings, Beaker,
  Scale, Rocket, Star, Coffee, Copy, Mail, MessageCircle
} from "lucide-react"
import { getSavedPosts, unsavePost } from "../api/saved-posts.api"
import { AnimatePresence, motion } from "framer-motion"
import { POST_TYPE_LABELS, POST_TYPE_ICONS } from "../types/post.types"
import PostDetailModal from "../components/PostDetailModal"
import EditPostWizard from "../components/EditPostWizard"
import { INTERESTS } from "../constants/interests"
import { AVAILABILITY_OPTIONS, CAREER_FACULTIES, CAREER_OPTIONS } from "../features/profile/constants/profileOptions"
import { ConfirmModal } from "../features/profile/components/ConfirmModal"
import { PostCard } from "../features/feed/components/PostCard"
import type { FollowerItem, PostItem, ProfileData, ProfileTab } from "../features/profile/types"
import type { FeedPostOut } from "../types/post.types"
import { TW_UTOPP_GRADIENT_BR, TW_UTOPP_GRADIENT_R } from "../shared/constants/brand"
const CAREER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  admin_digital: Smartphone,
  business_analytics: BarChart3,
  ciberseguridad: ShieldCheck,
  ciencia_datos_ia: Cpu,
  ciencia_computacion: Laptop,
  sistemas_info: Database,
  bioingenieria: Dna,
  ambiental: Leaf,
  civil: Hammer,
  energia: Zap,
  electronica: Cable,
  industrial: Factory,
  mecatronica: Wrench,
  mecanica: Settings,
  quimica: Beaker,
};

const AVAILABILITY_ICONS: Record<number, React.ComponentType<{ className?: string }>> = {
  0: Coffee,
  1: Scale,
  2: Zap,
  3: Rocket,
  4: Star,
};

// ─── Componente principal ──────────────────────────────────

export default function Profile({ viewUserId }: { viewUserId?: number } = {}) {
  const params   = useParams()
  const resolvedId = viewUserId ?? (params.id ? Number(params.id) : undefined)
  const isMe   = useMemo(() => !resolvedId, [resolvedId])
  const userId  = resolvedId ?? null

  const [data, setData]             = useState<ProfileData | null>(null)
  const [activeTab, setActiveTab]   = useState<ProfileTab>('posts')
  const [posts, setPosts]           = useState<PostItem[]>([])
  const [loadingTab, setLoadingTab] = useState(false)
  const tabContentRef = useRef<HTMLDivElement>(null)
  const postsLoaderRef = useRef<HTMLDivElement | null>(null)
  const [tabMinHeight, setTabMinHeight] = useState<number | null>(null)
  const [visiblePostsCount, setVisiblePostsCount] = useState(10)
  const [tabLoaded, setTabLoaded] = useState<Record<ProfileTab, boolean>>({
    posts: false,
    saved: false,
    archived: false,
  })

  // Intereses edición
  const [editingInterests, setEditingInterests] = useState(false)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])

  // Foto de perfil — MVP: almacenada en localStorage por user id
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarUrl, setAvatarUrl]   = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [cropSrc, setCropSrc]       = useState<string | null>(null)  // data-URL for crop modal

  // Mobile editing states
  const [mobileEditField, setMobileEditField] = useState<null | 'career' | 'cycle' | 'availability'>(null)
  const [mobileCareer, setMobileCareer] = useState('')
  const [mobileCycle, setMobileCycle] = useState(1)
  const [mobileAvailability, setMobileAvailability] = useState(0)
  const [mobileSaving, setMobileSaving] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)

  const handleCopyEmail = () => {
    if (data?.email) {
      navigator.clipboard.writeText(data.email)
      setCopiedEmail(true)
      setTimeout(() => setCopiedEmail(false), 2000)
    }
  }

  const handleToggleInterest = (id: string) => {
    setSelectedInterests(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const openMobileEdit = (field: 'career' | 'cycle' | 'availability') => {
    if (!data) return
    if (field === 'career') setMobileCareer(data.career ?? '')
    if (field === 'cycle') setMobileCycle(data.cycle ?? 1)
    if (field === 'availability') setMobileAvailability(data.availability ?? 0)
    setMobileEditField(field)
  }

  const saveMobileField = async () => {
    setMobileSaving(true)
    try {
      let patch: Record<string, any> = {}
      if (mobileEditField === 'career') patch = { career: mobileCareer || undefined }
      if (mobileEditField === 'cycle') patch = { cycle: mobileCycle }
      if (mobileEditField === 'availability') patch = { availability: mobileAvailability }

      const updated = await updateMyProfile(patch)
      setData(prev => {
        if (!prev) return prev
        return {
          ...prev,
          ...patch,
          ...updated,
          followers_count: prev.followers_count,
          following_count: prev.following_count,
          posts_count: prev.posts_count,
        }
      })
      setMobileEditField(null)
    } catch (e) {
      console.error(e)
    } finally {
      setMobileSaving(false)
    }
  }

  // Follow state
  const [isFollowing, setIsFollowing]   = useState(false)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)

  // Saved posts
  const [savedPosts, setSavedPosts] = useState<PostItem[]>([])
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null)

  // Edit post wizard
  const [editingPost, setEditingPost] = useState<PostItem | null>(null)

  // Archived posts
  const [archivedPosts, setArchivedPosts] = useState<PostItem[]>([])

  // Social modal
  const [showSocialModal, setShowSocialModal]   = useState(false)
  const [socialInitialTab, setSocialInitialTab] = useState<'followers' | 'following'>('followers')
  const [modalFollowers, setModalFollowers]     = useState<FollowerItem[]>([])
  const [modalFollowing, setModalFollowing]     = useState<FollowerItem[]>([])
  const [loadingSocial, setLoadingSocial]       = useState(false)
  const profileId = data?.id

  // ── Carga de datos del perfil ────────────────────────────

  useEffect(() => {
    setData(null)
    setAvatarUrl(null)
    ;(async () => {
      if (isMe) {
        const [d, roles] = await Promise.all([getMyProfile(), getMyRoles().catch(() => [])])
        setCurrentUserId(d.id)
        setData({
          id: d.id, email: d.email, full_name: d.full_name,
          interests: d.interests, career: d.career, cycle: d.cycle,
          availability: d.availability,
          followers_count: d.followers_count ?? 0,
          following_count: d.following_count ?? 0,
          posts_count: d.posts_count ?? 0,
          role_name: roles[0]?.name ?? undefined,
        })
        setSelectedInterests(d.interests || [])
        const apiUrl = (d as { profile_image_url?: string }).profile_image_url
        if (apiUrl) {
          setAvatarUrl(apiUrl)
          localStorage.setItem(`avatar_${d.id}`, apiUrl)
        } else {
          const saved = localStorage.getItem(`avatar_${d.id}`)
          if (saved) setAvatarUrl(saved)
        }
      } else if (userId) {
        const [d, me, roles] = await Promise.all([
          apiGetProfile(userId),
          getMyProfile().catch(() => null),
          getUserRoles(userId).catch(() => []),
        ])
        if (me) setCurrentUserId(me.id)
        setData({
          id: d.id, full_name: d.full_name, interests: d.interests,
          career: d.career, cycle: d.cycle, availability: undefined,
          followers_count: d.followers_count,
          following_count: d.following_count,
          posts_count: d.posts_count,
          role_name: (roles as { name: string }[])[0]?.name ?? undefined,
        })
        const apiUrl = (d as { profile_image_url?: string }).profile_image_url
        if (apiUrl) {
          setAvatarUrl(apiUrl)
          localStorage.setItem(`avatar_${d.id}`, apiUrl)
        } else {
          const saved = localStorage.getItem(`avatar_${d.id}`)
          if (saved) setAvatarUrl(saved)
        }
      }
    })()
  }, [isMe, userId])

  // ── Carga del tab activo ─────────────────────────────────

  const loadTab = useCallback(async (tab: ProfileTab) => {
    if (!data || tabLoaded[tab]) return
    const targetId = data.id
    setLoadingTab(true)
    try {
      const loadedPatch: Partial<Record<ProfileTab, boolean>> = {}
      if (tab === 'posts') {
        const res = await getUserPosts(targetId)
        const all = res as PostItem[]
        // En "Publicaciones" solo mostramos no archivadas.
        setPosts(all.filter((p: PostItem) => p.status !== 'archived'))
        loadedPatch.posts = true
        if (isMe && data.role_name !== 'estudiante') {
          setArchivedPosts(all.filter((p: PostItem) => p.status === 'archived'))
          loadedPatch.archived = true
        }
      } else if (tab === 'saved') {
        const res = await getSavedPosts()
        setSavedPosts(res)
        loadedPatch.saved = true
      } else if (tab === 'archived') {
        if (data.role_name === 'estudiante') return
        const res = await getUserPosts(targetId)
        setArchivedPosts((res as PostItem[]).filter((p: PostItem) => p.status === 'archived'))
        loadedPatch.archived = true
      }
      if (Object.keys(loadedPatch).length > 0) {
        setTabLoaded(prev => ({ ...prev, ...loadedPatch }))
      }
    } catch (e) { console.error(e) }
    finally { setLoadingTab(false) }
  }, [data, isMe, tabLoaded])

  const openSocialModal = async (tab: 'followers' | 'following') => {
    if (!data) return
    setSocialInitialTab(tab)
    setShowSocialModal(true)
    setLoadingSocial(true)
    try {
      const [fl, fw] = await Promise.all([
        getFollowers(data.id),
        getFollowing(data.id),
      ])
      setModalFollowers(fl)
      setModalFollowing(fw)
    } catch (e) { console.error(e) }
    finally { setLoadingSocial(false) }
  }

  useEffect(() => {
    loadTab(activeTab)
  }, [activeTab, loadTab])

  useEffect(() => {
    if (!loadingTab) {
      setTabMinHeight(null)
    }
  }, [loadingTab])

  // Precarga conteos de tabs secundarios para mostrar badges correctos desde el inicio.
  useEffect(() => {
    if (!isMe || !profileId) return
    let cancelled = false

    ;(async () => {
      try {
        const savedRes = await getSavedPosts().catch(() => [])
        if (cancelled) return
        setSavedPosts(savedRes as PostItem[])
        setTabLoaded(prev => ({ ...prev, saved: true }))
      } catch (e) {
        console.error(e)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isMe, profileId])

  useEffect(() => {
    // Si el rol es alumno, el tab de “Publicaciones” no se muestra; arrancamos en “Guardadas”.
    setActiveTab(isMe && data?.role_name === 'estudiante' ? 'saved' : 'posts')
    setVisiblePostsCount(10)
    setPosts([])
    setSavedPosts([])
    setArchivedPosts([])
    setTabLoaded({
      posts: false,
      saved: false,
      archived: false,
    })
    setTabMinHeight(null)
  }, [profileId])

  const handleTabChange = (tab: ProfileTab) => {
    if (tab === activeTab) return
    if (tab === 'saved') setTabLoaded(prev => ({ ...prev, saved: false }))
    if (!tabLoaded[tab]) {
      const currentHeight = tabContentRef.current?.offsetHeight ?? 0
      if (currentHeight > 0) {
        setTabMinHeight(currentHeight)
      }
    } else {
      setTabMinHeight(null)
    }
    setActiveTab(tab)
  }

  // Infinite scroll local en perfil: muestra 10 publicaciones y va cargando más al bajar.
  useEffect(() => {
    if (activeTab !== 'posts') return
    const el = postsLoaderRef.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisiblePostsCount((prev) => Math.min(prev + 10, posts.length))
      }
    })
    io.observe(el)
    return () => io.disconnect()
  }, [activeTab, posts.length])

  // ── Foto de perfil ───────────────────────────────────────

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCropSrc(reader.result as string)
    reader.readAsDataURL(file)
    // Reset so the same file can be re-selected
    e.target.value = ''
  }

  const handleCroppedUpload = async (blob: Blob) => {
    if (!data) return
    setCropSrc(null)
    setUploadingPhoto(true)
    try {
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
      const result = await uploadToCloudinary(file)
      await setProfileImage(result.public_id, result.secure_url)
      setAvatarUrl(result.secure_url)
      localStorage.setItem(`avatar_${data.id}`, result.secure_url)
      window.dispatchEvent(new CustomEvent('avatarUpdated', {
        detail: { userId: data.id, avatarUrl: result.secure_url },
      }))
    } catch (err) { console.error('Error subiendo foto:', err) }
    finally { setUploadingPhoto(false) }
  }

  // ── Intereses ────────────────────────────────────────────

  const saveInterests = async () => {
    const d = await updateInterests(selectedInterests)
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

  const canSeeArchivedTab = isMe && data.role_name !== 'estudiante'

  const TABS: { id: ProfileTab; label: string; icon: React.ReactNode; count?: number }[] = [
    ...(data.role_name !== 'estudiante'
      ? [{ id: 'posts' as ProfileTab, label: 'Publicaciones', icon: <FileText className="w-4 h-4" />, count: data.posts_count }]
      : []),
    ...(isMe
      ? [{ id: 'saved' as ProfileTab, label: 'Guardadas', icon: <Bookmark className="w-4 h-4" />, count: savedPosts.length }]
      : []),
    ...(canSeeArchivedTab
      ? [{ id: 'archived' as ProfileTab, label: 'Archivadas', icon: <Archive className="w-4 h-4" />, count: archivedPosts.length }]
      : []),
  ]

  return (
    <div className="min-h-screen bg-white md:bg-[#f4f5f8]" style={{ overflowAnchor: 'none' }}>
      {/* Input oculto para foto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoChange}
      />

      {/* Modal de recorte circular */}
      <PostDetailModal
        postId={selectedPostId}
        onClose={() => setSelectedPostId(null)}
        onUnsaved={id => {
          setSavedPosts(prev => prev.filter(p => p.id !== id))
          setSelectedPostId(null)
        }}
      />

      <EditPostWizard
        post={editingPost}
        onClose={() => setEditingPost(null)}
        onSaved={updated => {
          setPosts(prev => prev.map(p => p.id === updated.id ? updated : p))
          setEditingPost(null)
        }}
      />

      {cropSrc && (
        <AvatarCropModal
          src={cropSrc}
          onConfirm={handleCroppedUpload}
          onCancel={() => setCropSrc(null)}
        />
      )}

      {/* ── VISTA ESCRITORIO ─────────────────────────────── */}
      <div className="hidden md:block max-w-[1100px] mx-auto pt-10 px-6">
        
        {/* ── Tarjeta Blanca Principal ────────────────────────── */}
        <div className="bg-white rounded-[2rem] shadow-sm p-4 mb-2">
          
          {/* ── Cover / Banner ─────────────────────────────── */}
          <div className="relative h-[220px] rounded-3xl overflow-hidden bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500">
            {/* Botón Editar perfil */}
            {isMe && (
              <button
                onClick={() => openMobileEdit('availability')}
                className="absolute top-6 right-6 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white px-5 py-2 rounded-full text-sm font-semibold tracking-wide flex items-center gap-2 transition-all shadow-sm"
              >
                <Pencil className="w-4 h-4" />
                Editar perfil
              </button>
            )}
          </div>

          {/* ── Contenedor Info Usuario ───────────────────────────── */}
          <div className="relative px-6 pb-4 flex flex-col items-start -mt-20 z-10">
            {/* Avatar */}
            <div className="relative mb-3">
              <div className="w-[150px] h-[150px] rounded-full border-[6px] border-white bg-white flex items-center justify-center overflow-hidden shadow-sm">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 text-5xl font-bold">{initial}</span>
                )}
              </div>
              {/* Estado online */}
              <div className="absolute bottom-4 right-4 w-6 h-6 bg-[#22C55E] rounded-full border-4 border-white shadow-sm" />
              
              {/* Botón cambiar foto */}
              {isMe && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute bottom-2 left-2 w-9 h-9 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                  title="Cambiar foto de perfil"
                >
                  {uploadingPhoto
                    ? <div className="w-4 h-4 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin" />
                    : <Camera className="w-4.5 h-4.5" />}
                </button>
              )}
            </div>

            {/* Nombre y Detalles */}
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{displayName}</h1>
            <p className="text-sm font-medium text-gray-500 mt-1">
              {data.career}{data.cycle ? ` · Ciclo ${data.cycle}` : ""} · UTEC
            </p>

            {data.email && (
              <div className="flex items-center gap-2 mt-2 text-gray-500 text-sm">
                <Mail className="w-4 h-4"/> 
                <span className="font-medium">{data.email}</span>
                <button onClick={handleCopyEmail} className="hover:text-gray-700 ml-1">
                  {copiedEmail ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            )}

            {/* Disponibilidad Badge */}
            <div className="mt-3 inline-flex items-center gap-1.5 bg-green-100/80 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold border border-green-200/50">
              <Zap className="w-3.5 h-3.5" />
              {avail.label} · {avail.description}
            </div>

            {/* Botones de acción */}
            <div className="flex gap-4 w-[400px] mt-6">
              {!shouldHideFollow && (
                <button
                  onClick={isFollowing ? handleUnfollow : handleFollow}
                  className={`flex-1 py-2.5 rounded-2xl font-bold flex justify-center items-center gap-2 transition-all ${
                    isFollowing
                      ? 'bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-600'
                      : 'bg-[#984df5] text-white shadow-md hover:bg-[#8640df]'
                  }`}
                >
                  {isFollowing ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {isFollowing ? 'Siguiendo' : 'Conectar'}
                </button>
              )}
              <button className="flex-1 bg-transparent border border-purple-300 text-purple-600 py-2.5 rounded-2xl font-bold hover:bg-purple-50 transition-all flex justify-center items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Mensaje
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── VISTA MÓVIL ─────────────────────────────────── */}
      <div className="block md:hidden bg-white pb-4">
        {/* Curved violet/purple gradient header */}
        <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 pb-28 pt-8 px-5 rounded-b-[2.5rem] overflow-hidden shadow-lg shadow-purple-950/15">
          {/* Blobs de decoración */}
          <div className="absolute top-[-20%] left-[-10%] w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-15%] w-72 h-72 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
          <div className="absolute top-[20%] right-[-10%] w-48 h-48 rounded-full bg-fuchsia-500/10 blur-2xl pointer-events-none" />

          {/* Fila de cabecera */}
          <div className="flex items-center justify-between mb-6 relative z-10">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Perfil</h1>
            {isMe && (
              <button
                onClick={() => openMobileEdit('availability')}
                className="w-10 h-10 bg-white/10 text-white rounded-xl border border-white/20 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all shadow-sm"
                title="Editar disponibilidad y más"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Detalles del usuario */}
          <div className="flex flex-col items-center text-center relative z-10">
            {/* Avatar circular con anillo y estado */}
            <div className="relative mb-4">
              <div className="w-28 h-28 rounded-full border-4 border-white shadow-2xl flex items-center justify-center bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-[3px] ring-4 ring-amber-400/90 ring-offset-2 ring-offset-purple-600">
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-white bg-white">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover animate-in fade-in duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 text-white text-4xl font-black">
                      {initial}
                    </div>
                  )}
                </div>
              </div>
              {/* Active green status dot */}
              <div className="absolute bottom-1.5 right-1.5 w-6 h-6 bg-[#22C55E] rounded-full border-4 border-white shadow-lg animate-pulse" />

              {/* Botón flotante para cambiar foto */}
              {isMe && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute bottom-0 -left-1 w-9 h-9 bg-white rounded-full shadow-lg border border-gray-150 flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-90 transition-all"
                  title="Cambiar foto de perfil"
                >
                  {uploadingPhoto ? (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-4.5 h-4.5 text-gray-600" />
                  )}
                </button>
              )}
            </div>

            {/* Nombre */}
            <h2 className="text-2xl font-extrabold text-white tracking-wide leading-tight drop-shadow-sm">{displayName}</h2>

            {/* Carrera Badge Glassmorphic */}
            {data.career ? (
              <button
                onClick={() => isMe && openMobileEdit('career')}
                className={`mt-3.5 bg-white/15 backdrop-blur-md border border-white/20 text-white px-4.5 py-1.5 rounded-full text-xs font-bold tracking-wide inline-flex items-center gap-1.5 shadow-sm transition-all select-none ${isMe ? 'cursor-pointer hover:bg-white/25 active:scale-95' : ''}`}
              >
                <span>✦ {data.career}</span>
              </button>
            ) : (
              isMe && (
                <button
                  onClick={() => openMobileEdit('career')}
                  className="mt-3.5 bg-white/10 backdrop-blur-md border border-dashed border-white/30 text-white/90 px-4.5 py-1.5 rounded-full text-xs font-bold tracking-wide inline-flex items-center gap-1.5 shadow-sm hover:bg-white/20 active:scale-95 transition-all"
                >
                  <span>+ Agregar Carrera</span>
                </button>
              )
            )}

            {/* Subtítulo Ciclo · UTEC */}
            <p className="text-purple-100/90 text-xs font-semibold mt-2.5 tracking-wider uppercase">
              Ciclo {data.cycle ?? 1} · UTEC
            </p>

            {/* Correo Copiable */}
            {data.email && (
              <button
                onClick={handleCopyEmail}
                className="mt-3.5 bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/15 px-4 py-2 rounded-2xl text-xs flex items-center gap-2 transition-all active:scale-95 shadow-md font-bold tracking-wide text-white/95"
              >
                <span className="w-2 h-2 rounded-full bg-white/40 shrink-0" />
                <span className="truncate max-w-[200px]">{data.email}</span>
                {copiedEmail ? (
                  <Check className="w-4 h-4 text-green-300 animate-in fade-in" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-white/60" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Widgets Grid 2x2 solapados */}
        <div className="grid grid-cols-2 gap-3.5 -mt-14 px-4 mb-8 relative z-20">
          {/* Card 1: Asistencia / Ciclo */}
          <div className="bg-white rounded-3xl p-5 border border-gray-150/40 shadow-xl shadow-gray-200/40 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3.5">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase block">Asistencia</span>
              <span className="text-3xl font-black text-purple-600 block mt-1">12</span>
            </div>
            <span className="text-[10px] font-semibold text-gray-500 mt-2 block">Eventos este ciclo</span>
          </div>

          {/* Card 2: Publicaciones */}
          <div className="bg-[#6c42f5] text-white rounded-3xl p-5 shadow-xl shadow-purple-600/25 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-white/15 text-white flex items-center justify-center mb-3.5">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-white/70 tracking-wider uppercase block">Publicaciones</span>
              <span className="text-3xl font-black text-white block mt-1">{data.posts_count}</span>
            </div>
            <span className="text-[10px] font-semibold text-white/80 mt-2 block">
              ↗ {data.posts_count} Compartidas
            </span>
          </div>

          {/* Card 3: Disponibilidad */}
          <div
            onClick={() => isMe && openMobileEdit('availability')}
            className={`bg-white rounded-3xl p-5 border border-gray-150/40 shadow-xl shadow-gray-200/40 flex flex-col justify-between ${isMe ? 'cursor-pointer hover:bg-gray-50 active:scale-[0.98] transition-all' : ''}`}
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-3.5">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
              <span className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase block">Disponibilidad</span>
              <span className="text-md font-extrabold text-orange-600 block mt-1.5 leading-snug">
                {avail.emoji} {avail.id === 3 ? 'Muy disponible' : avail.label}
              </span>
            </div>
            <span className="text-[10px] font-semibold text-gray-500 mt-2 block">
              {avail.description}
            </span>
          </div>

          {/* Card 4: Conexiones */}
          <div
            onClick={() => openSocialModal('followers')}
            className="bg-white rounded-3xl p-5 border border-gray-150/40 shadow-xl shadow-gray-200/40 flex flex-col justify-between cursor-pointer hover:bg-gray-50 active:scale-[0.98] transition-all"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3.5">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase block">Conexiones</span>
              <span className="text-3xl font-black text-emerald-600 block mt-1">{data.followers_count}</span>
            </div>
            <span className="text-[10px] font-semibold text-gray-500 mt-2 block">
              Seguidores · {data.following_count} sigue
            </span>
          </div>
        </div>

        {/* Mis Comunidades (Intereses Scroll) */}
        <div className="px-5 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-gray-900">Mis Comunidades</h3>
            {isMe && (
              <button
                onClick={() => setEditingInterests(true)}
                className="text-sm font-bold text-purple-600 hover:text-purple-700 active:scale-95 transition-all"
              >
                Ver todas
              </button>
            )}
          </div>

          {/* Horizontal Scroll Container */}
          <div
            className="flex items-start gap-4 overflow-x-auto pb-2 scrollbar-none"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {isMe && (
              <button
                onClick={() => setEditingInterests(true)}
                className="flex flex-col items-center gap-2 shrink-0 group focus:outline-none"
              >
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-purple-400 flex items-center justify-center bg-purple-50/50 hover:bg-purple-100/50 group-active:scale-95 transition-all">
                  <UserPlus className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-xs font-bold text-gray-600">Unirse</span>
              </button>
            )}

            {/* Render interests */}
            {selectedInterests.length === 0 ? (
              <div className="flex items-center justify-center py-4 text-gray-400 gap-2 w-full">
                <span className="text-xs italic">Sin comunidades seleccionadas</span>
              </div>
            ) : (
              selectedInterests.map(id => {
                const interest = INTERESTS.find(i => i.id === id);
                if (!interest) return null;
                const IconComponent = interest.icon;
                return (
                  <div
                    key={id}
                    className="flex flex-col items-center gap-2 shrink-0 max-w-[80px]"
                  >
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${interest.gradient} flex items-center justify-center shadow-md shadow-purple-500/10`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-bold text-gray-800 text-center truncate w-full">
                      {interest.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── CONTENIDO INFERIOR: WIDGETS (Desktop) + TABS (Shared) ────────────────── */}
      <div className="max-w-[1100px] mx-auto md:px-6 pb-24 relative z-20">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* ── COLUMNA IZQUIERDA (SOLO ESCRITORIO): Widgets ── */}
          <div className="hidden md:block w-[320px] shrink-0 mt-8">
             <div className="grid grid-cols-2 gap-4">
               {/* Asistencia */}
               <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100 flex flex-col justify-between min-h-[140px]">
                 <div>
                   <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center mb-3">
                     <BarChart3 className="w-5 h-5 text-purple-600" />
                   </div>
                   <span className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase block">Asistencia</span>
                   <span className="text-3xl font-black text-purple-600 block mt-1">12</span>
                 </div>
                 <span className="text-[10px] font-semibold text-gray-500 mt-2 block">Eventos este ciclo</span>
               </div>

               {/* Publicaciones */}
               <div className="bg-[#6c42f5] text-white rounded-[2rem] p-5 shadow-md flex flex-col justify-between min-h-[140px]">
                 <div>
                   <div className="w-10 h-10 rounded-2xl bg-white/15 text-white flex items-center justify-center mb-3">
                     <FileText className="w-5 h-5" />
                   </div>
                   <span className="text-[10px] font-bold text-white/70 tracking-wider uppercase block">Publicaciones</span>
                   <span className="text-3xl font-black text-white block mt-1">{data.posts_count}</span>
                 </div>
                 <span className="text-[10px] font-semibold text-white/80 mt-2 block">↗ {data.posts_count} Compartidas</span>
               </div>

               {/* Disponibilidad */}
               <div onClick={() => isMe && openMobileEdit('availability')} className={`bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100 flex flex-col justify-between min-h-[140px] ${isMe ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}`}>
                 <div>
                   <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center mb-3">
                     <Clock className="w-5 h-5 text-orange-500" />
                   </div>
                   <span className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase block">Disponibilidad</span>
                   <span className="text-md font-extrabold text-orange-600 block mt-1.5 leading-snug">{avail.emoji} {avail.id === 3 ? 'Muy disponible' : avail.label}</span>
                 </div>
               </div>

               {/* Conexiones */}
               <div onClick={() => openSocialModal('followers')} className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100 flex flex-col justify-between min-h-[140px] cursor-pointer hover:bg-gray-50 transition-colors">
                 <div>
                   <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
                     <Users className="w-5 h-5 text-emerald-600" />
                   </div>
                   <span className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase block">Conexiones</span>
                   <span className="text-3xl font-black text-emerald-600 block mt-1">{data.followers_count}</span>
                 </div>
               </div>
             </div>
          </div>

          {/* ── COLUMNA DERECHA (Desktop) / ÚNICA (Mobile): Comunidades y Tabs ── */}
          <div className="flex-1 min-w-0 md:mt-8">
            
            {/* ── Mis Comunidades (Solo Desktop) ── */}
            <div className="hidden md:block bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-gray-900">Mis Comunidades</h3>
                {isMe && (
                  <button onClick={() => setEditingInterests(true)} className="text-sm font-bold text-purple-600 hover:text-purple-700 transition-colors">
                    Ver todas
                  </button>
                )}
              </div>
              <div className="flex items-start gap-4 overflow-x-auto pb-2 scrollbar-none">
                {isMe && (
                  <button onClick={() => setEditingInterests(true)} className="flex flex-col items-center gap-2 shrink-0 group focus:outline-none">
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-purple-400 flex items-center justify-center bg-purple-50/50 hover:bg-purple-100/50 transition-all">
                      <UserPlus className="w-6 h-6 text-purple-600" />
                    </div>
                    <span className="text-xs font-bold text-gray-600">Unirse</span>
                  </button>
                )}
                {selectedInterests.length === 0 ? (
                  <div className="flex items-center justify-center py-4 text-gray-400 gap-2 w-full">
                    <span className="text-xs italic">Sin comunidades seleccionadas</span>
                  </div>
                ) : (
                  selectedInterests.map(id => {
                    const interest = INTERESTS.find(i => i.id === id);
                    if (!interest) return null;
                    const IconComponent = interest.icon;
                    return (
                      <div key={id} className="flex flex-col items-center gap-2 shrink-0 max-w-[80px]">
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${interest.gradient} flex items-center justify-center shadow-md shadow-purple-500/10`}>
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xs font-bold text-gray-800 text-center truncate w-full">{interest.label}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ── Tabs Compartidas ── */}
            <div className="w-full max-w-2xl mx-auto md:max-w-none px-4 md:px-0">
              <div className="bg-transparent md:bg-white md:rounded-[2rem] md:shadow-sm md:border border-0 border-gray-100 overflow-visible md:overflow-hidden mb-4">
                <div className="flex p-1 bg-gray-100/90 rounded-xl gap-0.5 md:gap-0 mb-4 w-full overflow-x-auto scrollbar-none items-center justify-start md:justify-center border border-gray-200/40 md:flex md:p-0 md:bg-white md:border-0 md:border-b md:border-gray-100 md:rounded-none md:mb-0 md:shadow-none md:overflow-visible">
                  {TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`relative flex flex-1 min-w-fit md:flex-initial items-center justify-center gap-1 md:gap-1.5 px-2 py-2 md:px-6 md:py-3.5 text-[11px] md:text-sm font-bold md:font-medium whitespace-nowrap transition-colors rounded-[10px] md:rounded-none ${
                        activeTab === tab.id
                          ? 'text-[#9333EA]'
                          : 'text-gray-500 hover:text-gray-800 md:hover:text-gray-700'
                      }`}
                    >
                      {activeTab === tab.id && (
                        <>
                          <motion.div
                            layoutId="profileTabBg"
                            className="absolute inset-0 bg-white rounded-[10px] shadow-sm md:hidden z-0"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                          <motion.div
                            layoutId="profileTabBorder"
                            className="hidden md:block absolute bottom-0 left-0 right-0 h-[2px] bg-[#C026D3] z-0"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        </>
                      )}
                      <div className="relative z-10 flex items-center gap-1 md:gap-1.5">
                        {tab.icon}
                        {tab.label}
                        {tab.count !== undefined && (
                          <span className={`text-[10px] md:text-xs px-1.5 py-0.5 rounded-full transition-colors ${
                            activeTab === tab.id
                              ? 'bg-fuchsia-100 text-fuchsia-800'
                              : 'bg-gray-200/80 md:bg-gray-100 text-gray-500'
                          }`}>
                            {tab.count}
                          </span>
                        )}
                      </div>
                    </button>
            ))}
          </div>

          <div
            ref={tabContentRef}
            className="p-0 md:p-6"
            style={tabMinHeight ? { minHeight: `${tabMinHeight}px` } : undefined}
          >
            {loadingTab ? (
              <div className="flex items-center justify-center py-8 text-gray-400 gap-2">
                <div className="w-5 h-5 border-2 border-gray-200 border-t-purple-500 rounded-full animate-spin" />
                <span className="text-sm">Cargando...</span>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* ── Tab: Publicaciones ─────────────────────── */}
                  {activeTab === 'posts' && (
              <div className="space-y-3">
                {posts.length === 0 ? (
                  <div className="py-10 text-center">
                    <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Sin publicaciones aún</p>
                  </div>
                ) : posts.slice(0, visiblePostsCount).map(post => (
                  <PostCard
                    key={post.id}
                    post={{
                      id: post.id,
                      user_id: post.user_id || data.id,
                      title: post.title,
                      description: post.description,
                      post_type: post.post_type as any,
                      subtype: post.subtype as any,
                      tags: post.tags,
                      deadline_at: post.deadline_at,
                      time_status: (post.time_status || 'active') as any,
                      created_at: post.created_at,
                      user_name: post.user?.full_name || data.full_name,
                      user_email: post.user?.email || data.email,
                      user_profile_image_url: post.user?.profile_image_url || avatarUrl || undefined,
                      image_url: post.image_url,
                      images_count: post.images_count || 0,
                      links_count: 0,
                      is_pinned: false,
                      pin_priority: 0,
                      is_saved: false,
                      participation_status: undefined,
                      status: post.status,
                    }}
                    currentUserId={currentUserId}
                    onEdited={updated => {
                      const upd = updated as unknown as PostItem;
                      if (upd.status === 'archived') {
                        setPosts(prev => prev.filter(p => p.id !== upd.id))
                        if (isMe) {
                          setArchivedPosts(prev => [upd, ...prev.filter(p => p.id !== upd.id)])
                        }
                        return
                      }
                      setPosts(prev => prev.map(p => p.id === upd.id ? upd : p))
                      if (isMe) {
                        setArchivedPosts(prev => prev.filter(p => p.id !== upd.id))
                      }
                    }}
                    onDeleted={id => setPosts(prev => prev.filter(p => p.id !== id))}
                  />
                ))}
                {posts.length > visiblePostsCount && (
                  <div ref={postsLoaderRef} className="py-3 text-center text-xs text-gray-400">
                    Cargando más publicaciones...
                  </div>
                )}
              </div>
                  )}

                  {/* ── Tab: Guardadas ────────────────────────── */}
                  {activeTab === 'saved' && (
                    <SavedPostsTab
                posts={savedPosts}
                currentUserId={currentUserId}
                onUnsave={async (id: number) => {
                  try {
                    await unsavePost(id)
                    setSavedPosts(prev => prev.filter(p => p.id !== id))
                  } catch (e) { console.error(e) }
                }}
                onNavigate={(postId: number) => setSelectedPostId(postId)}
                onEditPost={(post: PostItem) => setEditingPost(post)}
                onUpdatedPost={(updated: PostItem) => {
                  setSavedPosts(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p))
                }}
                onDeletedPost={(id: number) => {
                  setSavedPosts(prev => prev.filter(p => p.id !== id))
                }}
              />
                  )}

                  {/* ── Tab: Archivadas ─────────────────────── */}
                  {activeTab === 'archived' && canSeeArchivedTab && (
                    <div className="space-y-3">
                {archivedPosts.length === 0 ? (
                  <div className="py-10 text-center">
                    <Archive className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No tienes publicaciones archivadas</p>
                  </div>
                ) : archivedPosts.map(post => (
                  <ArchivedPostCard
                    key={post.id}
                    post={post}
                    onUnarchived={(updated: PostItem) => {
                      setArchivedPosts(prev => prev.filter(p => p.id !== updated.id))
                      setPosts(prev => [{ ...updated, status: 'published' }, ...prev.filter(p => p.id !== updated.id)])
                    }}
                    onDeleted={(id: number) => setArchivedPosts(prev => prev.filter(p => p.id !== id))}
                  />
                ))}
              </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
          </div>
        </div>
      </div>

      {/* ── Modal Social ────────────────────────────── */}
      {showSocialModal && (
        <SocialModal
          initialTab={socialInitialTab}
          followers={modalFollowers}
          following={modalFollowing}
          loading={loadingSocial}
          isMe={isMe}
          onClose={() => setShowSocialModal(false)}
          onRemoveFollower={async (uid: number) => {
            try {
              await removeFollower(uid)
              setModalFollowers(prev => prev.filter(f => f.user_id !== uid))
              setData(prev => prev ? { ...prev, followers_count: Math.max(0, prev.followers_count - 1) } : prev)
            } catch (e) { console.error(e) }
          }}
          onFollowUser={async (uid: number) => {
            try { await followUser(uid) } catch (e) { console.error(e) }
          }}
          onUnfollow={async (uid: number) => {
            try {
              await unfollowUser(uid)
              setModalFollowing(prev => prev.filter(f => f.user_id !== uid))
              setData(prev => prev ? { ...prev, following_count: Math.max(0, prev.following_count - 1) } : prev)
            } catch (e) { console.error(e) }
          }}
        />
      )}

      {/* ── Modal de Edición Móvil ──────────────────────── */}
      {mobileEditField && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end justify-center p-0 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-[2.5rem] shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
              <h3 className="text-lg font-extrabold text-gray-900">
                {mobileEditField === 'career' ? 'Editar Carrera' :
                 mobileEditField === 'cycle' ? 'Editar Ciclo' :
                 'Editar Disponibilidad'}
              </h3>
              <button
                onClick={() => setMobileEditField(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* CAREER SELECTOR */}
              {mobileEditField === 'career' && (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Elige tu carrera</label>
                  <select
                    className="w-full border border-purple-200 rounded-2xl px-4 py-3.5 text-sm bg-white focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none shadow-sm transition-all"
                    value={mobileCareer}
                    onChange={e => setMobileCareer(e.target.value)}
                  >
                    <option value="">Seleccionar carrera</option>
                    {CAREER_FACULTIES.map(f => (
                      <optgroup key={f.label} label={f.label} className="font-bold text-purple-700">
                        {f.careers.map(c => (
                          <option key={c.id} value={c.label} className="font-medium text-gray-800">{c.icon} {c.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              )}

              {/* CYCLE SELECTOR */}
              {mobileEditField === 'cycle' && (
                <div className="space-y-4">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Selecciona tu ciclo actual</label>
                  <div className="grid grid-cols-5 gap-2">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(c => (
                      <button
                        key={c}
                        onClick={() => setMobileCycle(c)}
                        className={`py-3.5 rounded-xl font-bold text-sm border transition-all ${
                          mobileCycle === c
                            ? 'border-purple-600 bg-purple-100 text-purple-700 shadow-sm scale-95'
                            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* AVAILABILITY SELECTOR */}
              {mobileEditField === 'availability' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Estado de disponibilidad</label>
                  <div className="grid gap-2">
                    {AVAILABILITY_OPTIONS.map(opt => {
                      const IconComponent = AVAILABILITY_ICONS[opt.id] ?? Clock
                      const isSelected = mobileAvailability === opt.id
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setMobileAvailability(opt.id)}
                          className={`flex items-center gap-4 p-3 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? 'border-green-500 bg-green-50/50 shadow-sm'
                              : 'border-gray-150 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-green-150 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-extrabold text-gray-900 leading-snug">{opt.label}</p>
                            <p className="text-xs text-gray-500 font-medium truncate">{opt.description}</p>
                          </div>
                          {isSelected && <Check className="w-5 h-5 text-green-600 shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-100 bg-gray-50 flex gap-3 shrink-0">
              <button
                onClick={() => setMobileEditField(null)}
                className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-100 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={saveMobileField}
                disabled={mobileSaving}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#2f55f6] to-[#ba4ef8] text-white font-bold hover:brightness-105 active:scale-95 transition-all shadow-md text-sm flex items-center justify-center gap-1.5"
              >
                {mobileSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de Intereses Móvil ─────────────────────── */}
      {editingInterests && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end justify-center p-0 animate-in fade-in duration-200 block md:hidden">
          <div className="bg-white rounded-t-[2.5rem] shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
              <h3 className="text-lg font-extrabold text-gray-900">Editar Intereses</h3>
              <button
                onClick={() => setEditingInterests(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* TUS INTERESES */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">Tus comunidades ({selectedInterests.length})</p>
                <div className="flex flex-wrap gap-2 min-h-[48px] bg-purple-50/30 rounded-2xl p-3 border border-dashed border-purple-200">
                  {selectedInterests.length === 0 && (
                    <span className="text-xs text-gray-400 py-1 font-medium">Selecciona comunidades de abajo</span>
                  )}
                  {selectedInterests.map(id => {
                    const interest = INTERESTS.find(i => i.id === id)
                    if (!interest) return null
                    const SIcon = interest.icon
                    return (
                      <button
                        key={id}
                        onClick={() => handleToggleInterest(id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all active:scale-95"
                      >
                        <SIcon className="w-3.5 h-3.5 shrink-0" /> {interest.label} <X className="w-3.5 h-3.5 ml-0.5 opacity-60" />
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* DISPONIBLES */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">Comunidades disponibles</p>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.filter(i => !selectedInterests.includes(i.id)).map(interest => {
                    const IIcon = interest.icon
                    return (
                      <button
                        key={interest.id}
                        onClick={() => handleToggleInterest(interest.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-200 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-all active:scale-95"
                      >
                        <IIcon className="w-3.5 h-3.5 shrink-0" /> {interest.label}
                      </button>
                    )
                  })}
                  {INTERESTS.filter(i => !selectedInterests.includes(i.id)).length === 0 && (
                    <span className="text-xs text-gray-400 italic">Has seleccionado todas las comunidades</span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-100 bg-gray-50 flex gap-3 shrink-0">
              <button
                onClick={() => setEditingInterests(false)}
                className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-100 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={saveInterests}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#2f55f6] to-[#ba4ef8] text-white font-bold hover:brightness-105 active:scale-95 transition-all shadow-md text-sm flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-componente: lista de seguidores/seguidos ─────────

function FollowerList({
  items, emptyLabel, mode, isMe,
  onRemoveFollower, onFollowUser, onUnfollow,
}: {
  items: FollowerItem[]
  emptyLabel: string
  mode: 'followers' | 'following'
  isMe: boolean
  onRemoveFollower?: (userId: number) => void
  onFollowUser?: (userId: number) => void
  onUnfollow?: (userId: number) => void
}) {
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
      {items.map(item => {
        const avatarSaved = localStorage.getItem(`avatar_${item.user_id}`)
        return (
          <div key={item.user_id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
            {avatarSaved ? (
              <img src={avatarSaved} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0" />
            ) : (
              <div className={`w-10 h-10 rounded-full ${TW_UTOPP_GRADIENT_BR} flex items-center justify-center text-white font-semibold text-sm shrink-0`}>
                {(item.full_name || item.email).charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{item.full_name || 'Usuario'}</p>
              <p className="text-xs text-gray-500 truncate">{item.email}</p>
            </div>

            {/* Actions — only for own profile */}
            {isMe && (
              <div className="flex items-center gap-1.5 shrink-0">
                {mode === 'followers' && (
                  <>
                    {onFollowUser && (
                      <button
                        onClick={() => onFollowUser(item.user_id)}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-gradient-to-r from-[#2f55f6] to-[#ba4ef8] text-white hover:brightness-105 transition-all shadow-sm active:scale-95"
                      >
                        Seguir
                      </button>
                    )}
                    {onRemoveFollower && (
                      <button
                        onClick={() => onRemoveFollower(item.user_id)}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                      >
                        Eliminar
                      </button>
                    )}
                  </>
                )}
                {mode === 'following' && onUnfollow && (
                  <button
                    onClick={() => onUnfollow(item.user_id)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                  >
                    Dejar de seguir
                  </button>
                )}
              </div>
            )}

            {!isMe && (
              <p className="text-xs text-gray-400 shrink-0">
                {new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' }).format(new Date(item.followed_at))}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Sub-componente: modal seguidores/seguidos ───────────

function SocialModal({
  initialTab, followers, following, loading, isMe,
  onClose, onRemoveFollower, onFollowUser, onUnfollow,
}: {
  initialTab: 'followers' | 'following'
  followers: FollowerItem[]
  following: FollowerItem[]
  loading: boolean
  isMe: boolean
  onClose: () => void
  onRemoveFollower: (uid: number) => void
  onFollowUser: (uid: number) => void
  onUnfollow: (uid: number) => void
}) {
  const [tab, setTab] = useState<'followers' | 'following'>(initialTab)

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[75vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setTab('followers')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                tab === 'followers' ? 'bg-white text-[#9333EA] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Seguidores
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${tab === 'followers' ? 'bg-fuchsia-100 text-fuchsia-800' : 'bg-gray-200 text-gray-500'}`}>
                {followers.length}
              </span>
            </button>
            <button
              onClick={() => setTab('following')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                tab === 'following' ? 'bg-white text-[#9333EA] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Seguidos
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${tab === 'following' ? 'bg-fuchsia-100 text-fuchsia-800' : 'bg-gray-200 text-gray-500'}`}>
                {following.length}
              </span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-purple-500 rounded-full animate-spin" />
              <span className="text-sm">Cargando...</span>
            </div>
          ) : tab === 'followers' ? (
            <FollowerList
              items={followers}
              emptyLabel="Sin seguidores aún"
              mode="followers"
              isMe={isMe}
              onRemoveFollower={onRemoveFollower}
              onFollowUser={onFollowUser}
            />
          ) : (
            <FollowerList
              items={following}
              emptyLabel="No sigue a nadie aún"
              mode="following"
              isMe={isMe}
              onUnfollow={onUnfollow}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Sub-componente: tab de guardadas ───────────────────

const SAVED_FILTERS: { key: string; label: string }[] = [
  { key: 'all',                      label: 'Todos' },
  { key: 'academic_project',         label: 'Proyectos' },
  { key: 'event',                    label: 'Eventos' },
  { key: 'announcement',             label: 'Anuncios' },
  { key: 'international_opportunity', label: 'Oportunidades' },
  { key: 'simple_post',              label: 'Publicaciones' },
]

function deadlineUrgency(d?: string): number {
  if (!d) return Infinity
  return new Date(d).getTime()
}

function deadlineLabel(d?: string): string | null {
  if (!d) return null
  const ms = new Date(d).getTime() - Date.now()
  if (ms <= 0) return 'Vencido'
  const days = Math.ceil(ms / 86400000)
  if (days <= 1) return 'Cierra hoy'
  if (days <= 3) return `Cierra en ${days} días`
  if (days <= 7) return `Cierra en ${days} días`
  return null
}

function SavedPostsTab({
  posts, currentUserId, onUnsave, onNavigate, onEditPost, onUpdatedPost, onDeletedPost,
}: {
  posts: PostItem[]
  currentUserId: number | null
  onUnsave: (id: number) => void
  onNavigate: (postId: number) => void
  onEditPost: (post: PostItem) => void
  onUpdatedPost: (post: PostItem) => void
  onDeletedPost: (id: number) => void
}) {
  const [filter, setFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState<'all' | 'active' | 'expired'>('all')

  const filtered = filter === 'all' ? posts : posts.filter(p => p.post_type === filter)

  // Filtro de vencidas dentro de guardadas (sin “sección aparte”)
  const byTime =
    timeFilter === 'all'
      ? filtered
      : timeFilter === 'expired'
        ? filtered.filter(p => p.time_status === 'out_of_time')
        : filtered.filter(p => p.time_status !== 'out_of_time')

  // Orden: urgentes primero (deadline más cercana). Vencidas: las más recientes arriba.
  const sorted = [...byTime].sort((a, b) => {
    const aExpired = a.time_status === 'out_of_time'
    const bExpired = b.time_status === 'out_of_time'
    if (aExpired && !bExpired) return 1
    if (!aExpired && bExpired) return -1
    if (aExpired && bExpired) return deadlineUrgency(b.deadline_at) - deadlineUrgency(a.deadline_at)
    return deadlineUrgency(a.deadline_at) - deadlineUrgency(b.deadline_at)
  })

  if (posts.length === 0) {
    return (
      <div className="py-10 text-center">
        <Bookmark className="w-10 h-10 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">Aún no has guardado publicaciones</p>
        <p className="text-xs text-gray-400 mt-1">Usa el menú ⋮ en cualquier post para guardarlos</p>
      </div>
    )
  }

  const renderCard = (post: PostItem) => {
    const urgency = deadlineLabel(post.deadline_at)
    const isExpired = post.time_status === 'out_of_time'
    const isOwnPost = currentUserId !== null && post.user_id === currentUserId
    return (
      <div key={post.id}>
        <PostCard
          post={{
            id: post.id,
            user_id: post.user_id || 0,
            title: post.title,
            description: post.description,
            post_type: post.post_type as any,
            subtype: post.subtype as any,
            tags: post.tags,
            deadline_at: post.deadline_at,
            time_status: (post.time_status || 'active') as any,
            created_at: post.created_at,
            user_name: post.user?.full_name || "Usuario Desconocido",
            user_email: post.user?.email || "",
            user_profile_image_url: post.user?.profile_image_url || undefined,
            image_url: post.image_url,
            images_count: post.images_count || 0,
            links_count: 0,
            is_pinned: false,
            pin_priority: 0,
            is_saved: true,
            participation_status: undefined,
            status: post.status,
          }}
          currentUserId={currentUserId}
          onEdited={updated => onUpdatedPost(updated as unknown as PostItem)}
          onDeleted={onDeletedPost}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtros: tipo + vencidas (dentro del mismo listado) */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {SAVED_FILTERS.map(f => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                filter === f.key
                  ? `${TW_UTOPP_GRADIENT_R} text-white border-transparent shadow-sm`
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { key: 'all' as const, label: 'Todas' },
              { key: 'active' as const, label: 'Vigentes' },
              { key: 'expired' as const, label: 'Vencidas' },
            ] as const
          ).map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setTimeFilter(opt.key)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                timeFilter === opt.key
                  ? `${TW_UTOPP_GRADIENT_R} text-white border-transparent shadow-sm`
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {byTime.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-6">Sin resultados para este filtro</p>
      ) : (
        <div className="space-y-4">
          {sorted.map(renderCard)}
        </div>
      )}
    </div>
  )
}

// ─── Sub-componente: card de post archivado ──────────────

function ArchivedPostCard({
  post, onUnarchived, onDeleted,
}: {
  post: PostItem; onUnarchived: (p: PostItem) => void; onDeleted: (id: number) => void
}) {
  const [confirm, setConfirm] = useState<null | 'unarchive' | 'delete'>(null)

  const handleUnarchive = async () => {
    try {
      const updated = await unarchivePost(post.id)
      onUnarchived({ ...post, ...updated, status: 'published' })
    } catch (e) { console.error(e) }
    finally { setConfirm(null) }
  }

  const handleDelete = async () => {
    try { await deletePost(post.id); onDeleted(post.id) }
    catch (e) { console.error(e) }
    finally { setConfirm(null) }
  }

  return (
    <>
      {confirm === 'unarchive' && (
        <ConfirmModal
          title="Desarchivar publicación"
          message="El post volverá a estar publicado y visible en el feed. ¿Continuar?"
          onConfirm={handleUnarchive}
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

      <div className="bg-white md:bg-white border-b border-gray-150 md:border md:rounded-[22px] -mx-4 px-4 py-5 md:mx-0 md:p-4 space-y-3 shadow-none overflow-hidden transition-all md:hover:shadow-md opacity-70">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                {(() => {
                  const TypeIcon = POST_TYPE_ICONS[post.post_type as keyof typeof POST_TYPE_ICONS]
                  return TypeIcon ? <TypeIcon className="w-3 h-3 text-gray-500" /> : null
                })()}
                {POST_TYPE_LABELS[post.post_type as keyof typeof POST_TYPE_LABELS]}
              </span>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Archivado</span>
            </div>
            {post.title && <p className="font-semibold text-gray-900 text-sm">{post.title}</p>}
            <p className="text-gray-600 text-sm line-clamp-2">{post.description}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={(e) => { e.stopPropagation(); setConfirm('unarchive') }} className="p-1.5 rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-600 transition-colors" title="Desarchivar">
              <ArchiveRestore className="w-4 h-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setConfirm('delete') }} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="Eliminar">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400">
          {new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(post.created_at))}
        </p>
      </div>
    </>
  )
}

// ─── Sub-componente: tab de información ──────────────────

function InfoTab({
  data, isMe, avail,
  editingInterests, selectedInterests,
  onEditInterests, onCancelInterests, onSaveInterests, onToggleInterest,
  onProfileUpdate,
}: {
  data: ProfileData
  isMe: boolean
  avail: typeof AVAILABILITY_OPTIONS[number]
  editingInterests: boolean
  selectedInterests: string[]
  onEditInterests: () => void
  onCancelInterests: () => void
  onSaveInterests: () => void
  onToggleInterest: (id: string) => void
  onProfileUpdate: (patch: Record<string, unknown>) => Promise<void>
}) {
  const [showAllInterests, setShowAllInterests] = useState(false)
  const interests = data.interests ?? []
  const visible   = showAllInterests ? interests : interests.slice(0, 6)

  // Inline editing state for career, cycle, availability
  const [editingField, setEditingField] = useState<null | 'career' | 'cycle' | 'availability'>(null)
  const [editCareer, setEditCareer]         = useState(data.career ?? '')
  const [editCycle, setEditCycle]           = useState(data.cycle ?? 1)
  const [editAvailability, setEditAvailability] = useState(data.availability ?? 0)
  const [savingField, setSavingField]       = useState(false)

  const startEdit = (field: 'career' | 'cycle' | 'availability') => {
    if (field === 'career') setEditCareer(data.career ?? '')
    if (field === 'cycle') setEditCycle(data.cycle ?? 1)
    if (field === 'availability') setEditAvailability(data.availability ?? 0)
    setEditingField(field)
  }

  const saveField = async () => {
    setSavingField(true)
    try {
      if (editingField === 'career') await onProfileUpdate({ career: editCareer || undefined })
      if (editingField === 'cycle') await onProfileUpdate({ cycle: editCycle })
      if (editingField === 'availability') await onProfileUpdate({ availability: editAvailability })
      setEditingField(null)
    } catch (e) { console.error(e) }
    finally { setSavingField(false) }
  }

  return (
    <div className="space-y-4">
      {/* Carrera y Ciclo */}
      <div className="grid grid-cols-2 gap-3">
        {/* Carrera */}
        <div className="bg-purple-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Carrera</span>
            </div>
            {isMe && editingField !== 'career' && (
              <button onClick={() => startEdit('career')} className="text-purple-500 hover:text-purple-700 transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {editingField === 'career' ? (
            <div className="space-y-2 mt-1">
              <select
                className="w-full border border-purple-300 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none"
                value={editCareer}
                onChange={e => setEditCareer(e.target.value)}
              >
                <option value="">Seleccionar carrera</option>
                {CAREER_FACULTIES.map(f => (
                  <optgroup key={f.label} label={f.label}>
                    {f.careers.map(c => (
                      <option key={c.id} value={c.label}>{c.icon} {c.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <div className="flex gap-1.5">
                <button onClick={saveField} disabled={savingField} className="p-1 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors">
                  {savingField ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
                <button onClick={() => setEditingField(null)} className="p-1 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            data.career ? (
              <div className="flex items-center gap-3 mt-1.5 animate-in fade-in duration-300">
                {(() => {
                  const careerObj = CAREER_OPTIONS.find(c => c.label === data.career);
                  if (careerObj) {
                    const IconComponent = CAREER_ICONS[careerObj.id];
                    if (IconComponent) {
                      return (
                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
                          <IconComponent className="w-5 h-5 text-purple-700" />
                        </div>
                      );
                    }
                    return <span className="text-2xl shrink-0">{careerObj.icon}</span>;
                  }
                  return null;
                })()}
                <div>
                  <span className="font-semibold text-gray-800 text-sm block leading-snug">{data.career}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 font-medium text-sm mt-1">No especificada</p>
            )
          )}
        </div>

        {/* Ciclo */}
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Ciclo</span>
            </div>
            {isMe && editingField !== 'cycle' && (
              <button onClick={() => startEdit('cycle')} className="text-blue-500 hover:text-blue-700 transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {editingField === 'cycle' ? (
            <div className="space-y-2 mt-1">
              <select
                className="w-full border border-blue-300 rounded-lg px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none bg-white"
                value={editCycle}
                onChange={e => setEditCycle(Number(e.target.value))}
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map(c => (
                  <option key={c} value={c}>Ciclo {c}</option>
                ))}
              </select>
              <div className="flex gap-1.5">
                <button onClick={saveField} disabled={savingField} className="p-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                  {savingField ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
                <button onClick={() => setEditingField(null)} className="p-1 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-800 font-bold text-xl">{data.cycle ?? "—"}</p>
          )}
        </div>
      </div>

      {/* Disponibilidad */}
      <div className="bg-green-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-green-600" />
            <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Disponibilidad</span>
          </div>
          {isMe && editingField !== 'availability' && (
            <button onClick={() => startEdit('availability')} className="text-green-500 hover:text-green-700 transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {editingField === 'availability' ? (
          <div className="space-y-2">
            <div className="grid gap-1.5">
              {AVAILABILITY_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setEditAvailability(opt.id)}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border text-left transition-colors ${
                    editAvailability === opt.id
                      ? 'border-green-500 bg-green-100'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  {(() => {
                    const IconComponent = AVAILABILITY_ICONS[opt.id];
                    if (IconComponent) {
                      return (
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          editAvailability === opt.id ? 'bg-green-200 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                      );
                    }
                    return <span className="text-lg">{opt.emoji}</span>;
                  })()}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.description}</p>
                  </div>
                  {editAvailability === opt.id && <Check className="w-4 h-4 text-green-600 shrink-0" />}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 pt-1">
              <button onClick={saveField} disabled={savingField} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                {savingField ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                Guardar
              </button>
              <button onClick={() => setEditingField(null)} className="flex items-center gap-1.5 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
                <X className="w-4 h-4" /> Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 mt-1.5 animate-in fade-in duration-300">
            {(() => {
              const IconComponent = AVAILABILITY_ICONS[avail.id];
              if (IconComponent) {
                return (
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-700 shrink-0">
                    <IconComponent className="w-5 h-5 text-green-700" />
                  </div>
                );
              }
              return <span className="text-3xl shrink-0">{avail.emoji}</span>;
            })()}
            <div>
              <p className="font-semibold text-gray-800 text-sm leading-snug">{avail.label}</p>
              <p className="text-xs text-gray-500">{avail.description}</p>
            </div>
          </div>
        )}
      </div>

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
            {/* Conjunto total de intereses */}
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium">Disponibles</p>
              <div className="flex flex-wrap gap-1.5">
                {INTERESTS.filter(i => !selectedInterests.includes(i.id)).map(interest => {
                  const IIcon = interest.icon
                  return (
                    <button
                      key={interest.id}
                      onClick={() => onToggleInterest(interest.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-colors"
                    >
                      <IIcon className="w-3.5 h-3.5 shrink-0" /> {interest.label}
                    </button>
                  )
                })}
                {INTERESTS.filter(i => !selectedInterests.includes(i.id)).length === 0 && (
                  <span className="text-xs text-gray-400">Todos seleccionados</span>
                )}
              </div>
            </div>
            {/* Conjunto personal */}
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium">Tus intereses ({selectedInterests.length})</p>
              <div className="flex flex-wrap gap-1.5 min-h-[32px] bg-purple-50/50 rounded-lg p-2 border border-dashed border-purple-200">
                {selectedInterests.length === 0 && (
                  <span className="text-xs text-gray-400">Selecciona intereses de arriba</span>
                )}
                {selectedInterests.map(id => {
                  const interest = INTERESTS.find(i => i.id === id)
                  if (!interest) return null
                  const SIcon = interest.icon
                  return (
                    <button
                      key={id}
                      onClick={() => onToggleInterest(id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                    >
                      <SIcon className="w-3.5 h-3.5 shrink-0" /> {interest.label} <X className="w-3 h-3 ml-0.5" />
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={onSaveInterests} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#2f55f6] to-[#ba4ef8] text-white rounded-lg text-sm font-medium hover:brightness-105 transition-all shadow-sm active:scale-95">
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
                {visible.map((tag, i) => {
                  const known = INTERESTS.find(int => int.id === tag)
                  const KIcon = known?.icon
                  return (
                    <span key={i} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1">
                      {KIcon && <KIcon className="w-3.5 h-3.5 shrink-0" />}{known ? known.label : `#${tag}`}
                    </span>
                  )
                })}
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

// ─── Sub-componente: modal de recorte circular de avatar ──

function AvatarCropModal({
  src, onConfirm, onCancel,
}: {
  src: string
  onConfirm: (blob: Blob) => void
  onCancel: () => void
}) {
  const canvasSize = 300
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef       = useRef<HTMLImageElement>(null)
  const isDragging   = useRef(false)
  const lastPos      = useRef({ x: 0, y: 0 })
  const scaleRef     = useRef(1)

  const [offset, setOffset]         = useState({ x: 0, y: 0 })
  const [scale, setScale]           = useState(1)
  const [minScale, setMinScale]     = useState(1)
  const [imgNatural, setImgNatural] = useState({ w: 1, h: 1 })
  const [ready, setReady]           = useState(false)

  const getContainerPx = () => containerRef.current?.offsetWidth || canvasSize
  const maxScale = minScale * 4
  const sliderStep = Math.max(0.005, (maxScale - minScale) / 240)
  const zoomFactor = minScale > 0 ? (scale / minScale) : 1

  const clampOffset = (x: number, y: number, s: number, nat: { w: number; h: number }) => {
    const cPx = getContainerPx()
    const imgW = nat.w * s
    const imgH = nat.h * s

    const clampedX = imgW <= cPx
      ? (cPx - imgW) / 2
      : Math.min(0, Math.max(cPx - imgW, x))
    const clampedY = imgH <= cPx
      ? (cPx - imgH) / 2
      : Math.min(0, Math.max(cPx - imgH, y))

    return {
      x: clampedX,
      y: clampedY,
    }
  }

  const initFromImage = () => {
    const img = imgRef.current
    if (!img || img.naturalWidth === 0) return
    const nat = { w: img.naturalWidth, h: img.naturalHeight }
    setImgNatural(nat)
    const cPx = getContainerPx()
    const fitScale = cPx / Math.min(nat.w, nat.h)
    const rawX = (cPx - nat.w * fitScale) / 2
    const rawY = (cPx - nat.h * fitScale) / 2
    const clamped = clampOffset(rawX, rawY, fitScale, nat)
    setMinScale(fitScale)
    scaleRef.current = fitScale
    setScale(fitScale)
    setOffset(clamped)
    setReady(true)
  }

  const onImgLoad = () => { requestAnimationFrame(initFromImage) }

  const startPan = (x: number, y: number) => { isDragging.current = true; lastPos.current = { x, y } }
  const movePan  = (x: number, y: number) => {
    if (!isDragging.current) return
    const dx = x - lastPos.current.x
    const dy = y - lastPos.current.y
    lastPos.current = { x, y }
    setOffset(prev => clampOffset(prev.x + dx, prev.y + dy, scaleRef.current, imgNatural))
  }
  const endPan = () => { isDragging.current = false }

  const onMouseDown  = (e: React.MouseEvent) => { e.preventDefault(); startPan(e.clientX, e.clientY) }
  const onMouseMove  = (e: React.MouseEvent) => movePan(e.clientX, e.clientY)
  const onTouchStart = (e: React.TouchEvent) => startPan(e.touches[0].clientX, e.touches[0].clientY)
  const onTouchMove  = (e: React.TouchEvent) => { e.preventDefault(); movePan(e.touches[0].clientX, e.touches[0].clientY) }

  const handleConfirm = () => {
    const canvas  = document.createElement('canvas')
    canvas.width  = canvasSize
    canvas.height = canvasSize
    const ctx = canvas.getContext('2d')
    if (!ctx || !imgRef.current) return

    const containerPx = getContainerPx()
    const ratio = canvasSize / containerPx

    ctx.drawImage(
      imgRef.current,
      0, 0, imgNatural.w, imgNatural.h,
      offset.x * ratio, offset.y * ratio,
      imgNatural.w * scale * ratio, imgNatural.h * scale * ratio,
    )

    canvas.toBlob(blob => { if (blob) onConfirm(blob) }, 'image/jpeg', 0.92)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4">
        <h3 className="text-lg font-bold text-gray-900 text-center">Ajustar foto de perfil</h3>
        <p className="text-xs text-gray-400 text-center">Arrastra para mover · Slider para zoom</p>

        <div
          ref={containerRef}
          className="relative w-64 h-64 mx-auto rounded-full overflow-hidden bg-gray-200 cursor-move select-none shadow-inner border-2 border-gray-300"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={endPan}
          onMouseLeave={endPan}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={endPan}
        >
          <img
            ref={imgRef}
            src={src}
            alt="Crop preview"
            className="absolute pointer-events-none"
            draggable={false}
            onLoad={onImgLoad}
            style={{
              left: offset.x,
              top: offset.y,
              width: imgNatural.w * minScale,
              height: imgNatural.h * minScale,
              transform: `scale(${zoomFactor})`,
              transformOrigin: 'top left',
              willChange: 'transform, left, top',
              opacity: ready ? 1 : 0,
              transition: 'opacity 0.15s ease-out',
            }}
          />
        </div>

        <div className="flex items-center gap-3 px-4">
          <span className="text-xs text-gray-400">-</span>
          <input
            type="range"
            min={minScale}
            max={maxScale}
            step={sliderStep}
            value={scale}
            onChange={e => {
              if (!ready) return
              const newScale = Math.min(maxScale, Math.max(minScale, parseFloat(e.target.value)))
              scaleRef.current = newScale
              setScale(newScale)
              const cPx = getContainerPx()
              const centeredX = (cPx - imgNatural.w * newScale) / 2
              const centeredY = (cPx - imgNatural.h * newScale) / 2
              setOffset(clampOffset(centeredX, centeredY, newScale, imgNatural))
            }}
            className="flex-1 accent-[#9333EA] h-1.5"
          />
          <span className="text-xs text-gray-400">+</span>
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleConfirm} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2f55f6] to-[#ba4ef8] text-white font-medium hover:brightness-105 transition-all shadow-md active:scale-95">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

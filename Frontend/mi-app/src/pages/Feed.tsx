import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api/axios"
import { Heart, MessageCircle, Share2 } from "lucide-react"

type FeedEvent = {
  title: string
  start_time: string
  end_time: string
  tags?: string[]
  user_id?: number
  user_name?: string
}

type FeedAnnouncement = {
  title: string
  content: string
  user_id?: number
  user_name?: string
}

type FeedCommunityPost = {
  id: number
  content: string
  tags?: string[]
  user_id: number
  user_name: string
  created_at: string
  post_type: "Oportunidad Internacional" | "Eventos" | "Proyectos" | "Competencias" | "Convocatorias" | "Programas" | "Publicación General"
}

type FeedItem = {
  type: "event" | "community_post" | "announcement"
  score: number
  data: FeedEvent | FeedCommunityPost | FeedAnnouncement
}

interface FeedResponse {
  page: number
  size: number
  items: FeedItem[]
  next_page?: number | null
}

const PostCard = ({ item, isRecommended = false }: { item: FeedItem; isRecommended?: boolean }) => {
  const navigate = useNavigate()
  
  const handleUserClick = (userId: number) => {
    navigate(`/app/perfil/${userId}`)
  }

  if (item.type === "community_post") {
    const post = item.data as FeedCommunityPost
    
    // Parsear el contenido para extraer título, descripción y requisitos
    const parseContent = (content: string) => {
      const lines = content.split('\n').filter(line => line.trim())
      
      let title = ''
      const description: string[] = []
      const requirements: string[] = []
      let currentSection = 'description'
      
      lines.forEach((line, index) => {
        const trimmedLine = line.trim()
        
        // Primera línea como título
        if (index === 0) {
          title = trimmedLine
        }
        // Detectar sección de requisitos
        else if (trimmedLine.toLowerCase().includes('requisito') || 
                trimmedLine.toLowerCase().includes('requerimiento') ||
                trimmedLine.toLowerCase().includes('requirements')) {
          currentSection = 'requirements'
        }
        // Agregar a la sección correspondiente
        else if (currentSection === 'requirements') {
          requirements.push(trimmedLine)
        }
        else {
          description.push(trimmedLine)
        }
      })
      
      return {
        title,
        description: description.join('\n'),
        requirements: requirements.join('\n')
      }
    }
    
    const { title, description, requirements } = parseContent(post.content)
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
        {/* Header con info de usuario */}
        <div className="flex items-center justify-between p-3 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
              {post.user_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <button 
                onClick={() => handleUserClick(post.user_id)}
                className="font-semibold text-gray-900 hover:text-purple-600 transition-colors"
              >
                {post.user_name || `Usuario ${post.user_id}`}
              </button>
              <div className="text-sm text-gray-500">
                {new Date(post.created_at || '').toLocaleDateString('es-ES', { 
                  month: 'short', 
                  day: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
          {isRecommended && (
            <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium">
              Recomendado
            </span>
          )}
        </div>

        {/* Contenido estructurado del post */}
        <div className="p-4">
          {/* Título con tipo de publicación */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-gray-900 leading-tight">
                {title || 'Sin título'}
              </h3>
              {post.post_type && (
                <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap">
                  {post.post_type}
                </span>
              )}
            </div>
          </div>
          
          {/* Descripción */}
          {description && (
            <div className="mb-4">
              <p className="text-gray-800 whitespace-pre-wrap break-words">
                {description}
              </p>
            </div>
          )}
          
          {/* Requisitos */}
          {requirements && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-2">Requisitos:</h4>
              <p className="text-gray-700 whitespace-pre-wrap break-words text-sm">
                {requirements}
              </p>
            </div>
          )}
        </div>

        {/* Footer con acciones y tags */}
        <div className="px-4 pb-4">
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {post.tags.map((tag: string, index: number) => (
                <span 
                  key={index}
                  className="bg-purple-50 text-purple-600 text-xs px-2 py-1 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors">
                <Heart className="w-5 h-5" />
                <span className="text-sm">Me gusta</span>
              </button>
              <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm">Comentar</span>
              </button>
            </div>
            <button className="flex items-center space-x-1 text-gray-500 hover:text-green-500 transition-colors">
              <Share2 className="w-5 h-5" />
                <span className="text-sm">Compartir</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Para eventos y anuncios, mantener el estilo original
  return (
    <div className="border rounded p-3 bg-white">
      <div className="text-sm text-gray-500">{item.type} · score {item.score.toFixed(2)}</div>
      {item.type === "event" && item.data && (
        <div>
          <div className="font-medium">{(item.data as FeedEvent).title}</div>
          <div className="text-sm">{new Date((item.data as FeedEvent).start_time).toLocaleString()} - {new Date((item.data as FeedEvent).end_time).toLocaleString()}</div>
          {Array.isArray((item.data as FeedEvent).tags) && (
            <div className="text-xs text-gray-500">{(item.data as FeedEvent).tags?.join(", ")}</div>
          )}
        </div>
      )}
      {item.type === "announcement" && item.data && (
        <div>
          <div className="font-medium">{(item.data as FeedAnnouncement).title}</div>
          <div className="text-sm">{(item.data as FeedAnnouncement).content}</div>
        </div>
      )}
    </div>
  )
}

export default function Feed() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [roles, setRoles] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const loaderRef = useRef<HTMLDivElement | null>(null)

  const fetchPage = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      console.log("Cargando feed...")
      const { data } = await api.get<FeedResponse>("/feed", {
        params: { page, size: 10 },
      })
      console.log("Feed cargado:", data)
      setItems(prev => [...prev, ...data.items])
      if (!data.next_page) setHasMore(false)
      else setPage(data.next_page)
    } finally {
      setLoading(false)
    }
  }, [page, hasMore, loading])

  // Escuchar eventos globales de posts creados
  useEffect(() => {
    const handlePostCreated = (event: Event) => {
      const customEvent = event as CustomEvent
      if (!customEvent.detail) return
      
      const newPost = customEvent.detail
      console.log("Nuevo post recibido en Feed:", newPost)
      
      const newPostItem: FeedItem = {
        type: "community_post",
        score: 1.0,
        data: {
          ...newPost,
          user_name: "Tú", // El post creado por el usuario actual
        }
      }
      setItems(prev => [newPostItem, ...prev])
    }

    window.addEventListener('postCreated', handlePostCreated)
    
    return () => {
      window.removeEventListener('postCreated', handlePostCreated)
    }
  }, [])

  useEffect(() => {
    const el = loaderRef.current
    if (!el) return
    const io = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
      entries.forEach((e: IntersectionObserverEntry) => {
        if (e.isIntersecting) fetchPage()
      })
    })
    io.observe(el)
    return () => io.disconnect()
  }, [fetchPage])

  const handleCreatePost = async () => {
    setCreateLoading(true)
    try {
      const newPost = {
        content: content,
        tags: tags.split(',').map(tag => tag.trim()),
        roles: roles.split(',').map(role => role.trim()),
      }
      console.log("Creando post:", newPost)
      // Simular la creación del post
      const event = new CustomEvent('postCreated', { detail: newPost })
      window.dispatchEvent(event)
      setContent('')
      setTags('')
      setRoles('')
      setShowCreateModal(false) // Cerrar modal después de crear el post
    } finally {
      setCreateLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">🏠 Feed UTEC</h1>
        </div>

        {/* Modal para crear post */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              {/* Header del modal */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Crear Nuevo Post</h2>
              </div>

              {/* Formulario */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contenido del post
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg p-3 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={4}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="¿Qué estás pensando?..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Etiquetas (separadas por coma)
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={tags}
                    onChange={e => setTags(e.target.value)}
                    placeholder="ej: estudio, utec, amigos"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Roles requeridos (separados por coma)
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={roles}
                    onChange={e => setRoles(e.target.value)}
                    placeholder="ej: estudiante, profesor"
                  />
                </div>
              </div>

              {/* Footer del modal */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreatePost} 
                  disabled={createLoading || !content.trim()}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createLoading ? "Publicando..." : "Publicar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Posts del feed */}
        <div className="space-y-4">
          {items.map((item: FeedItem, idx: number) => (
            <PostCard key={idx} item={item} />
          ))}
        </div>
        
        {loading && <div className="text-center text-sm text-gray-500">Cargando más contenido...</div>}
        <div ref={loaderRef} />
      </div>
    </div>
  )
}

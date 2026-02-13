import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api/axios"
import { Heart, MessageCircle, Share2, Info } from "lucide-react"

// Componente UserAvatar para mostrar iniciales con gradientes
const UserAvatar = ({ userName, gradient }: { 
  userName?: string; 
  gradient: string 
}) => {
  const initial = userName?.charAt(0).toUpperCase() || 'U'
  
  return (
    <div className={`w-10 h-10 ${gradient} rounded-full flex items-center justify-center text-white font-semibold`}>
      {initial}
    </div>
  )
}

// Helper functions para manejo de nombres
const getDisplayName = (userName?: string, userId?: number) => {
  if (userName && userName.trim()) return userName
  return userId ? `Usuario ${userId}` : 'Usuario Anónimo'
}

// Componente TypeBadge para identificar tipos de publicación
const TypeBadge = ({ type, score }: { type: string; score: number }) => {
  const config = {
    community_post: { icon: '📝', color: 'purple', label: 'Publicación' },
    event: { icon: '📅', color: 'blue', label: 'Evento' },
    announcement: { icon: '📢', color: 'green', label: 'Anuncio' }
  }
  
  const typeConfig = config[type as keyof typeof config] || config.community_post
  
  return (
    <div className={`flex items-center space-x-2 bg-${typeConfig.color}-100 px-3 py-1 rounded-full`}>
      <span>{typeConfig.icon}</span>
      <span className="text-xs font-medium text-gray-700">{typeConfig.label}</span>
      <span className="text-xs text-gray-500">({score.toFixed(1)})</span>
    </div>
  )
}

// Componente ScoreExplanation para explicar relevancia
const ScoreExplanation = ({ score }: { score: number }) => {
  const [showDetails, setShowDetails] = useState(false)
  
  const factors = [
    { name: 'Intereses匹配', percentage: 40, weight: 0.4 },
    { name: 'Proximidad Social', percentage: 25, weight: 0.25 },
    { name: 'Recencia', percentage: 20, weight: 0.2 },
    { name: 'Ciclo Académico', percentage: 10, weight: 0.1 },
    { name: 'Disponibilidad', percentage: 5, weight: 0.05 }
  ]
  
  return (
    <div className="relative">
      <button 
        onClick={() => setShowDetails(!showDetails)}
        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        title="¿Por qué es relevante?"
      >
        <Info className="w-4 h-4 text-gray-500" />
      </button>
      
      {showDetails && (
        <div className="absolute top-full right-0 w-80 bg-white rounded-lg shadow-lg p-4 z-50 border border-gray-200">
          <h4 className="font-semibold mb-3 text-gray-900">¿Por qué te recomendamos esto?</h4>
          <div className="space-y-3">
            {factors.map(factor => (
              <div key={factor.name} className="flex justify-between items-center">
                <span className="text-sm text-gray-700">{factor.name}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${factor.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{factor.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Score Total</span>
              <span className="font-bold text-purple-600">{score.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

type FeedEvent = {
  id: number
  title: string
  description?: string
  start_time: string
  end_time: string
  location?: string
  is_virtual: boolean
  tags?: string[]
  category?: string
  min_cycle?: number
  max_cycle?: number
  created_by_id: number
  popularity: number
  user_name?: string
}

type FeedAnnouncement = {
  id: number
  title: string
  content: string
  tags?: string[]
  created_by_id?: number
  user_name?: string
  created_at: string
}

type FeedCommunityPost = {
  id: number
  content: string
  tags?: string[]
  user_id: number
  user_name?: string
  created_at: string
  post_type: "Oportunidad Internacional" | "Eventos" | "Proyectos" | "Competencias" | "Convocatorias" | "Programas" | "Publicación General"
  link_form?: string
  closing_date?: string
  required_roles?: string[]
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

const PostCard = ({ item }: { item: FeedItem }) => {
  const navigate = useNavigate()
  
  const handleUserClick = (userId?: number) => {
    if (userId) {
      navigate(`/app/perfil/${userId}`)
    }
  }

  if (item.type === "community_post") {
    const post = item.data as FeedCommunityPost
    
    // Validar que post.content exista
    if (!post.content) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-gray-500">Post sin contenido disponible</p>
        </div>
      )
    }
    
    // Parsear el contenido para extraer título, descripción y requisitos
    const parseContent = (content?: string) => {
      if (!content || typeof content !== 'string') {
        return {
          title: 'Sin título',
          description: '',
          requirements: ''
        }
      }
      
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
            <UserAvatar 
              userName={post.user_name} 
              gradient="bg-gradient-to-br from-purple-500 to-pink-500" 
            />
            <div>
              <button 
                onClick={() => handleUserClick(post.user_id)}
                className="font-semibold text-gray-900 hover:text-purple-600 transition-colors"
              >
                {getDisplayName(post.user_name, post.user_id)}
              </button>
              <div className="text-sm text-gray-500">
                {new Date(post.created_at || new Date()).toLocaleDateString('es-ES', { 
                  month: 'short', 
                  day: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <TypeBadge type={item.type} score={item.score} />
            <ScoreExplanation score={item.score} />
          </div>
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

          {/* Link del formulario */}
          {post.link_form && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-2">Formulario:</h4>
              <a 
                href={post.link_form} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-purple-600 hover:text-purple-700 text-sm underline break-words"
              >
                {post.link_form}
              </a>
            </div>
          )}

          {/* Fecha de cierre */}
          {post.closing_date && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-2">Fecha de cierre:</h4>
              <p className="text-gray-700 text-sm">
                {new Date(post.closing_date || new Date()).toLocaleString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          )}
        </div>

        {/* Footer con acciones y tags */}
        <div className="px-4 pb-4">
          {(post.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {(post.tags || []).map((tag: string, index: number) => (
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

  // Componente para Eventos
  if (item.type === "event") {
    const event = item.data as FeedEvent
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
        {/* Header con info de usuario */}
        <div className="flex items-center justify-between p-3 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <UserAvatar 
              userName={event.user_name} 
              gradient="bg-gradient-to-br from-blue-500 to-cyan-500" 
            />
            <div>
              <button 
                onClick={() => event.created_by_id && handleUserClick(event.created_by_id)}
                className="font-semibold text-gray-900 hover:text-purple-600 transition-colors"
              >
                {getDisplayName(event.user_name, event.created_by_id)}
              </button>
              <div className="text-sm text-gray-500">
                {new Date(event.start_time || new Date()).toLocaleDateString('es-ES', { 
                  month: 'short', 
                  day: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <TypeBadge type={item.type} score={item.score} />
            <ScoreExplanation score={item.score} />
          </div>
        </div>

        {/* Contenido del evento */}
        <div className="p-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
          {event.description && (
            <p className="text-gray-800 mb-4">{event.description}</p>
          )}
          
          <div className="space-y-2 text-sm text-gray-600">
            {event.location && (
              <div className="flex items-center space-x-2">
                <span className="font-medium">�</span>
                <span>{event.location}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <span className="font-medium">�🕐</span>
              <span>
                {new Date(event.start_time || new Date()).toLocaleString('es-ES')} - 
                {new Date(event.end_time || new Date()).toLocaleString('es-ES')}
              </span>
            </div>
            {event.is_virtual && (
              <div className="flex items-center space-x-2">
                <span className="font-medium">💻</span>
                <span>Evento virtual</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {(event.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {(event.tags || []).map((tag: string, index: number) => (
                <span 
                  key={index}
                  className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer con acciones */}
        <div className="px-4 pb-4">
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

  // Componente para Anuncios
  if (item.type === "announcement") {
    const announcement = item.data as FeedAnnouncement
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
        {/* Header con info de usuario */}
        <div className="flex items-center justify-between p-3 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <UserAvatar 
              userName={announcement.user_name} 
              gradient="bg-gradient-to-br from-green-500 to-emerald-500" 
            />
            <div>
              <button 
                onClick={() => announcement.created_by_id && handleUserClick(announcement.created_by_id)}
                className="font-semibold text-gray-900 hover:text-purple-600 transition-colors"
              >
                {getDisplayName(announcement.user_name, announcement.created_by_id)}
              </button>
              <div className="text-sm text-gray-500">
                {new Date(announcement.created_at || new Date()).toLocaleDateString('es-ES', { 
                  month: 'short', 
                  day: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <TypeBadge type={item.type} score={item.score} />
            <ScoreExplanation score={item.score} />
          </div>
        </div>

        {/* Contenido del anuncio */}
        <div className="p-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{announcement.title}</h3>
          <p className="text-gray-800 whitespace-pre-wrap break-words">{announcement.content}</p>

          {/* Tags */}
          {(announcement.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {(announcement.tags || []).map((tag: string, index: number) => (
                <span 
                  key={index}
                  className="bg-green-50 text-green-600 text-xs px-2 py-1 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer con acciones */}
        <div className="px-4 pb-4">
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

  // Fallback para tipos desconocidos
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="text-sm text-gray-500">{item.type} · score {item.score.toFixed(2)}</div>
      <div className="text-gray-700 mt-2">Contenido no disponible</div>
    </div>
  )
}

export default function Feed() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">🏠 Feed UTEC</h1>
        </div>

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

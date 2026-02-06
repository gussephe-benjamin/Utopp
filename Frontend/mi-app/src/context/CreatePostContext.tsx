import { createContext, useContext, useState, type ReactNode } from "react"

interface CreatePostContextType {
  showCreateModal: boolean
  setShowCreateModal: (show: boolean) => void
  showTypeSelection: boolean
  setShowTypeSelection: (show: boolean) => void
  title: string
  setTitle: (title: string) => void
  description: string
  setDescription: (description: string) => void
  requirements: string
  setRequirements: (requirements: string) => void
  content: string
  setContent: (content: string) => void
  tags: string
  setTags: (tags: string) => void
  roles: string
  setRoles: (roles: string) => void
  post_type: "Oportunidad Internacional" | "Eventos" | "Proyectos" | "Competencias" | "Convocatorias" | "Programas" | "Publicación General"
  setPostType: (type: "Oportunidad Internacional" | "Eventos" | "Proyectos" | "Competencias" | "Convocatorias" | "Programas" | "Publicación General") => void
  createLoading: boolean
  setCreateLoading: (loading: boolean) => void
  handleCreatePost: () => Promise<void>
}

const createPostContext = createContext<CreatePostContextType | undefined>(undefined)

export function useCreatePost() {
  const context = useContext(createPostContext)
  if (!context) {
    throw new Error("useCreatePost must be used within CreatePostProvider")
  }
  return context
}

export function CreatePostProvider({ children }: { children: ReactNode }) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showTypeSelection, setShowTypeSelection] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [requirements, setRequirements] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState("")
  const [roles, setRoles] = useState("")
  const [post_type, setPostType] = useState<"Oportunidad Internacional" | "Eventos" | "Proyectos" | "Competencias" | "Convocatorias" | "Programas" | "Publicación General">("Publicación General")
  const [createLoading, setCreateLoading] = useState(false)

  const handleCreatePost = async () => {
    if (!title.trim() || !description.trim()) return
    setCreateLoading(true)
    try {
      // Importar dinámicamente para evitar dependencia circular
      const communityModule = await import("../api/apiFunctions/community")
      const { createCommunityPost } = communityModule
      
      // Construir el contenido combinando título, descripción y requisitos
      let fullContent = title
      if (description.trim()) {
        fullContent += '\n\n' + description
      }
      if (requirements.trim()) {
        fullContent += '\n\nRequisitos:\n' + requirements
      }
      
      console.log("Creando post con payload:", { title, description, requirements, post_type })
      
      const payload = {
        content: fullContent,
        tags: tags ? tags.split(",").map((s: string) => s.trim()).filter(Boolean) : undefined,
        required_roles: roles ? roles.split(",").map((s: string) => s.trim()).filter(Boolean) : undefined,
        post_type
      }
      const created = await createCommunityPost(payload)
      console.log("Post creado exitosamente:", created)
      
      // Emitir evento global para que el Feed lo escuche
      window.dispatchEvent(new CustomEvent('postCreated', { detail: created }))
      
      // Limpiar formulario y cerrar modal
      setTitle("")
      setDescription("")
      setRequirements("")
      setContent("")
      setTags("")
      setRoles("")
      setShowCreateModal(false)
    } catch (error) {
      console.error("Error creando post:", error)
      alert("Error al crear el post. Intenta nuevamente.")
    } finally {
      setCreateLoading(false)
    }
  }

  const value: CreatePostContextType = {
    showCreateModal,
    setShowCreateModal,
    showTypeSelection,
    setShowTypeSelection,
    title,
    setTitle,
    description,
    setDescription,
    requirements,
    setRequirements,
    content,
    setContent,
    tags,
    setTags,
    roles,
    setRoles,
    post_type,
    setPostType,
    createLoading,
    setCreateLoading,
    handleCreatePost,
  }

  return (
    <createPostContext.Provider value={value}>
      {children}
    </createPostContext.Provider>
  )
}

import { createContext, useContext, useState, type ReactNode } from "react"

interface CreatePostContextType {
  showCreateModal: boolean
  setShowCreateModal: (show: boolean) => void
  showTypeSelection: boolean
  setShowTypeSelection: (show: boolean) => void
  currentStep: number
  setCurrentStep: (step: number) => void
  isEditing: boolean
  setIsEditing: (editing: boolean) => void
  title: string
  setTitle: (title: string) => void
  description: string
  setDescription: (description: string) => void
  requirements: string
  setRequirements: (requirements: string) => void
  link_form: string
  setLinkForm: (link_form: string) => void
  closing_date: string
  setClosingDate: (closing_date: string) => void
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
  handleCreatePost: (override?: {
    title?: string
    description?: string
    requirements?: string
    link_form?: string
    closing_date?: string
    tags?: string
    roles?: string
    post_type?: "Oportunidad Internacional" | "Eventos" | "Proyectos" | "Competencias" | "Convocatorias" | "Programas" | "Publicación General"
  }) => Promise<void>
  handleUpdatePost: () => Promise<void>
  nextStep: () => void
  prevStep: () => void
  canGoNext: () => boolean
  canGoPrev: () => boolean
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
  const [currentStep, setCurrentStep] = useState(1)
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [requirements, setRequirements] = useState("")
  const [link_form, setLinkForm] = useState("")
  const [closing_date, setClosingDate] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState("")
  const [roles, setRoles] = useState("")
  const [post_type, setPostType] = useState<"Oportunidad Internacional" | "Eventos" | "Proyectos" | "Competencias" | "Convocatorias" | "Programas" | "Publicación General">("Publicación General")
  const [createLoading, setCreateLoading] = useState(false)

  const steps = [
    { id: 1, name: "Tipo de publicación", required: true },
    { id: 2, name: "Información principal", required: true },
    { id: 3, name: "Link del formulario", required: false },
    { id: 4, name: "Fecha de cierre", required: false },
    { id: 5, name: "Vista previa", required: false }
  ]

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canGoNext = () => {
    const step = steps[currentStep - 1]
    if (!step.required) return true
    
    switch (currentStep) {
      case 1: return post_type !== "Publicación General"
      case 2: return title.trim() !== "" && description.trim() !== ""
      default: return true
    }
  }

  const canGoPrev = () => {
    return currentStep > 1
  }

  const handleCreatePost = async (override?: {
    title?: string
    description?: string
    requirements?: string
    link_form?: string
    closing_date?: string
    tags?: string
    roles?: string
    post_type?: "Oportunidad Internacional" | "Eventos" | "Proyectos" | "Competencias" | "Convocatorias" | "Programas" | "Publicación General"
  }) => {
    const effectiveTitle = (override?.title ?? title).trim()
    const effectiveDescription = (override?.description ?? description).trim()
    const effectiveRequirements = (override?.requirements ?? requirements).trim()
    const effectiveLinkForm = override?.link_form ?? link_form
    const effectiveClosingDate = override?.closing_date ?? closing_date
    const effectiveTags = override?.tags ?? tags
    const effectiveRoles = override?.roles ?? roles
    const effectivePostType = override?.post_type ?? post_type

    if (!effectiveTitle || !effectiveDescription) return
    setCreateLoading(true)
    try {
      // Importar dinámicamente para evitar dependencia circular
      const communityModule = await import("../api/apiFunctions/community")
      const { createCommunityPost } = communityModule
      
      // Construir el contenido combinando título, descripción y requisitos
      let fullContent = effectiveTitle
      if (effectiveDescription) {
        fullContent += '\n\n' + effectiveDescription
      }
      if (effectiveRequirements) {
        fullContent += '\n\nRequisitos:\n' + effectiveRequirements
      }
      
      console.log("Creando post con payload:", { title: effectiveTitle, description: effectiveDescription, requirements: effectiveRequirements, post_type: effectivePostType, link_form: effectiveLinkForm, closing_date: effectiveClosingDate })
      
      const payload = {
        content: fullContent,
        link_form: effectiveLinkForm.trim() || null,
        closing_date: effectiveClosingDate ? new Date(effectiveClosingDate).toISOString() : null,
        tags: effectiveTags ? effectiveTags.split(",").map((s: string) => s.trim()).filter(Boolean) : undefined,
        required_roles: effectiveRoles ? effectiveRoles.split(",").map((s: string) => s.trim()).filter(Boolean) : undefined,
        post_type: effectivePostType
      }
      const created = await createCommunityPost(payload)
      console.log("Post creado exitosamente:", created)
      
      // Emitir evento global para que el Feed lo escuche
      window.dispatchEvent(new CustomEvent('postCreated', { detail: created }))
      
      // Limpiar formulario y cerrar modal
      resetForm()
      setShowCreateModal(false)
    } catch (error) {
      console.error("Error creando post:", error)
      alert("Error al crear el post. Intenta nuevamente.")
    } finally {
      setCreateLoading(false)
    }
  }

  const handleUpdatePost = async () => {
    // Implementar lógica de actualización
    setIsEditing(false)
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setRequirements("")
    setLinkForm("")
    setClosingDate("")
    setContent("")
    setTags("")
    setRoles("")
    setPostType("Publicación General")
    setCurrentStep(1)
    setIsEditing(false)
  }

  const value: CreatePostContextType = {
    showCreateModal,
    setShowCreateModal,
    showTypeSelection,
    setShowTypeSelection,
    currentStep,
    setCurrentStep,
    isEditing,
    setIsEditing,
    title,
    setTitle,
    description,
    setDescription,
    requirements,
    setRequirements,
    link_form,
    setLinkForm,
    closing_date,
    setClosingDate,
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
    handleUpdatePost,
    nextStep,
    prevStep,
    canGoNext,
    canGoPrev,
  }

  return (
    <createPostContext.Provider value={value}>
      {children}
    </createPostContext.Provider>
  )
}

import {
  Globe,
  Calendar,
  GraduationCap,
  Megaphone,
  MessageSquare,
  Plane,
  Briefcase,
  Search,
  Award,
  Presentation,
  Palette,
  Rocket,
  Code,
  Heart,
  Dumbbell,
  Building,
  Trophy,
  Microscope,
  FileText,
  AlertTriangle,
  Info,
  HelpCircle,
  MessagesSquare,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ============================================================
// Tipos compartidos para el flujo de creación y visualización
// de posts. Estos enums y tipos coinciden 1:1 con el backend.
// ============================================================

// ── Enums principales ─────────────────────────────────────

/** Tipos de publicación disponibles (coincide con PostType en backend). */
export type PostType =
  | 'international_opportunity'
  | 'event'
  | 'academic_project'
  | 'announcement'
  | 'simple_post'

/** Subtipos de publicación (coincide con SubPostType en backend). */
export type SubPostType =
  // Oportunidades Internacionales
  | 'intercambio'
  | 'pasantia'
  | 'investigacion'
  | '4+1'
  // Eventos
  | 'conferencia'
  | 'arte'
  | 'emprendimiento'
  | 'hackathon'
  | 'voluntariado'
  | 'deporte'
  | 'visita_academica'
  | 'empleo'
  // Proyectos Académicos
  | 'competencia'
  | 'proyecto_investigacion'
  // Anuncios
  | 'comunicado'
  | 'urgente'
  // Publicaciones Simples
  | 'informativo'
  | 'pregunta'
  | 'debate'

/** Tipo del enlace (define el propósito del botón). */
export type PostLinkType =
  | 'action'       // Botón de acción directa (ej: "Aplicar")
  | 'registration' // Formulario de inscripción
  | 'info'         // Información adicional
  | 'resource'     // Recurso descargable o consultable
  | 'meeting'      // Reunión o evento en línea
  | 'repo'         // Repositorio de código
  | 'download'     // Archivo para descargar
  | 'other'        // Otro tipo genérico

/** Cómo se muestra el enlace en el post (botón prominente o enlace simple). */
export type PostLinkDisplayType = 'button' | 'link'

/** Estado de publicación del post. */
export type PostStatus = 'draft' | 'published' | 'archived'

/** Estado respecto al deadline. */
export type TimeStatus = 'no_deadline' | 'in_time' | 'out_of_time'

// ── Subtipos válidos por tipo ─────────────────────────────

/** Mapa de subtipos válidos para cada tipo de post. */
export const VALID_SUBTYPES: Record<PostType, SubPostType[]> = {
  international_opportunity: ['intercambio', 'pasantia', 'investigacion', '4+1'],
  event: ['conferencia', 'arte', 'emprendimiento', 'hackathon', 'voluntariado', 'deporte', 'visita_academica', 'empleo'],
  academic_project: ['competencia', 'proyecto_investigacion'],
  announcement: ['comunicado', 'urgente'],
  simple_post: ['informativo', 'pregunta', 'debate'],
}

// ── Labels legibles para humanos ─────────────────────────

export const POST_TYPE_LABELS: Record<PostType, string> = {
  international_opportunity: 'Oportunidad Internacional',
  event: 'Evento',
  academic_project: 'Proyecto Académico',
  announcement: 'Anuncio',
  simple_post: 'Publicación Simple',
}

export const POST_TYPE_ICONS: Record<PostType, LucideIcon> = {
  international_opportunity: Globe,
  event: Calendar,
  academic_project: GraduationCap,
  announcement: Megaphone,
  simple_post: MessageSquare,
}

export const POST_TYPE_DESCRIPTIONS: Record<PostType, string> = {
  international_opportunity: 'Oportunidades de estudio y trabajo en el extranjero',
  event: 'Eventos académicos y sociales',
  academic_project: 'Proyectos de investigación y competencias académicas',
  announcement: 'Anuncios y comunicados institucionales',
  simple_post: 'Publicaciones generales de la comunidad',
}

export const SUBTYPE_LABELS: Record<SubPostType, string> = {
  intercambio: 'Intercambio',
  pasantia: 'Pasantía',
  investigacion: 'Investigación',
  '4+1': '4+1',
  conferencia: 'Conferencia',
  arte: 'Arte',
  emprendimiento: 'Emprendimiento',
  hackathon: 'Hackathon',
  voluntariado: 'Voluntariado',
  deporte: 'Deporte',
  visita_academica: 'Visita Académica',
  empleo: 'Empleo',
  competencia: 'Competencia',
  proyecto_investigacion: 'Proyecto de Investigación',
  comunicado: 'Comunicado',
  urgente: 'Urgente',
  informativo: 'Informativo',
  pregunta: 'Pregunta',
  debate: 'Debate',
}

export const SUBTYPE_ICONS: Record<SubPostType, LucideIcon> = {
  intercambio: Plane,
  pasantia: Briefcase,
  investigacion: Microscope,
  '4+1': Award,
  conferencia: Presentation,
  arte: Palette,
  emprendimiento: Rocket,
  hackathon: Code,
  voluntariado: Heart,
  deporte: Dumbbell,
  visita_academica: Building,
  empleo: Briefcase,
  competencia: Trophy,
  proyecto_investigacion: Microscope,
  comunicado: FileText,
  urgente: AlertTriangle,
  informativo: Info,
  pregunta: HelpCircle,
  debate: MessagesSquare,
}


export const SUBTYPE_DESCRIPTIONS: Record<SubPostType, string> = {
  intercambio: 'Programas de intercambio estudiantil en universidades extranjeras',
  pasantia: 'Oportunidades de prácticas profesionales en el extranjero',
  investigacion: 'Proyectos de investigación colaborativa internacional',
  '4+1': 'Programas de doble titulación con universidades asociadas',
  conferencia: 'Charlas, ponencias y congresos académicos',
  arte: 'Eventos culturales, exposiciones y presentaciones artísticas',
  emprendimiento: 'Talleres, hackathons y competencias de emprendimiento',
  hackathon: 'Maratones de programación y desarrollo de soluciones',
  voluntariado: 'Actividades de servicio social y comunitario',
  deporte: 'Torneos, competencias y eventos deportivos',
  visita_academica: 'Visitas guiadas a instituciones y empresas',
  empleo: 'Ferias de empleo y sesiones de reclutamiento',
  competencia: 'Concursos académicos y competencias interuniversitarias',
  proyecto_investigacion: 'Proyectos de investigación y desarrollo científico',
  comunicado: 'Información general y comunicados institucionales',
  urgente: 'Anuncios de alta prioridad y emergencias',
  informativo: 'Compartir información útil con la comunidad',
  pregunta: 'Plantear dudas y solicitar ayuda a la comunidad',
  debate: 'Iniciar discusiones sobre temas de interés',
}

/** Opciones para el selector de tipo de enlace en el formulario. */
export const LINK_TYPE_OPTIONS: { value: PostLinkType; label: string; icon: string }[] = [
  { value: 'action',       label: 'Acción directa',    icon: '⚡' },
  { value: 'registration', label: 'Inscripción',        icon: '📝' },
  { value: 'info',         label: 'Información',        icon: 'ℹ️' },
  { value: 'resource',     label: 'Recurso',            icon: '📄' },
  { value: 'meeting',      label: 'Reunión / Evento',   icon: '📅' },
  { value: 'repo',         label: 'Repositorio',        icon: '💻' },
  { value: 'download',     label: 'Descarga',           icon: '⬇️' },
  { value: 'other',        label: 'Otro',               icon: '🔗' },
]

// ── Estructuras de datos del wizard ──────────────────────

/** Imagen en proceso de subida o ya subida, dentro del wizard. */
export interface WizardImage {
  /** ID temporal en el cliente (para drag-drop y keys de React). */
  tempId: string
  /** Archivo original (solo presente si aún no subió a Cloudinary). */
  file?: File
  /** URL de previsualización local (Object URL) para mostrar thumbnail. */
  previewUrl: string
  /** ID en Cloudinary, disponible tras subida exitosa. */
  cloudinaryId?: string
  /** URL final en Cloudinary (HTTPS), disponible tras subida exitosa. */
  cloudinaryUrl?: string
  /** Estado actual de la imagen en el proceso de subida. */
  status: 'pending' | 'uploading' | 'done' | 'error'
  /** Mensaje de error si status === 'error'. */
  errorMsg?: string
  /** Formato de visualización elegido por el usuario (aspect ratio). Default: '4:5' */
  format?: '4:5' | '1:1'
  /** Posición del punto focal (CSS object-position). Default: 'center center' */
  objectPosition?: string
  /** Factor de zoom visual (CSS transform scale). Default: 1 */
  scale?: number
}

/** Enlace configurado dentro del wizard (antes de enviarse al backend). */
export interface WizardLink {
  /** ID temporal en el cliente. */
  tempId: string
  label: string
  url: string
  type: PostLinkType
  display_type: PostLinkDisplayType
  /** Posición del botón: 0 = principal (grande), 1 = secundario, 2+ = lista desplegable. */
  position: number
}

/** Estructura completa del formulario del wizard de creación de posts. */
export interface WizardFormData {
  post_type: PostType | ''
  subtype: SubPostType | ''
  links: WizardLink[]
  images: WizardImage[]
  title: string
  description: string
  deadline_at: string  // ISO date string YYYY-MM-DD, vacío si no aplica
  tags: string[]
}

// ── Tipos de respuesta del backend (Feed) ─────────────────

/** Post tal como lo devuelve el endpoint /feed. */
export interface FeedPostOut {
  id: number
  user_id: number
  title?: string
  description: string
  post_type: PostType
  subtype?: SubPostType
  tags?: string[]
  deadline_at?: string
  time_status: TimeStatus
  created_at: string
  user_name?: string
  user_email?: string
  /** URL de la foto de perfil activa del autor del post. */
  user_profile_image_url?: string
  /** URL de la primera imagen del post (si existe). */
  image_url?: string
  images_count: number
  links_count: number
  is_pinned: boolean
  pin_priority: number
  is_saved: boolean
  participation_status?: string
  status?: string
}

/** Respuesta paginada del endpoint /feed. */
export interface FeedResponse {
  items: FeedPostOut[]
  page: number
  size: number
  total: number
  has_next: boolean
  has_prev: boolean
}

import {
  Globe,
  Calendar,
  GraduationCap,
  Megaphone,
  MessageSquare,
  Plane,
  Briefcase,
  Award,
  Presentation,
  Palette,
  Rocket,
  Code,
  Heart,
  Dumbbell,
  Building,
  Trophy,
  Medal,
  Microscope,
  FileText,
  AlertTriangle,
  Info,
  HelpCircle,
  MessagesSquare,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { PostAspectRatio } from '../shared/lib/aspectRatio'

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
  | 'congresos_talleres'
  | 'arte'
  | 'emprendimiento'
  | 'competencias'
  | 'hackathon' // legacy
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
  event: ['conferencia', 'congresos_talleres', 'arte', 'emprendimiento', 'competencias', 'voluntariado', 'deporte', 'visita_academica', 'empleo'],
  academic_project: ['competencia', 'proyecto_investigacion'],
  announcement: [],
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
  conferencia: 'Conferencias',
  congresos_talleres: 'Congresos y Talleres',
  arte: 'Arte',
  emprendimiento: 'Emprendimiento',
  competencias: 'Competencias',
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
  congresos_talleres: Award,
  arte: Palette,
  emprendimiento: Rocket,
  competencias: Medal,
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
  conferencia: 'Charlas, ponencias y exposiciones académicas',
  congresos_talleres: 'Eventos con actividades prácticas o certificadas',
  arte: 'Eventos culturales, exposiciones o presentaciones artísticas',
  emprendimiento: 'Talleres, Hackatons o competencias de emprendimiento',
  competencias: 'Concursos, retos o pruebas en diferentes campos',
  hackathon: 'Maratones de programación y desarrollo de soluciones',
  voluntariado: 'Actividades de servicio social o comunitario',
  deporte: 'Torneos, competencias o eventos deportivos',
  visita_academica: 'Visitas guiadas a instituciones o empresas',
  empleo: 'Ferias de empleo, reclutamiento o de inserción laboral',
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
  /** ID en Cloudinary, disponible tras subida exitosa. Vacío si sourceType === 'external_url'. */
  cloudinaryId?: string
  /** URL final en Cloudinary (HTTPS), disponible tras subida exitosa; o la URL externa pegada por el usuario. */
  cloudinaryUrl?: string
  /** Origen de la imagen: subida a Cloudinary (default) o link externo pegado por el usuario. */
  sourceType?: 'upload' | 'external_url'
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

/** Texto fijo del botón principal al crear/editar publicaciones. */
export const PRIMARY_LINK_BUTTON_LABEL = 'Participar'

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

/** Asegura posiciones consecutivas y label fijo en el botón principal. */
export function normalizeWizardLinks(links: WizardLink[]): WizardLink[] {
  return links.map((link, index) => ({
    ...link,
    position: index,
    label: index === 0 ? PRIMARY_LINK_BUTTON_LABEL : link.label,
  }))
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
  /** Formato (aspect ratio) único para todas las imágenes de la publicación. */
  aspect_ratio: PostAspectRatio
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
  /** URL pública de inscripción en Utopp Formulario (solo eventos vinculados). */
  registration_url?: string
  status?: string
  /** Número de reacciones (me gusta) de la publicación. */
  reaction_count?: number
  /** Indica si el usuario actual reaccionó a la publicación. */
  user_reacted?: boolean
  /** Número de comentarios de la publicación. */
  comment_count?: number
  /** Formato (aspect ratio) de las imágenes de la publicación. */
  aspect_ratio?: PostAspectRatio
  /** Score de relevancia (solo presente con sort=recommended; nunca para pineados). */
  relevance_score?: number
  /** Desglose del score por factor (feature × peso efectivo), solo con sort=recommended. */
  score_breakdown?: Record<string, number>
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

import {
  Briefcase,
  Dumbbell,
  GraduationCap,
  HeartHandshake,
  Palette,
  Presentation,
  Rocket,
  School,
  Trophy,
  type LucideIcon,
} from "lucide-react"

/**
 * Categorías de evento. Mismo catálogo que usa el wizard de Utopp Formulario
 * (`Frontend/src/lib/eventTypes.tsx`), para que un evento se vea igual en los
 * dos productos.
 */
export type EventTypeOption = {
  key: string
  label: string
  icon: LucideIcon
  /** clases tailwind para el acento (gradiente del ícono) */
  accent: string
}

export const EVENT_TYPES: EventTypeOption[] = [
  { key: "conferencias", label: "Conferencias", icon: Presentation, accent: "from-sky-500 to-blue-600" },
  { key: "congresos", label: "Congresos y Talleres", icon: GraduationCap, accent: "from-emerald-500 to-teal-600" },
  { key: "arte", label: "Arte", icon: Palette, accent: "from-fuchsia-500 to-pink-600" },
  { key: "emprendimiento", label: "Emprendimiento", icon: Rocket, accent: "from-orange-500 to-rose-600" },
  { key: "competencias", label: "Competencias", icon: Trophy, accent: "from-amber-500 to-yellow-600" },
  { key: "voluntariado", label: "Voluntariado", icon: HeartHandshake, accent: "from-teal-500 to-cyan-600" },
  { key: "deporte", label: "Deporte", icon: Dumbbell, accent: "from-rose-500 to-red-600" },
  { key: "visita-academica", label: "Visita Académica", icon: School, accent: "from-indigo-500 to-violet-600" },
  { key: "empleo", label: "Empleo", icon: Briefcase, accent: "from-violet-500 to-indigo-600" },
]

// Los eventos que vienen de posts históricos traen la categoría con el
// vocabulario de `subtype` (singular, con guion bajo), no con las claves del
// wizard. Este mapa reconcilia ambos.
const LEGACY_SUBTYPE_ALIASES: Record<string, string> = {
  conferencia: "conferencias",
  congresos_talleres: "congresos",
  competencia: "competencias",
  visita_academica: "visita-academica",
}

export function getEventType(key?: string | null): EventTypeOption | undefined {
  if (!key) return undefined
  const normalized = key.trim().toLowerCase()
  const alias = LEGACY_SUBTYPE_ALIASES[normalized] ?? normalized
  return EVENT_TYPES.find((t) => t.key === alias)
}

export function getEventTypeLabel(key?: string | null): string {
  return getEventType(key)?.label ?? "Evento"
}

import {
  GraduationCap,
  Laptop,
  Rocket,
  Globe,
  Trophy,
  Palette,
  Music,
  Dumbbell,
  Heart,
  Gamepad2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const INTERESTS: ReadonlyArray<{
  id: string
  label: string
  icon: LucideIcon
  gradient: string
}> = [
  { id: 'academic',       label: 'Académico',     icon: GraduationCap, gradient: 'from-blue-500 to-indigo-500' },
  { id: 'tech',           label: 'Tecnología',    icon: Laptop,        gradient: 'from-cyan-500 to-blue-500' },
  { id: 'entrepreneurship', label: 'Emprendimiento', icon: Rocket,     gradient: 'from-purple-500 to-violet-500' },
  { id: 'exchanges',      label: 'Intercambios',  icon: Globe,         gradient: 'from-teal-500 to-cyan-500' },
  { id: 'competitions',   label: 'Competencias',  icon: Trophy,        gradient: 'from-amber-500 to-orange-500' },
  { id: 'cultural',       label: 'Cultural',      icon: Palette,       gradient: 'from-orange-500 to-amber-500' },
  { id: 'music',          label: 'Música',        icon: Music,         gradient: 'from-violet-500 to-fuchsia-500' },
  { id: 'sports',         label: 'Deportes',      icon: Dumbbell,      gradient: 'from-green-500 to-emerald-500' },
  { id: 'volunteering',   label: 'Voluntariado',  icon: Heart,         gradient: 'from-emerald-500 to-teal-500' },
  { id: 'gaming',         label: 'Gaming',        icon: Gamepad2,      gradient: 'from-indigo-500 to-purple-500' },
] as const

export type InterestId = (typeof INTERESTS)[number]['id']

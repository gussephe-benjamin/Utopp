export const INTERESTS = [
  { id: 'academic', label: 'Académico', icon: '📚', gradient: 'from-blue-500 to-indigo-500' },
  { id: 'tech', label: 'Tecnología', icon: '💻', gradient: 'from-cyan-500 to-blue-500' },
  { id: 'entrepreneurship', label: 'Emprendimiento', icon: '🚀', gradient: 'from-purple-500 to-violet-500' },
  { id: 'exchanges', label: 'Intercambios', icon: '🌍', gradient: 'from-teal-500 to-cyan-500' },
  { id: 'competitions', label: 'Competencias', icon: '🏆', gradient: 'from-amber-500 to-orange-500' },
  { id: 'cultural', label: 'Cultural', icon: '🎭', gradient: 'from-orange-500 to-amber-500' },
  { id: 'music', label: 'Música', icon: '🎵', gradient: 'from-violet-500 to-fuchsia-500' },
  { id: 'sports', label: 'Deportes', icon: '⚽', gradient: 'from-green-500 to-emerald-500' },
  { id: 'volunteering', label: 'Voluntariado', icon: '🤝', gradient: 'from-emerald-500 to-teal-500' },
  { id: 'gaming', label: 'Gaming', icon: '🎮', gradient: 'from-indigo-500 to-purple-500' },
] as const

export type InterestId = (typeof INTERESTS)[number]['id']

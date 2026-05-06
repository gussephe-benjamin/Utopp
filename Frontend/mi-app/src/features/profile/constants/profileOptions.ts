export const AVAILABILITY_OPTIONS = [
  { id: 0, label: 'Poco tiempo', emoji: '☕', description: '1-3 hrs/semana' },
  { id: 1, label: 'Moderado', emoji: '⚖️', description: '4-6 hrs/semana' },
  { id: 2, label: 'Disponible', emoji: '⚡', description: '7-10 hrs/semana' },
  { id: 3, label: 'Muy flexible', emoji: '🚀', description: '11-15 hrs/semana' },
  { id: 4, label: 'Máxima disponibilidad', emoji: '🌟', description: '15+ hrs/semana' },
] as const

export const CAREER_FACULTIES = [
  {
    label: 'Facultad de Negocios',
    careers: [
      { id: 'admin_digital', label: 'Administración y Negocios Digitales', icon: '📱' },
      { id: 'business_analytics', label: 'Business Analytics', icon: '📊' },
    ],
  },
  {
    label: 'Facultad de Computación',
    careers: [
      { id: 'ciberseguridad', label: 'Ciberseguridad', icon: '🔒' },
      { id: 'ciencia_datos_ia', label: 'Ciencia de Datos e Inteligencia Artificial', icon: '🤖' },
      { id: 'ciencia_computacion', label: 'Ciencia de la Computación', icon: '💻' },
      { id: 'sistemas_info', label: 'Sistemas de Información', icon: '🗂️' },
    ],
  },
  {
    label: 'Facultad de Ingeniería',
    careers: [
      { id: 'bioingenieria', label: 'Bioingeniería', icon: '🧬' },
      { id: 'ambiental', label: 'Ingeniería Ambiental', icon: '🌱' },
      { id: 'civil', label: 'Ingeniería Civil', icon: '🏗️' },
      { id: 'energia', label: 'Ingeniería de la Energía', icon: '⚡' },
      { id: 'electronica', label: 'Ingeniería Electrónica', icon: '🔌' },
      { id: 'industrial', label: 'Ingeniería Industrial', icon: '🏭' },
      { id: 'mecatronica', label: 'Ingeniería Mecatrónica', icon: '🤖' },
      { id: 'mecanica', label: 'Ingeniería Mecánica', icon: '⚙️' },
      { id: 'quimica', label: 'Ingeniería Química', icon: '⚗️' },
    ],
  },
]

export const CAREER_OPTIONS = CAREER_FACULTIES.flatMap(f => f.careers)

export const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  published: { label: 'Publicado', color: 'bg-green-100 text-green-700' },
  draft: { label: 'Borrador', color: 'bg-yellow-100 text-yellow-700' },
  archived: { label: 'Archivado', color: 'bg-gray-100 text-gray-500' },
}

import { useState } from 'react'

interface Step2SubtypeSelectionProps {
  publicationType: string
  onSelectSubtype: (subtype: string) => void
  selectedSubtype?: string
}

const SUBTYPE_LABELS: Record<string, Record<string, string>> = {
  'oportunidad_internacional': {
    'intercambio': 'Intercambio',
    'pasantia': 'Pasantía',
    'investigacion': 'Investigación',
    '4+1': '4+1'
  },
  'evento': {
    'conferencia': 'Conferencia',
    'arte': 'Arte',
    'emprendimiento': 'Emprendimiento',
    'voluntariado': 'Voluntariado',
    'deporte': 'Deporte',
    'visita_academica': 'Visita Académica',
    'empleo': 'Empleo'
  },
  'proyecto_academico': {
    'competencia': 'Competencia',
    'investigacion': 'Investigación'
  },
  'anuncio': {
    'comunicado': 'Comunicado',
    'urgente': 'Urgente'
  },
  'publicacion_simple': {
    'informativo': 'Informativo',
    'pregunta': 'Pregunta',
    'debate': 'Debate'
  }
}

const SUBTYPE_DESCRIPTIONS: Record<string, Record<string, string>> = {
  'oportunidad_internacional': {
    'intercambio': 'Programas de intercambio estudiantil en universidades extranjeras',
    'pasantia': 'Oportunidades de prácticas profesionales en el extranjero',
    'investigacion': 'Proyectos de investigación colaborativa internacional',
    '4+1': 'Programas de doble titulación con universidades asociadas'
  },
  'evento': {
    'conferencia': 'Charlas, ponencias y congresos académicos',
    'arte': 'Eventos culturales, exposiciones y presentaciones artísticas',
    'emprendimiento': 'Talleres, hackathons y competencias de emprendimiento',
    'voluntariado': 'Actividades de servicio social y comunitario',
    'deporte': 'Torneos, competencias y eventos deportivos',
    'visita_academica': 'Visitas guiadas a instituciones y empresas',
    'empleo': 'Ferias de empleo y sesiones de reclutamiento'
  },
  'proyecto_academico': {
    'competencia': 'Concursos académicos y competencias interuniversitarias',
    'investigacion': 'Proyectos de investigación y desarrollo científico'
  },
  'anuncio': {
    'comunicado': 'Información general y comunicados institucionales',
    'urgente': 'Anuncios de alta prioridad y emergencias'
  },
  'publicacion_simple': {
    'informativo': 'Compartir información útil con la comunidad',
    'pregunta': 'Plantear dudas y solicitar ayuda a la comunidad',
    'debate': 'Iniciar discusiones sobre temas de interés'
  }
}

export default function Step2SubtypeSelection({ 
  publicationType, 
  onSelectSubtype, 
  selectedSubtype 
}: Step2SubtypeSelectionProps) {
  const [hoveredSubtype, setHoveredSubtype] = useState<string | null>(null)

  const subtypes = Object.keys(SUBTYPE_LABELS[publicationType] || {})
  const labels = SUBTYPE_LABELS[publicationType] || {}
  const descriptions = SUBTYPE_DESCRIPTIONS[publicationType] || {}

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      'oportunidad_internacional': '🌍',
      'evento': '📅',
      'proyecto_academico': '🔬',
      'anuncio': '📢',
      'publicacion_simple': '💬'
    }
    return icons[type] || '📄'
  }

  const getSubtypeIcon = (subtype: string) => {
    const icons: Record<string, string> = {
      // Oportunidades Internacionales
      'intercambio': '✈️',
      'pasantia': '💼',
      'investigacion': '🔬',
      '4+1': '🎓',
      
      // Eventos
      'conferencia': '🎤',
      'arte': '🎨',
      'emprendimiento': '🚀',
      'voluntariado': '🤝',
      'deporte': '⚽',
      'visita_academica': '🏢',
      'empleo': '💼',
      
      // Proyectos Académicos
      'competencia': '🏆',
      'proyecto_investigacion': '🔍',
      
      // Anuncios
      'comunicado': '📋',
      'urgente': '⚠️',
      
      // Publicaciones Simples
      'informativo': 'ℹ️',
      'pregunta': '❓',
      'debate': '💭'
    }
    return icons[subtype] || '📄'
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center mb-6">
        <div className="text-3xl mr-3">{getTypeIcon(publicationType)}</div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            Selecciona el subtipo de {publicationType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </h3>
          <p className="text-gray-600 text-sm">
            Elige la categoría específica que mejor describa tu publicación
          </p>
        </div>
      </div>

      {/* Grid de subtipos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subtypes.map((subtype) => (
          <button
            key={subtype}
            onClick={() => onSelectSubtype(subtype)}
            onMouseEnter={() => setHoveredSubtype(subtype)}
            onMouseLeave={() => setHoveredSubtype(null)}
            className={`p-5 border-2 rounded-xl transition-all duration-200 text-left group relative overflow-hidden ${
              selectedSubtype === subtype
                ? 'border-purple-600 bg-purple-50 shadow-lg'
                : 'border-gray-200 hover:border-purple-400 hover:bg-purple-50 hover:shadow-md'
            }`}
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full -mr-8 -mt-8 opacity-50 group-hover:opacity-75 transition-opacity" />
            
            {/* Icon and title */}
            <div className="flex items-center mb-3 relative z-10">
              <div className="text-2xl mr-3 group-hover:scale-110 transition-transform duration-200">
                {getSubtypeIcon(subtype)}
              </div>
              <h4 className="font-semibold text-gray-900">
                {labels[subtype] || subtype}
              </h4>
            </div>
            
            {/* Description */}
            <p className="text-sm text-gray-600 leading-relaxed relative z-10">
              {descriptions[subtype] || `Subtipo ${subtype}`}
            </p>

            {/* Hover indicator */}
            {hoveredSubtype === subtype && (
              <div className="absolute bottom-2 right-2 text-purple-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

    
    </div>
  )
}

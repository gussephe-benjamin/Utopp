import { useState } from 'react'

interface PublicationType {
  type: string
  subtypes: string[]
  description: string
  icon: string
}

interface Step1TypeSelectionProps {
  onSelectType: (type: string, subtype: string) => void
  selectedType?: string
}

const PUBLICATION_TYPES: PublicationType[] = [
  {
    type: 'oportunidad_internacional',
    subtypes: ['intercambio', 'pasantia', 'investigacion', '4+1'],
    description: 'Oportunidades de estudio y trabajo en el extranjero',
    icon: '🌍'
  },
  {
    type: 'evento',
    subtypes: ['conferencia', 'arte', 'emprendimiento', 'voluntariado', 'deporte', 'visita_academica', 'empleo'],
    description: 'Eventos académicos y sociales',
    icon: '📅'
  },
  {
    type: 'proyecto_academico',
    subtypes: ['competencia', 'investigacion'],
    description: 'Proyectos de investigación y competencias académicas',
    icon: '🔬'
  },
  {
    type: 'anuncio',
    subtypes: ['comunicado', 'urgente'],
    description: 'Anuncios y comunicados institucionales',
    icon: '📢'
  },
  {
    type: 'publicacion_simple',
    subtypes: ['informativo', 'pregunta', 'debate'],
    description: 'Publicaciones generales de la comunidad',
    icon: '💬'
  }
]

export default function Step1TypeSelection({ onSelectType, selectedType }: Step1TypeSelectionProps) {
  const [hoveredType, setHoveredType] = useState<string | null>(null)

  const handleTypeClick = (type: string) => {
    // Para tipos que no son oportunidad internacional, seleccionar el primer subtipo automáticamente
    const publicationType = PUBLICATION_TYPES.find(t => t.type === type)
    if (publicationType && type !== 'oportunidad_internacional') {
      onSelectType(type, publicationType.subtypes[0])
    } else {
      // Para oportunidad internacional, solo seleccionar el tipo (el subtipo se seleccionará en el paso 2)
      onSelectType(type, '')
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PUBLICATION_TYPES.map((pubType) => (
          <button
            key={pubType.type}
            onClick={() => handleTypeClick(pubType.type)}
            onMouseEnter={() => setHoveredType(pubType.type)}
            onMouseLeave={() => setHoveredType(null)}
            className={`p-6 border-2 rounded-xl transition-all duration-200 text-left group relative overflow-hidden ${
              selectedType === pubType.type
                ? 'border-purple-600 bg-purple-50 shadow-lg'
                : 'border-gray-200 hover:border-purple-400 hover:bg-purple-50 hover:shadow-md'
            }`}
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full -mr-10 -mt-10 opacity-50 group-hover:opacity-75 transition-opacity" />
            
            {/* Icon */}
            <div className="text-4xl mb-3 relative z-10 group-hover:scale-110 transition-transform duration-200">
              {pubType.icon}
            </div>
            
            {/* Title */}
            <h4 className="font-semibold text-gray-900 mb-2 relative z-10">
              {pubType.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h4>
            
            {/* Description */}
            <p className="text-sm text-gray-600 leading-relaxed relative z-10">
              {pubType.description}
            </p>

            {/* Hover indicator */}
            {hoveredType === pubType.type && (
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

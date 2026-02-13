import { useState } from 'react'

interface PublicationType {
  type: string
  subtypes: string[]
  description: string
  icon: string
}

interface PublicationTypeModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectType: (type: string, subtype: string) => void
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

const SUBTYPE_LABELS: { [key: string]: string } = {
  // Oportunidades Internacionales
  'intercambio': 'Intercambio',
  'pasantia': 'Pasantía',
  'investigacion': 'Investigación',
  '4+1': '4+1',
  
  // Eventos
  'conferencia': 'Conferencia',
  'arte': 'Arte',
  'emprendimiento': 'Emprendimiento',
  'voluntariado': 'Voluntariado',
  'deporte': 'Deporte',
  'visita_academica': 'Visita Académica',
  'empleo': 'Empleo',
  
  // Proyectos Académicos
  'competencia': 'Competencia',
  'proyecto_investigacion': 'Investigación',
  
  // Anuncios
  'comunicado': 'Comunicado',
  'urgente': 'Urgente',
  
  // Publicaciones Simples
  'informativo': 'Informativo',
  'pregunta': 'Pregunta',
  'debate': 'Debate'
}

export default function PublicationTypeModal({ isOpen, onClose, onSelectType }: PublicationTypeModalProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedSubtype, setSelectedSubtype] = useState<string | null>(null)

  const handleTypeSelect = (type: string) => {
    setSelectedType(type)
    setSelectedSubtype(null)
  }

  const handleSubtypeSelect = (subtype: string) => {
    if (selectedType) {
      setSelectedSubtype(subtype)
    }
  }

  const handleConfirm = () => {
    if (selectedType && selectedSubtype) {
      onSelectType(selectedType, selectedSubtype)
      onClose()
      setSelectedType(null)
      setSelectedSubtype(null)
    }
  }

  const handleClose = () => {
    onClose()
    setSelectedType(null)
    setSelectedSubtype(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Crear Publicación</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!selectedType ? (
            // Selección de Tipo Principal
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Selecciona el tipo de publicación</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PUBLICATION_TYPES.map((pubType) => (
                  <button
                    key={pubType.type}
                    onClick={() => handleTypeSelect(pubType.type)}
                    className="p-6 border-2 border-gray-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 text-left group"
                  >
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-200">
                      {pubType.icon}
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {pubType.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {pubType.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Selección de Subtipo
            <div>
              <button
                onClick={() => setSelectedType(null)}
                className="mb-6 flex items-center text-purple-600 hover:text-purple-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver a tipos
              </button>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-6">
                Selecciona el subtipo de {
                  PUBLICATION_TYPES.find(t => t.type === selectedType)?.icon
                } {
                  selectedType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                }
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {PUBLICATION_TYPES
                  .find(t => t.type === selectedType)
                  ?.subtypes.map((subtype) => (
                    <button
                      key={subtype}
                      onClick={() => handleSubtypeSelect(subtype)}
                      className={`p-4 border-2 rounded-xl transition-all duration-200 ${
                        selectedSubtype === subtype
                          ? 'border-purple-600 bg-purple-100 text-purple-900'
                          : 'border-gray-200 hover:border-purple-400 hover:bg-purple-50'
                      }`}
                    >
                      <div className="font-medium text-gray-900">
                        {SUBTYPE_LABELS[subtype] || subtype}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            {selectedType && selectedSubtype && (
              <button
                onClick={handleConfirm}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Continuar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import {
  type PostType,
  type SubPostType,
  VALID_SUBTYPES,
  POST_TYPE_LABELS,
  POST_TYPE_ICONS,
  SUBTYPE_LABELS,
  SUBTYPE_ICONS,
  SUBTYPE_DESCRIPTIONS,
} from '../types/post.types'

interface Step2SubtypeSelectionProps {
  /** Tipo de publicación elegido en el Paso 1. */
  publicationType: PostType
  /** Subtipo actualmente seleccionado. */
  selectedSubtype: SubPostType | ''
  /** Callback que se dispara cuando el usuario elige un subtipo. */
  onSelectSubtype: (subtype: SubPostType) => void
}

export default function Step2SubtypeSelection({
  publicationType,
  onSelectSubtype,
  selectedSubtype,
}: Step2SubtypeSelectionProps) {
  const [hoveredSubtype, setHoveredSubtype] = useState<SubPostType | null>(null)

  // Obtener los subtipos válidos para el tipo de publicación seleccionado
  const subtypes = VALID_SUBTYPES[publicationType] ?? []

  return (
    <div>
      {/* Encabezado con ícono y nombre del tipo elegido */}
      <div className="flex items-center mb-6">
        <div className="text-purple-600 mr-3">
          {(() => {
            const IconComponent = POST_TYPE_ICONS[publicationType]
            return <IconComponent className="w-8 h-8 stroke-[1.8]" />
          })()}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            Selecciona el subtipo de {POST_TYPE_LABELS[publicationType]}
          </h3>
          <p className="text-gray-600 text-sm">
            Elige la categoría específica que mejor describa tu publicación
          </p>
        </div>
      </div>

      {/* Grid de tarjetas de subtipo */}
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
            {/* Decoración de fondo */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full -mr-8 -mt-8 opacity-50 group-hover:opacity-75 transition-opacity" />

            {/* Ícono y nombre del subtipo */}
            <div className="flex items-center mb-3 relative z-10">
              <div className="text-purple-600 mr-3 group-hover:scale-110 transition-transform duration-200">
                {(() => {
                  const SubtypeIcon = SUBTYPE_ICONS[subtype]
                  return <SubtypeIcon className="w-6 h-6 stroke-[1.8]" />
                })()}
              </div>
              <h4 className="font-semibold text-gray-900">
                {SUBTYPE_LABELS[subtype]}
              </h4>
            </div>

            {/* Descripción del subtipo */}
            <p className="text-sm text-gray-600 leading-relaxed relative z-10">
              {SUBTYPE_DESCRIPTIONS[subtype]}
            </p>

            {/* Flecha indicadora al hacer hover */}
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

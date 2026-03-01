import { useState } from 'react'
import {
  type PostType,
  POST_TYPE_LABELS,
  POST_TYPE_ICONS,
  POST_TYPE_DESCRIPTIONS,
} from '../types/post.types'

// Lista ordenada de tipos de publicación disponibles
const ALL_POST_TYPES: PostType[] = [
  'international_opportunity',
  'event',
  'academic_project',
  'announcement',
  'simple_post',
]

interface Step1TypeSelectionProps {
  /** Tipo actualmente seleccionado (puede estar vacío si aún no eligieron). */
  selectedType: PostType | ''
  /** Callback que recibe el tipo elegido. El subtipo se elige en el Paso 2. */
  onSelectType: (type: PostType) => void
}

export default function Step1TypeSelection({ onSelectType, selectedType }: Step1TypeSelectionProps) {
  const [hoveredType, setHoveredType] = useState<PostType | null>(null)

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL_POST_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => onSelectType(type)}
            onMouseEnter={() => setHoveredType(type)}
            onMouseLeave={() => setHoveredType(null)}
            className={`p-6 border-2 rounded-xl transition-all duration-200 text-left group relative overflow-hidden ${
              selectedType === type
                ? 'border-purple-600 bg-purple-50 shadow-lg'
                : 'border-gray-200 hover:border-purple-400 hover:bg-purple-50 hover:shadow-md'
            }`}
          >
            {/* Decoración de fondo */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full -mr-10 -mt-10 opacity-50 group-hover:opacity-75 transition-opacity" />

            {/* Ícono del tipo */}
            <div className="text-4xl mb-3 relative z-10 group-hover:scale-110 transition-transform duration-200">
              {POST_TYPE_ICONS[type]}
            </div>

            {/* Nombre del tipo */}
            <h4 className="font-semibold text-gray-900 mb-2 relative z-10">
              {POST_TYPE_LABELS[type]}
            </h4>

            {/* Descripción */}
            <p className="text-sm text-gray-600 leading-relaxed relative z-10">
              {POST_TYPE_DESCRIPTIONS[type]}
            </p>

            {/* Indicador de selección al hacer hover */}
            {hoveredType === type && (
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

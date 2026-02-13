import { useState } from 'react'

interface IntercambioFormProps {
  data: {
    duration?: string
    country?: string
    requirements?: string[]
  }
  onChange: (data: { duration: string; country: string; requirements: string[] }) => void
}

const DURATION_OPTIONS = [
  { value: '1_semestre', label: '1 semestre', months: 6 },
  { value: '2_semestres', label: '2 semestres', months: 12 },
  { value: '1_año', label: '1 año', months: 12 },
  { value: '2_años', label: '2 años', months: 24 }
]

const COMMON_COUNTRIES = [
  'Estados Unidos', 'Canadá', 'Reino Unido', 'Alemania', 'Francia',
  'España', 'Japón', 'Corea del Sur', 'Australia', 'Nueva Zelanda',
  'Países Bajos', 'Suecia', 'Suiza', 'Italia', 'Bélgica'
]

const COMMON_REQUIREMENTS = [
  'Promedio académico mínimo',
  'Certificado de idioma',
  'Carta de recomendación',
  'Ensayo personal',
  'Experiencia previa',
  'Entrevista',
  'Portafolio',
  'Propuesta de investigación'
]

export default function IntercambioForm({ data, onChange }: IntercambioFormProps) {
  const [newRequirement, setNewRequirement] = useState('')

  const handleDurationChange = (duration: string) => {
    onChange({ 
      duration, 
      country: data.country || '', 
      requirements: data.requirements || [] 
    })
  }

  const handleCountryChange = (country: string) => {
    onChange({ 
      duration: data.duration || '',
      country, 
      requirements: data.requirements || [] 
    })
  }

  const addRequirement = (requirement: string) => {
    const cleanRequirement = requirement.trim()
    const currentRequirements = data.requirements || []
    if (cleanRequirement && !currentRequirements.includes(cleanRequirement)) {
      onChange({
        duration: data.duration || '',
        country: data.country || '',
        requirements: [...currentRequirements, cleanRequirement]
      })
      setNewRequirement('')
    }
  }

  const removeRequirement = (requirementToRemove: string) => {
    const currentRequirements = data.requirements || []
    onChange({
      duration: data.duration || '',
      country: data.country || '',
      requirements: currentRequirements.filter(req => req !== requirementToRemove)
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addRequirement(newRequirement)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
        <div className="flex items-start">
          <span className="text-2xl mr-3">✈️</span>
          <div className="text-sm text-purple-800">
            <p className="font-medium mb-1">Intercambio Estudiantil</p>
            <p className="text-purple-700">
              Proporciona los detalles específicos para programas de intercambio académico internacional.
            </p>
          </div>
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Duración del intercambio *
        </label>
        <select
          value={data.duration || ''}
          onChange={(e) => handleDurationChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="">Selecciona la duración</option>
          {DURATION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} ({option.months} meses)
            </option>
          ))}
        </select>
      </div>

      {/* Country */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          País de destino *
        </label>
        <div className="space-y-2">
          <select
            value={data.country || ''}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Selecciona un país</option>
            {COMMON_COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
          
          {/* Custom country input */}
          <input
            type="text"
            placeholder="O escribe otro país..."
            onChange={(e) => handleCountryChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Requirements */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Requisitos del programa *
        </label>
        <div className="space-y-3">
          {/* Current Requirements */}
          {data.requirements && data.requirements.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.requirements.map((requirement, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                >
                  {requirement}
                  <button
                    onClick={() => removeRequirement(requirement)}
                    className="ml-1 text-purple-600 hover:text-purple-800 transition-colors"
                    title="Eliminar requisito"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Add Requirement */}
          <div className="space-y-2">
            <input
              type="text"
              value={newRequirement}
              onChange={(e) => setNewRequirement(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Agregar requisito (presiona Enter)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />

            {/* Common Requirements */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Requisitos comunes:</p>
              <div className="flex flex-wrap gap-2">
                {COMMON_REQUIREMENTS.map((requirement) => (
                  <button
                    key={requirement}
                    onClick={() => addRequirement(requirement)}
                    disabled={data.requirements?.includes(requirement)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      data.requirements?.includes(requirement)
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-800'
                    }`}
                  >
                    + {requirement}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Consejos
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Sé específico sobre los requisitos académicos</li>
            <li>• Incluye información sobre costos si es relevante</li>
            <li>• Menciona fechas límite importantes</li>
          </ul>
        </div>

        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="font-medium text-green-900 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Buenas prácticas
          </h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Verifica la información con fuentes oficiales</li>
            <li>• Proporciona enlaces a programas oficiales</li>
            <li>• Incluye contacto si es posible</li>
          </ul>
        </div>
      </div>

      {/* Validation Summary */}
      <div className={`p-4 rounded-lg border ${
        data.duration && data.country && data.requirements && data.requirements.length > 0
          ? 'bg-green-50 border-green-200'
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-start">
          <svg className={`w-5 h-5 mt-0.5 mr-3 flex-shrink-0 ${
            data.duration && data.country && data.requirements && data.requirements.length > 0
              ? 'text-green-600'
              : 'text-yellow-600'
          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {data.duration && data.country && data.requirements && data.requirements.length > 0 ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            )}
          </svg>
          <div className="text-sm">
            <p className={`font-medium mb-1 ${
              data.duration && data.country && data.requirements && data.requirements.length > 0
                ? 'text-green-800'
                : 'text-yellow-800'
            }`}>
              {data.duration && data.country && data.requirements && data.requirements.length > 0
                ? 'Información completa'
                : 'Información incompleta'
              }
            </p>
            <p className={data.duration && data.country && data.requirements && data.requirements.length > 0 ? 'text-green-700' : 'text-yellow-700'}>
              {!data.duration && '• La duración es requerida\n'}
              {!data.country && '• El país es requerido\n'}
              {(!data.requirements || data.requirements.length === 0) && '• Al menos un requisito es necesario\n'}
              {data.duration && data.country && data.requirements && data.requirements.length > 0 && '• Todo listo para continuar'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

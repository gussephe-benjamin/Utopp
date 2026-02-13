import { useState } from 'react'
import IntercambioForm from './IntercambioForm'

interface Step5PreviewProps {
  publicationType: string
  subtype: string
  title: string
  content: string
  tags: string[]
  links: Array<{ title: string; url: string; type: string }>
  specificFields: Record<string, unknown>
  onChange: (data: { specific_fields: Record<string, unknown> }) => void
}

export default function Step5Preview({ 
  publicationType, 
  subtype, 
  title, 
  content, 
  tags, 
  links, 
  specificFields, 
  onChange 
}: Step5PreviewProps) {
  const [showPreview, setShowPreview] = useState(false)

  const renderSpecificForm = () => {
    switch (publicationType) {
      case 'oportunidad_internacional':
        switch (subtype) {
          case 'intercambio':
            return (
              <IntercambioForm
                data={specificFields as {
                  duration?: string
                  country?: string
                  requirements?: string[]
                }}
                onChange={(data) => onChange({ specific_fields: data })}
              />
            )
          case 'pasantia':
            return (
              <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">🚧 En Desarrollo</h3>
                <p className="text-yellow-800">
                  El formulario para Pasantías está siendo desarrollado. 
                  Por ahora, esta publicación usará el formulario genérico.
                </p>
              </div>
            )
          case 'investigacion':
            return (
              <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">🚧 En Desarrollo</h3>
                <p className="text-yellow-800">
                  El formulario para Investigación está siendo desarrollado. 
                  Por ahora, esta publicación usará el formulario genérico.
                </p>
              </div>
            )
          case '4+1':
            return (
              <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">🚧 En Desarrollo</h3>
                <p className="text-yellow-800">
                  El formulario para 4+1 está siendo desarrollado. 
                  Por ahora, esta publicación usará el formulario genérico.
                </p>
              </div>
            )
          default:
            return null
        }
      default:
        return (
          <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Formulario Genérico</h3>
            <p className="text-gray-800">
              Este tipo de publicación utiliza el formulario estándar sin campos específicos.
            </p>
          </div>
        )
    }
  }

  const getPublicationIcon = (type: string) => {
    const icons: Record<string, string> = {
      'oportunidad_internacional': '🌍',
      'evento': '📅',
      'proyecto_academico': '🔬',
      'anuncio': '📢',
      'publicacion_simple': '💬'
    }
    return icons[type] || '📄'
  }

  const getSubtypeLabel = (type: string, subtype: string) => {
    const labels: Record<string, Record<string, string>> = {
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
    return labels[type]?.[subtype] || subtype
  }

  return (
    <div className="space-y-6">
      {/* Toggle Button */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button
            onClick={() => setShowPreview(false)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              !showPreview
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Formulario Específico
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              showPreview
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Vista Previa
          </button>
        </div>
      </div>

      {/* Content */}
      {!showPreview ? (
        <div>
          <h3 className="text-xl font-semibold mb-4">Información Específica</h3>
          {renderSpecificForm()}
        </div>
      ) : (
        <div>
          <h3 className="text-xl font-semibold mb-4">Vista Previa de la Publicación</h3>
          
          {/* Preview Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{getPublicationIcon(publicationType)}</div>
                <div>
                  <h4 className="text-xl font-bold">{title}</h4>
                  <p className="text-purple-100 text-sm">
                    {getPublicationIcon(publicationType)} {getSubtypeLabel(publicationType, subtype)}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Description */}
              <div>
                <h5 className="font-semibold text-gray-900 mb-2">Descripción</h5>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {content}
                </p>
              </div>

              {/* Specific Fields */}
              {Object.keys(specificFields).length > 0 && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Información Adicional</h5>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {Object.entries(specificFields).map(([key, value]) => (
                      <div key={key} className="mb-2 last:mb-0">
                        <span className="font-medium text-gray-700 capitalize">
                          {key.replace('_', ' ')}:
                        </span>
                        <span className="ml-2 text-gray-600">
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Links */}
              {links.length > 0 && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Enlaces</h5>
                  <div className="space-y-2">
                    {links.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-blue-700"
                      >
                        <span className="text-lg">
                          {link.type === 'formulario' ? '📝' :
                           link.type === 'documento' ? '📄' :
                           link.type === 'video' ? '🎥' :
                           link.type === 'redes' ? '📱' :
                           link.type === 'sitio_web' ? '🌐' : '🔗'}
                        </span>
                        <div className="flex-1">
                          <div className="font-medium">{link.title}</div>
                          <div className="text-sm text-blue-600 truncate">{link.url}</div>
                        </div>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {tags.length > 0 && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Etiquetas</h5>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Publicación lista para revisar</span>
                <span className="text-green-600 font-medium">
                  ✓ Campos completados
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

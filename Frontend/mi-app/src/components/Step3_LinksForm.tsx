import { useState } from 'react'

interface CTAItem {
  id: string
  label: string
  url: string
}

interface Step3CTAFormProps {
  ctas: CTAItem[]
  onChange: (ctas: CTAItem[]) => void
}

export default function Step3CTAForm({ ctas = [], onChange }: Step3CTAFormProps) {
  // Asegurar que ctas siempre sea un array
  const safeCtas = Array.isArray(ctas) ? ctas : []
  
  const [newCTA, setNewCTA] = useState<CTAItem>({
    id: '',
    label: '',
    url: ''
  })

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const addCTA = () => {
    if (
      newCTA.label.trim() &&
      newCTA.url.trim() &&
      isValidUrl(newCTA.url) &&
      safeCtas.length < 2
    ) {
      onChange([
        ...safeCtas,
        { ...newCTA, id: crypto.randomUUID() }
      ])
      setNewCTA({ id: '', label: '', url: '' })
    }
  }

  const removeCTA = (id: string) => {
    // No permitir eliminar si solo queda un botón
    if (safeCtas.length <= 1) return
    onChange(safeCtas.filter(cta => cta.id !== id))
  }

  const updateCTA = (id: string, field: 'label' | 'url', value: string) => {
    onChange(
      safeCtas.map(cta =>
        cta.id === id ? { ...cta, [field]: value } : cta
      )
    )
  }

  return (
    <div>

      {/* Existing CTAs */}
      {safeCtas.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">
            Botones configurados
          </h4>

          <div className="space-y-4">
            {safeCtas.map((cta) => (
              <div
                key={cta.id}
                className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={cta.label}
                    onChange={(e) =>
                      updateCTA(cta.id, 'label', e.target.value)
                    }
                    placeholder="Texto del botón (Ej: Aplica ahora)"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 ${
                      cta.label.trim() !== '' ? 'border-green-300 bg-green-50' : 'border-gray-300'
                    }`}
                  />

                  <input
                    type="url"
                    value={cta.url}
                    onChange={(e) =>
                      updateCTA(cta.id, 'url', e.target.value)
                    }
                    placeholder="https://ejemplo.com"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 ${
                      cta.url.trim() !== '' && isValidUrl(cta.url) ? 'border-green-300 bg-green-50' : 'border-gray-300'
                    }`}
                  />
                </div>

                <button
                  onClick={() => removeCTA(cta.id)}
                  disabled={safeCtas.length <= 1}
                  className={`p-2 rounded-lg transition-colors ${
                    safeCtas.length <= 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                  title={safeCtas.length <= 1 ? 'Debe mantener al menos un botón' : 'Eliminar botón'}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 
                         21H7.862a2 2 0 01-1.995-1.858L5 
                         7m5 4v6m4-6v6m1-10V4a1 1 
                         0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add CTA */}
      {safeCtas.length < 2 && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">
            Agregar botón de acción
          </h4>

          <div className="space-y-4">
            <input
              type="text"
              value={newCTA.label}
              onChange={(e) =>
                setNewCTA({ ...newCTA, label: e.target.value })
              }
              placeholder="Texto del botón"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
            />

            <input
              type="url"
              value={newCTA.url}
              onChange={(e) =>
                setNewCTA({ ...newCTA, url: e.target.value })
              }
              placeholder="https://ejemplo.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
            />

            {newCTA.url && !isValidUrl(newCTA.url) && (
              <p className="text-sm text-red-600">
                Ingresa una URL válida (https://...)
              </p>
            )}

            <button
              onClick={addCTA}
              disabled={
                !newCTA.label.trim() ||
                !newCTA.url.trim() ||
                !isValidUrl(newCTA.url)
              }
              className="w-full px-4 py-3 bg-gradient-to-r 
                         from-purple-600 to-blue-600 
                         text-white rounded-lg 
                         hover:from-purple-700 
                         hover:to-blue-700 
                         transition-all 
                         disabled:opacity-50 
                         disabled:cursor-not-allowed"
            >
              Agregar Botón
            </button>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 text-sm text-gray-500">
        Configura los botones de acción para tu publicación. Los bordes <span className="text-green-600 font-medium">verdes</span> indican que el campo es válido, los <span className="text-gray-400">grises</span> necesitan completarse. Debes agregar enlaces válidos para continuar.
      </div>

      {/* Validación */}
      {safeCtas.length > 0 && !safeCtas.every(cta => cta.url.trim() !== '' && isValidUrl(cta.url)) && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-amber-800 text-sm font-medium">
              Todos los enlaces deben ser válidos para continuar
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

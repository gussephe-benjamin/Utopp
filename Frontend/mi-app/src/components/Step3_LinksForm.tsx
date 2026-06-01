import { useState } from 'react'
import { Star } from 'lucide-react'
import {
  type WizardLink,
  type PostLinkType,
  LINK_TYPE_OPTIONS,
  PRIMARY_LINK_BUTTON_LABEL,
  normalizeWizardLinks,
} from '../types/post.types'

// Máximo de links permitidos por post:
// primeros 3 visibles como botones, el resto en popup de enlaces adicionales.
const MAX_LINKS = 5

function normalizeLinks(links: WizardLink[]): WizardLink[] {
  return normalizeWizardLinks(links)
}

interface Step3LinksFormProps {
  /** Lista de links actualmente configurados en el wizard. */
  links: WizardLink[]
  /** Callback que se llama con la lista actualizada de links. */
  onChange: (links: WizardLink[]) => void
}

/** Estado vacío para el formulario de nuevo link */
const emptyNewLink = () => ({
  label: '',
  url: '',
  type: 'action' as PostLinkType,
  display_type: 'button' as const,
})

/** Valida que la URL tenga formato correcto */
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export default function Step3LinksForm({ links, onChange }: Step3LinksFormProps) {
  // Estado local del formulario para agregar un nuevo link
  const [newLink, setNewLink] = useState(emptyNewLink)

  /** Añade un nuevo link a la lista y resetea el formulario */
  const addLink = () => {
    const isPrimary = links.length === 0
    const label = isPrimary ? PRIMARY_LINK_BUTTON_LABEL : newLink.label.trim()
    if (!label || !newLink.url.trim() || !isValidUrl(newLink.url)) return
    if (links.length >= MAX_LINKS) return

    // La posición equivale al índice en la lista:
    // 0 = principal, 1 = secundario, 2 = terciario, 3+ = popup de extras.
    const newWizardLink: WizardLink = {
      tempId: crypto.randomUUID(),
      label,
      url: newLink.url.trim(),
      type: newLink.type,
      display_type: newLink.display_type,
      position: links.length,
    }
    onChange(normalizeLinks([...links, newWizardLink]))
    setNewLink(emptyNewLink())
  }

  /** Elimina un link por su tempId */
  const removeLink = (tempId: string) => {
    const updated = links.filter(l => l.tempId !== tempId)
    onChange(normalizeLinks(updated))
  }

  /** Actualiza un campo específico de un link existente (el label del botón principal no es editable). */
  const updateLink = (tempId: string, field: keyof WizardLink, value: string) => {
    const index = links.findIndex(l => l.tempId === tempId)
    if (index === 0 && field === 'label') return
    onChange(
      normalizeLinks(
        links.map(l => (l.tempId === tempId ? { ...l, [field]: value } : l)),
      ),
    )
  }

  /** Etiqueta de posición para mostrar al usuario */
  const getPositionLabel = (index: number) => {
    if (index === 0) return <span className="inline-flex items-center gap-1"><Star className="w-3 h-3 fill-current" /> Botón principal</span>
    if (index === 1) return 'Botón secundario'
    if (index === 2) return 'Botón terciario'
    return `Enlace extra ${index - 2}`
  }

  return (
    <div className="space-y-6">

      {/* Explicación del sistema de posiciones */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <p className="font-medium mb-1">¿Cómo funcionan los botones?</p>
        <ul className="list-disc list-inside space-y-1 text-blue-700">
          <li><strong>Posición 1:</strong> Botón principal «{PRIMARY_LINK_BUTTON_LABEL}» (siempre visible)</li>
          <li><strong>Posición 2:</strong> Botón secundario (siempre visible)</li>
          <li><strong>Posición 3:</strong> Botón terciario (siempre visible)</li>
          <li><strong>Posición 4+:</strong> Se muestran en un popup de enlaces adicionales</li>
        </ul>
      </div>

      {/* Lista de links ya configurados */}
      {links.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">
            Botones configurados ({links.length}/{MAX_LINKS})
          </h4>

          {links.map((link, index) => (
            <div
              key={link.tempId}
              className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              {/* Indicador de posición */}
              <div className="pt-1 min-w-0 shrink-0">
                <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full whitespace-nowrap">
                  {getPositionLabel(index)}
                </span>
              </div>

              <div className="flex-1 space-y-2 min-w-0">
                {/* Etiqueta del botón */}
                {index === 0 ? (
                  <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md bg-white text-sm text-gray-700">
                    <span className="text-gray-500 shrink-0">Texto:</span>
                    <span className="font-semibold text-purple-700">{PRIMARY_LINK_BUTTON_LABEL}</span>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={link.label}
                    onChange={e => updateLink(link.tempId, 'label', e.target.value)}
                    placeholder="Texto del botón"
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-purple-500 ${
                      link.label.trim() ? 'border-green-300 bg-green-50' : 'border-gray-300'
                    }`}
                  />
                )}

                {/* URL */}
                <input
                  type="url"
                  value={link.url}
                  onChange={e => updateLink(link.tempId, 'url', e.target.value)}
                  placeholder="https://ejemplo.com"
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-purple-500 ${
                    link.url && isValidUrl(link.url) ? 'border-green-300 bg-green-50' : 'border-gray-300'
                  }`}
                />

                {/* Tipo del enlace (propósito) */}
                <select
                  value={link.type}
                  onChange={e => updateLink(link.tempId, 'type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500"
                >
                  {LINK_TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.icon} {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botón eliminar */}
              <button
                onClick={() => removeLink(link.tempId)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                title="Eliminar enlace"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Formulario para agregar un nuevo link */}
      {links.length < MAX_LINKS && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-5">
          <h4 className="font-medium text-gray-900 mb-4">
            {links.length === 0 ? 'Agregar primer enlace' : 'Agregar otro enlace'}
          </h4>

          <div className="space-y-3">
            {/* Etiqueta fija para el botón principal */}
            {links.length === 0 ? (
              <div className="flex items-center gap-2 px-4 py-2 border border-purple-200 rounded-md bg-purple-50 text-sm">
                <span className="text-gray-600">Texto del botón principal:</span>
                <span className="font-semibold text-purple-700">{PRIMARY_LINK_BUTTON_LABEL}</span>
              </div>
            ) : (
              <input
                type="text"
                value={newLink.label}
                onChange={e => setNewLink(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Texto del botón (ej: Más información)"
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500"
              />
            )}

            {/* URL */}
            <input
              type="url"
              value={newLink.url}
              onChange={e => setNewLink(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://ejemplo.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500"
            />
            {newLink.url && !isValidUrl(newLink.url) && (
              <p className="text-xs text-red-500">Ingresa una URL válida (debe comenzar con https://)</p>
            )}

            {/* Tipo del enlace */}
            <select
              value={newLink.type}
              onChange={e => setNewLink(prev => ({ ...prev, type: e.target.value as PostLinkType }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500"
            >
              {LINK_TYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.icon} {opt.label}
                </option>
              ))}
            </select>

            <button
              onClick={addLink}
              disabled={
                (links.length > 0 && !newLink.label.trim()) ||
                !newLink.url.trim() ||
                !isValidUrl(newLink.url)
              }
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Agregar enlace
            </button>
          </div>
        </div>
      )}

      {/* Nota: los links son opcionales */}
      {links.length === 0 && (
        <p className="text-center text-sm text-gray-400">
          Los enlaces son opcionales. Puedes continuar sin agregar ninguno.
        </p>
      )}
    </div>
  )
}

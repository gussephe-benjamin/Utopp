import { useEffect, useState } from "react"
import { X, Plus, Trash2 } from "lucide-react"
import { INTERESTS } from "../../../constants/interests"
import { motion } from "framer-motion"

interface EditOrgProfileModalProps {
  initialName: string
  initialDescription: string
  initialContacts: Record<string, string>
  initialInterests: string[]
  saving: boolean
  onClose: () => void
  onSubmit: (payload: {
    fullName: string
    description: string
    contacts: Record<string, string>
    interests: string[]
  }) => Promise<void>
}

interface CustomLink {
  key: string
  value: string
}

export function EditOrgProfileModal({
  initialName,
  initialDescription,
  initialContacts,
  initialInterests,
  saving,
  onClose,
  onSubmit,
}: EditOrgProfileModalProps) {
  const [fullName, setFullName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)
  const [interests, setInterests] = useState<string[]>(initialInterests)

  // Standard inputs
  const [instagram, setInstagram] = useState("")
  const [website, setWebsite] = useState("")
  const [linkedin, setLinkedin] = useState("")

  // Dynamic inputs for other social networks
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([])

  useEffect(() => {
    setFullName(initialName)
    setDescription(initialDescription)
    setInterests(initialInterests)

    // Load standard fields
    setInstagram(initialContacts.instagram ?? "")
    setWebsite(initialContacts.website ?? "")
    setLinkedin(initialContacts.linkedin ?? "")

    // Load other custom links
    const custom: CustomLink[] = []
    Object.entries(initialContacts).forEach(([key, val]) => {
      if (key !== "instagram" && key !== "website" && key !== "linkedin") {
        custom.push({ key, value: val })
      }
    })
    setCustomLinks(custom)
  }, [initialName, initialDescription, initialContacts, initialInterests])

  const toggleInterest = (interestId: string) => {
    setInterests((prev) =>
      prev.includes(interestId)
        ? prev.filter((id) => id !== interestId)
        : [...prev, interestId]
    )
  }

  const addCustomLink = () => {
    setCustomLinks((prev) => [...prev, { key: "", value: "" }])
  }

  const removeCustomLink = (index: number) => {
    setCustomLinks((prev) => prev.filter((_, idx) => idx !== index))
  }

  const updateCustomLinkKey = (index: number, newKey: string) => {
    setCustomLinks((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, key: newKey } : item))
    )
  }

  const updateCustomLinkValue = (index: number, newValue: string) => {
    setCustomLinks((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, value: newValue } : item))
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Reconstruct contacts dictionary
    const contacts: Record<string, string> = {}
    if (instagram.trim()) contacts.instagram = instagram.trim()
    if (website.trim()) contacts.website = website.trim()
    if (linkedin.trim()) contacts.linkedin = linkedin.trim()

    customLinks.forEach((item) => {
      const cleanKey = item.key.trim().toLowerCase()
      const cleanVal = item.value.trim()
      if (cleanKey && cleanVal) {
        contacts[cleanKey] = cleanVal
      }
    })

    onSubmit({
      fullName,
      description,
      contacts,
      interests,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal Container */}
      <motion.div
        className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl z-10 my-auto max-h-[85vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.4 }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Editar perfil de organización</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
              Nombre de la Organización
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-violet-500 focus:outline-none"
              placeholder="Ej. Mi Organización Estudiantil"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
              Sobre nosotros
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-violet-500 focus:outline-none resize-none"
              placeholder="Describe los objetivos y actividades de tu organización..."
            />
          </div>

          <div className="border-t border-gray-100 pt-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Enlaces principales</h3>
            <div className="grid gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Enlace de Instagram
                </label>
                <input
                  type="url"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 focus:border-violet-500 focus:outline-none"
                  placeholder="https://instagram.com/mi_org"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Página Web
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 focus:border-violet-500 focus:outline-none"
                  placeholder="https://mi_org.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Página de LinkedIn
                </label>
                <input
                  type="url"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 focus:border-violet-500 focus:outline-none"
                  placeholder="https://linkedin.com/company/mi_org"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Extra Links */}
          <div className="border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">Otros contactos (Opcional)</h3>
              <button
                type="button"
                onClick={addCustomLink}
                className="inline-flex items-center gap-1 rounded bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar red
              </button>
            </div>

            <div className="space-y-2">
              {customLinks.map((link, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="text"
                    required
                    value={link.key}
                    onChange={(e) => updateCustomLinkKey(index, e.target.value)}
                    className="w-1/3 rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-900 focus:border-violet-500 focus:outline-none"
                    placeholder="Ej. Tiktok, Twitter, WhatsApp"
                  />
                  <input
                    type="url"
                    required
                    value={link.value}
                    onChange={(e) => updateCustomLinkValue(index, e.target.value)}
                    className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-900 focus:border-violet-500 focus:outline-none"
                    placeholder="https://..."
                  />
                  <button
                    type="button"
                    onClick={() => removeCustomLink(index)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-gray-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {customLinks.length === 0 && (
                <p className="text-[11px] text-gray-400 italic">No se han añadido redes adicionales.</p>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
              Categorías
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 border border-gray-100 rounded-lg">
              {INTERESTS.map((item) => {
                const isSelected = interests.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleInterest(item.id)}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-violet-600 text-white shadow-sm"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <item.icon className="h-3 w-3" />
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>
        </form>

        <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSubmit}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

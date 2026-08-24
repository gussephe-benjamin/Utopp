import { useState } from "react"
import { X, Plus, Trash2, Instagram, Globe, Linkedin, Info, Link as LinkIcon, Tag } from "lucide-react"
import { INTERESTS } from "../../../constants/interests"
import { motion, AnimatePresence } from "framer-motion"
import { useResetOnChange } from "../../../hooks/useResetOnChange"

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

  useResetOnChange([initialName, initialDescription, initialContacts, initialInterests], () => {
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
  })

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
        className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl z-10 my-auto max-h-[85vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.4 }}
      >
        <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-3">
          <h2 className="text-lg font-bold text-gray-900">Editar perfil de organización</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Sección 1: Información Básica */}
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-violet-700">
              <Info className="h-4 w-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Información básica</h3>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-500">
                Nombre de la Organización
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-gray-200/80 bg-gray-50/50 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-violet-100/55 transition-all duration-200"
                placeholder="Ej. Mi Organización Estudiantil"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-500">
                Sobre nosotros
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-gray-200/80 bg-gray-50/50 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-violet-100/55 transition-all duration-200 resize-none leading-relaxed"
                placeholder="Describe los objetivos y actividades de tu organización..."
              />
            </div>
          </div>

          {/* Sección 2: Enlaces */}
          <div className="border-t border-gray-100 pt-4 space-y-4">
            <div className="flex items-center gap-1.5 text-violet-700">
              <LinkIcon className="h-4 w-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Enlaces de contacto</h3>
            </div>

            <div className="grid gap-3">
              {/* Instagram */}
              <div className="flex items-center rounded-xl border border-gray-200/80 bg-gray-50/50 pl-3 focus-within:border-violet-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-100/55 transition-all duration-200">
                <Instagram className="h-4 w-4 text-pink-500 shrink-0" />
                <input
                  type="url"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full bg-transparent border-0 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                  placeholder="Enlace de Instagram (https://instagram.com/...)"
                />
              </div>

              {/* Website */}
              <div className="flex items-center rounded-xl border border-gray-200/80 bg-gray-50/50 pl-3 focus-within:border-violet-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-100/55 transition-all duration-200">
                <Globe className="h-4 w-4 text-emerald-500 shrink-0" />
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full bg-transparent border-0 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                  placeholder="Página Web (https://...)"
                />
              </div>

              {/* LinkedIn */}
              <div className="flex items-center rounded-xl border border-gray-200/80 bg-gray-50/50 pl-3 focus-within:border-violet-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-100/55 transition-all duration-200">
                <Linkedin className="h-4 w-4 text-blue-600 shrink-0" />
                <input
                  type="url"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  className="w-full bg-transparent border-0 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                  placeholder="Página de LinkedIn (https://linkedin.com/...)"
                />
              </div>
            </div>
          </div>

          {/* Sección 3: Otros Contactos */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-gray-500">
                <LinkIcon className="h-4 w-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Otros enlaces (Opcionales)</h3>
              </div>
              <button
                type="button"
                onClick={addCustomLink}
                className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-bold text-violet-700 hover:bg-violet-100 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar red
              </button>
            </div>

            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {customLinks.map((link, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-2 items-center overflow-hidden"
                  >
                    <input
                      type="text"
                      required
                      value={link.key}
                      onChange={(e) => updateCustomLinkKey(index, e.target.value)}
                      className="w-1/3 rounded-xl border border-gray-200/80 bg-gray-50/50 px-3 py-2 text-xs text-gray-900 focus:border-violet-500 focus:bg-white focus:outline-none transition-all duration-200"
                      placeholder="Red (Ej. TikTok)"
                    />
                    <input
                      type="url"
                      required
                      value={link.value}
                      onChange={(e) => updateCustomLinkValue(index, e.target.value)}
                      className="flex-1 rounded-xl border border-gray-200/80 bg-gray-50/50 px-3 py-2 text-xs text-gray-900 focus:border-violet-500 focus:bg-white focus:outline-none transition-all duration-200"
                      placeholder="https://..."
                    />
                    <button
                      type="button"
                      onClick={() => removeCustomLink(index)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {customLinks.length === 0 && (
                <p className="text-[11px] text-gray-400 italic pl-1">No se han añadido redes adicionales.</p>
              )}
            </div>
          </div>

          {/* Sección 4: Categorías */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="flex items-center gap-1.5 text-violet-700">
              <Tag className="h-4 w-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Categorías</h3>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 border border-gray-100 rounded-xl bg-gray-50/30">
              {INTERESTS.map((item) => {
                const isSelected = interests.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleInterest(item.id)}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 duration-150 ${
                      isSelected
                        ? "bg-violet-600 text-white shadow-sm"
                        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <item.icon className="h-3 w-3 shrink-0" />
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
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSubmit}
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-750 disabled:opacity-60 transition-colors shadow-sm active:scale-95"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

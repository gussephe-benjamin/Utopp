import { useEffect, useState } from "react"
import { X, Info, Tag } from "lucide-react"
import { AVAILABILITY_OPTIONS } from "../constants/profileOptions"
import { INTERESTS } from "../../../constants/interests"
import { motion } from "framer-motion"

interface EditProfileModalProps {
  initialCycle: number
  initialAvailability: number
  initialInterests: string[]
  saving: boolean
  onClose: () => void
  onSubmit: (payload: { cycle: number; availability: number; interests: string[] }) => Promise<void>
}

/**
 * Modal de edición de perfil del alumno propietario.
 * Expone ciclo, disponibilidad e intereses editables.
 * Carrera y correo se muestran como solo lectura en la tarjeta principal.
 */
export function EditProfileModal({
  initialCycle,
  initialAvailability,
  initialInterests,
  saving,
  onClose,
  onSubmit,
}: EditProfileModalProps) {
  const [cycle, setCycle] = useState(initialCycle)
  const [availability, setAvailability] = useState(initialAvailability)
  const [interests, setInterests] = useState<string[]>(initialInterests)

  useEffect(() => {
    setCycle(initialCycle)
  }, [initialCycle])

  useEffect(() => {
    setAvailability(initialAvailability)
  }, [initialAvailability])

  useEffect(() => {
    setInterests(initialInterests)
  }, [initialInterests])

  const toggleInterest = (id: string) => {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10 overflow-y-auto">
      <motion.div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl z-10 my-auto"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.4 }}
      >
        <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-3">
          <h2 className="text-lg font-bold text-gray-900">Editar perfil</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-500">
              Ciclo académico
            </label>
            <select
              value={cycle}
              onChange={(event) => setCycle(Number(event.target.value))}
              className="w-full rounded-xl border border-gray-200/80 bg-gray-50/50 px-3.5 py-2.5 text-sm text-gray-900 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-violet-100/55 transition-all duration-200"
            >
              {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
                <option key={value} value={value}>
                  Ciclo {value}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-500">
              Disponibilidad de horario
            </label>
            <select
              value={availability}
              onChange={(event) => setAvailability(Number(event.target.value))}
              className="w-full rounded-xl border border-gray-200/80 bg-gray-50/50 px-3.5 py-2.5 text-sm text-gray-900 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-violet-100/55 transition-all duration-200"
            >
              {AVAILABILITY_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label} ({option.description})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-1.5 text-violet-700">
              <Tag className="h-4 w-4" />
              <label className="text-xs font-bold uppercase tracking-wider">Intereses</label>
            </div>
            <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50/30 p-1.5">
              {INTERESTS.map((item) => {
                const isSelected = interests.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleInterest(item.id)}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150 active:scale-95 ${
                      isSelected
                        ? "bg-violet-600 text-white shadow-sm"
                        : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <item.icon className="h-3 w-3 shrink-0" />
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex gap-2.5 rounded-xl bg-violet-50/65 border border-violet-100/40 p-3.5 mt-2">
            <Info className="h-4 w-4 text-violet-700 shrink-0 mt-0.5" />
            <p className="text-[11px] font-medium leading-relaxed text-violet-800">
              La carrera y el correo provienen de tu registro y no se pueden editar aquí.
            </p>
          </div>
        </div>

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
            onClick={() => onSubmit({ cycle, availability, interests })}
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-750 disabled:opacity-60 transition-colors shadow-sm active:scale-95"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

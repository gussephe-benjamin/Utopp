import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { AVAILABILITY_OPTIONS } from "../constants/profileOptions"
import { motion } from "framer-motion"

interface EditProfileModalProps {
  initialCycle: number
  initialAvailability: number
  saving: boolean
  onClose: () => void
  onSubmit: (payload: { cycle: number; availability: number }) => Promise<void>
}

/**
 * Modal de edición de perfil del alumno propietario.
 * Solo expone los campos editables: ciclo y disponibilidad.
 * Carrera y correo se muestran como solo lectura en la tarjeta principal.
 */
export function EditProfileModal({
  initialCycle,
  initialAvailability,
  saving,
  onClose,
  onSubmit,
}: EditProfileModalProps) {
  const [cycle, setCycle] = useState(initialCycle)
  const [availability, setAvailability] = useState(initialAvailability)

  useEffect(() => {
    setCycle(initialCycle)
  }, [initialCycle])

  useEffect(() => {
    setAvailability(initialAvailability)
  }, [initialAvailability])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <motion.div
      className="absolute inset-0 bg-black/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal Container */}
      <motion.div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl z-10"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.4 }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Editar perfil</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Ciclo
            </label>
            <select
              value={cycle}
              onChange={(event) => setCycle(Number(event.target.value))}
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
            >
              {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
                <option key={value} value={value}>
                  Ciclo {value}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Disponibilidad
            </label>
            <select
              value={availability}
              onChange={(event) => setAvailability(Number(event.target.value))}
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
            >
              {AVAILABILITY_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label} ({option.description})
                </option>
              ))}
            </select>
          </div>

          <p className="rounded-md bg-violet-50 px-3 py-2 text-xs text-violet-800">
            La carrera y el correo institucional no son editables.
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-2">
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
            onClick={() => onSubmit({ cycle, availability })}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

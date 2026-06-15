import { useEffect, useState } from "react"
import { X, Info, Tag, Clock, CalendarDays } from "lucide-react"
import { CYCLE_OPTIONS } from "../constants/profileOptions"
import { motion } from "framer-motion"
import { InterestsSelector } from "./settings/InterestsSelector"
import { AvailabilitySelector } from "./settings/AvailabilitySelector"
import { WeeklyScheduleEditor } from "./settings/WeeklyScheduleEditor"
import {
  countSelectedSlots,
  createEmptyWeeklyAvailability,
  getInitiallySelectedDays,
  type WeeklyAvailabilityPayload,
  type WeekDay,
} from "../../onboarding/lib/weeklyAvailability"

const MIN_INTERESTS = 3

export interface ProfileSettingsPayload {
  cycle: number
  availability: number
  interests: string[]
  weekly_availability: WeeklyAvailabilityPayload
}

interface ProfileSettingsModalProps {
  initialCycle: number
  initialAvailability: number
  initialInterests: string[]
  initialWeeklyAvailability?: WeeklyAvailabilityPayload | null
  saving: boolean
  onClose: () => void
  onSubmit: (payload: ProfileSettingsPayload) => Promise<void>
}

export function ProfileSettingsModal({
  initialCycle,
  initialAvailability,
  initialInterests,
  initialWeeklyAvailability,
  saving,
  onClose,
  onSubmit,
}: ProfileSettingsModalProps) {
  const [cycle, setCycle] = useState(initialCycle)
  const [availability, setAvailability] = useState(initialAvailability)
  const [interests, setInterests] = useState<string[]>(initialInterests)
  const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklyAvailabilityPayload>(
    initialWeeklyAvailability ?? createEmptyWeeklyAvailability(),
  )
  const [selectedWeekDays, setSelectedWeekDays] = useState<WeekDay[]>(() =>
    getInitiallySelectedDays(initialWeeklyAvailability ?? createEmptyWeeklyAvailability()),
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setCycle(initialCycle)
  }, [initialCycle])

  useEffect(() => {
    setAvailability(initialAvailability)
  }, [initialAvailability])

  useEffect(() => {
    setInterests(initialInterests)
  }, [initialInterests])

  useEffect(() => {
    const payload = initialWeeklyAvailability ?? createEmptyWeeklyAvailability()
    setWeeklyAvailability(payload)
    setSelectedWeekDays(getInitiallySelectedDays(payload))
  }, [initialWeeklyAvailability])

  const handleSave = async () => {
    if (interests.length < MIN_INTERESTS) {
      setError(`Selecciona al menos ${MIN_INTERESTS} intereses.`)
      return
    }
    setError(null)
    await onSubmit({
      cycle,
      availability,
      interests,
      weekly_availability: weeklyAvailability,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto">
      <motion.div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        className="relative z-10 my-auto w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.4 }}
      >
        <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-3">
          <h2 className="text-lg font-bold text-gray-900">Configuración del perfil</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-8">
          <section className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Ciclo académico
            </label>
            <select
              value={cycle}
              onChange={(event) => setCycle(Number(event.target.value))}
              className="w-full rounded-xl border border-gray-200/80 bg-gray-50/50 px-3.5 py-2.5 text-sm text-gray-900 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-violet-100/55 transition-all duration-200"
            >
              {CYCLE_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  Ciclo {value}
                </option>
              ))}
            </select>
          </section>

          <section className="space-y-3 border-t border-gray-100 pt-6">
            <div className="flex items-center gap-1.5 text-violet-700">
              <Tag className="h-4 w-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Intereses</h3>
            </div>
            <p className="text-xs text-gray-500">Elige al menos {MIN_INTERESTS} para personalizar recomendaciones.</p>
            <InterestsSelector interests={interests} onChange={setInterests} variant="profile" />
          </section>

          <section className="space-y-3 border-t border-gray-100 pt-6">
            <div className="flex items-center gap-1.5 text-violet-700">
              <Clock className="h-4 w-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Horas libres a la semana</h3>
            </div>
            <AvailabilitySelector value={availability} onChange={setAvailability} variant="profile" />
          </section>

          <section className="space-y-3 border-t border-gray-100 pt-6">
            <div className="flex items-center gap-1.5 text-violet-700">
              <CalendarDays className="h-4 w-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Días y horarios disponibles</h3>
            </div>
            <WeeklyScheduleEditor
              weeklyAvailability={weeklyAvailability}
              selectedDays={selectedWeekDays}
              onWeeklyAvailabilityChange={setWeeklyAvailability}
              onSelectedDaysChange={setSelectedWeekDays}
              variant="profile"
            />
            {countSelectedSlots(weeklyAvailability) === 0 && (
              <p className="text-xs text-gray-400">Opcional: puedes guardar sin horarios específicos.</p>
            )}
          </section>

          <div className="flex gap-2.5 rounded-xl border border-violet-100/40 bg-violet-50/65 p-3.5">
            <Info className="h-4 w-4 text-violet-700 shrink-0 mt-0.5" />
            <p className="text-[11px] font-medium leading-relaxed text-violet-800">
              La carrera y el correo provienen de tu registro y no se pueden editar aquí.
            </p>
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
        )}

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
            onClick={handleSave}
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60 transition-colors shadow-sm active:scale-95"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

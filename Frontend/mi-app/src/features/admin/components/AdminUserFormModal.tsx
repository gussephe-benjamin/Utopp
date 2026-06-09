import { useState, type FormEvent } from "react"
import ReactDOM from "react-dom"
import { motion } from "framer-motion"
import { X } from "lucide-react"
import {
  createAdminUser,
  updateAdminUser,
  type AdminUserDetail,
  type AdminUserListItem,
} from "../../../api/admin.api"
import { TW_UTOPP_GRADIENT_R } from "../../../shared/constants/brand"

type Mode = "create" | "edit"

type Props = {
  mode: Mode
  /** Rol a asignar al crear (estudiante / organización estudiantil). */
  createRoleName?: string
  /** Usuario a editar (solo en modo edit). */
  user?: AdminUserListItem | AdminUserDetail | null
  /** Etiqueta singular de la entidad (p.ej. "alumno", "organización"). */
  entityLabel: string
  /** Muestra campos académicos (carrera/ciclo). */
  showAcademicFields?: boolean
  /** Muestra campo descripción (organizaciones). */
  showDescription?: boolean
  onClose: () => void
  onSaved: () => void
}

function getDetailField<T>(user: Props["user"], key: string, fallback: T): T {
  if (!user) return fallback
  const value = (user as unknown as Record<string, unknown>)[key]
  return (value as T) ?? fallback
}

export function AdminUserFormModal({
  mode,
  createRoleName,
  user,
  entityLabel,
  showAcademicFields = false,
  showDescription = false,
  onClose,
  onSaved,
}: Props) {
  const [email, setEmail] = useState(user?.email ?? "")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState(user?.full_name ?? "")
  const [career, setCareer] = useState(getDetailField<string>(user, "career", ""))
  const [cycle, setCycle] = useState<string>(
    user?.cycle != null ? String(user.cycle) : "",
  )
  const [description, setDescription] = useState(getDetailField<string>(user, "description", ""))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isCreate = mode === "create"

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (isCreate && password.trim().length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.")
      return
    }

    setSaving(true)
    try {
      const cycleNum = cycle.trim() ? Number(cycle) : null
      if (isCreate) {
        await createAdminUser({
          email: email.trim(),
          password: password,
          full_name: fullName.trim() || null,
          role: createRoleName ?? null,
        })
        // Campos extra en creación: actualizar si se completaron
        // (el endpoint de creación solo recibe email/password/full_name/role)
      } else if (user) {
        await updateAdminUser(user.id, {
          email: email.trim() || undefined,
          full_name: fullName.trim() || null,
          career: showAcademicFields ? career.trim() || null : undefined,
          cycle: showAcademicFields ? cycleNum : undefined,
          description: showDescription ? description.trim() || null : undefined,
        })
      }
      onSaved()
    } catch (err) {
      const maybeAxios = err as {
        response?: { status?: number; data?: { detail?: string } }
        message?: string
      }
      setError(
        maybeAxios.response?.data?.detail ??
          maybeAxios.message ??
          "No se pudo guardar. Inténtalo nuevamente.",
      )
    } finally {
      setSaving(false)
    }
  }

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />
      <motion.div
        className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.3 }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">
            {isCreate ? `Crear ${entityLabel}` : `Editar ${entityLabel}`}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Correo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
              placeholder="correo@utec.edu.pe"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nombre completo</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
              placeholder="Nombre"
            />
          </div>

          {isCreate && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          )}

          {!isCreate && showAcademicFields && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Carrera</label>
                <input
                  type="text"
                  value={career}
                  onChange={(e) => setCareer(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Ciclo</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={cycle}
                  onChange={(e) => setCycle(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                />
              </div>
            </div>
          )}

          {!isCreate && showDescription && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Descripción</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
              />
            </div>
          )}

          {isCreate && (showAcademicFields || showDescription) && (
            <p className="text-xs text-gray-400">
              Podrás completar carrera, ciclo y descripción editando el registro luego de crearlo.
            </p>
          )}

          {error && (
            <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white ${TW_UTOPP_GRADIENT_R} disabled:opacity-50`}
            >
              {saving ? "Guardando…" : isCreate ? "Crear" : "Guardar"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>,
    document.body,
  )
}

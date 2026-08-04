import { useState } from "react"
import { motion } from "framer-motion"
import { Check, ImageUp, Sparkles, X } from "lucide-react"
import { createEvent, type SharedEvent } from "../../../api/events.api"
import { uploadToCloudinary } from "../../../api/cloudinary"
import { EVENT_TYPES } from "./eventTypes"
import { EVENT_THEMES } from "./eventThemes"

/**
 * Creación de eventos en la tabla compartida con Utopp Formulario.
 *
 * Reproduce el paso 1 del wizard de Utopp Formulario
 * (`Frontend/src/pages/Dashboard.tsx`) con los mismos campos, catálogos y
 * estilo. El paso 2 de aquel wizard (campos personalizados del formulario de
 * inscripción) no se replica: esos campos pertenecen a Utopp Formulario y solo
 * su organizador los define allí. Los eventos creados desde aquí usan el
 * formulario estándar de inscripción: nombre y correo.
 */

const MAX_BANNER_BYTES = 3 * 1024 * 1024

type CreateEventWizardProps = {
  onClose: () => void
  onCreated?: (event: SharedEvent) => void
}

export function CreateEventWizard({ onClose, onCreated }: CreateEventWizardProps) {
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [shortDescription, setShortDescription] = useState("")
  const [description, setDescription] = useState("")
  const [dateTime, setDateTime] = useState("")
  const [capacity, setCapacity] = useState<number | "">("")
  const [location, setLocation] = useState("")
  const [banner, setBanner] = useState("")
  const [theme, setTheme] = useState(EVENT_THEMES[0].key)
  const [allowOnlyUtecEmails, setAllowOnlyUtecEmails] = useState(false)

  const [bannerDragOver, setBannerDragOver] = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleBannerFile = async (file?: File | null) => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("Sube un archivo de imagen válido (JPG, PNG, WebP).")
      return
    }
    if (file.size > MAX_BANNER_BYTES) {
      setError("La imagen debe pesar menos de 3 MB.")
      return
    }
    setError(null)
    setBannerUploading(true)
    try {
      const { secure_url } = await uploadToCloudinary(file)
      setBanner(secure_url)
    } catch {
      setError("No se pudo subir la imagen. Inténtalo de nuevo.")
    } finally {
      setBannerUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const created = await createEvent({
        title: title.trim(),
        description: description.trim() || null,
        short_description: shortDescription.trim() || null,
        category: category || null,
        theme,
        date_time: new Date(dateTime).toISOString(),
        location: location.trim(),
        capacity: capacity === "" ? null : Number(capacity),
        banner_url: banner || null,
        allow_only_utec_emails: allowOnlyUtecEmails,
      })
      onCreated?.(created)
      window.dispatchEvent(new Event("eventCreated"))
      onClose()
    } catch (err) {
      const detail =
        (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
      setError(
        typeof detail === "string" ? detail : "No se pudo crear el evento. Revisa los datos.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
  const labelClass = "mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500"

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Crear evento"
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl md:max-w-2xl"
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800">
              <Sparkles className="h-5 w-5 text-purple-600" /> Crear Evento
            </h3>
            <p className="text-[10px] font-medium text-slate-500">
              Visible para toda la comunidad y en Utopp Formulario
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="max-h-[68vh] flex-1 space-y-4 overflow-y-auto p-6">
            <div>
              <label className={labelClass}>Título del Evento *</label>
              <input
                type="text"
                required
                placeholder="Ej. Conferencia de Inteligencia Artificial"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={`${labelClass} mb-2`}>Tipo de evento</label>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {EVENT_TYPES.map((t) => {
                  const Icon = t.icon
                  const selected = category === t.key
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setCategory(selected ? "" : t.key)}
                      className={`group relative flex flex-col items-center gap-2 rounded-2xl border p-3 transition-all ${
                        selected
                          ? "border-violet-400 bg-violet-50 shadow-sm ring-1 ring-violet-200"
                          : "border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/40"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white ${t.accent} ${
                          selected ? "shadow-md" : "opacity-80 group-hover:opacity-100"
                        }`}
                      >
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <span
                        className={`text-center text-[11px] font-bold leading-tight ${
                          selected ? "text-violet-700" : "text-slate-600"
                        }`}
                      >
                        {t.label}
                      </span>
                      {selected ? (
                        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-violet-600" />
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className={labelClass}>Descripción corta</label>
              <input
                type="text"
                maxLength={140}
                placeholder="Ej. 48 horas para construir soluciones con IA."
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className={inputClass}
              />
              <p className="mt-1 text-[10px] text-slate-400">
                Gancho que sale debajo del título ({shortDescription.length}/140).
              </p>
            </div>

            <div>
              <label className={labelClass}>Descripción larga / detalles</label>
              <textarea
                rows={4}
                placeholder="Cuenta de qué trata el evento, qué incluye, requisitos, premios..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Fecha y Hora *</label>
                <input
                  type="datetime-local"
                  required
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Aforo Máximo</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Ej. 100 (Opcional)"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value === "" ? "" : Number(e.target.value))}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Ubicación / Lugar *</label>
              <input
                type="text"
                required
                placeholder="Ej. Aula Magna A302 o link de Zoom"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className={labelClass}>Imagen del evento</label>
                <span className="text-[10px] font-medium text-slate-400">
                  Portada de la tarjeta y del landing
                </span>
              </div>
              {banner ? (
                <div className="group relative overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                  <img
                    src={banner}
                    alt="Imagen del evento"
                    className="aspect-[16/10] w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="absolute inset-x-2.5 bottom-2.5 flex items-center justify-between opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                      <Check className="h-3 w-3 text-emerald-400" /> Imagen lista
                    </span>
                    <div className="flex items-center gap-1.5">
                      <label className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-900 transition hover:brightness-95">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleBannerFile(e.target.files?.[0])}
                        />
                        <ImageUp className="h-3 w-3" /> Cambiar
                      </label>
                      <button
                        type="button"
                        onClick={() => setBanner("")}
                        title="Quitar imagen"
                        className="inline-flex items-center rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-red-500/80"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <label
                  onDragOver={(e) => {
                    e.preventDefault()
                    setBannerDragOver(true)
                  }}
                  onDragLeave={() => setBannerDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setBannerDragOver(false)
                    handleBannerFile(e.dataTransfer.files?.[0])
                  }}
                  className={`relative flex h-40 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed transition-all ${
                    bannerDragOver
                      ? "scale-[0.99] border-violet-400 bg-violet-50"
                      : "border-slate-300 bg-gradient-to-b from-slate-50 to-white hover:border-violet-300 hover:bg-violet-50/40"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleBannerFile(e.target.files?.[0])}
                  />
                  {bannerUploading ? (
                    <>
                      <div className="h-7 w-7 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                      <span className="text-xs font-bold text-slate-500">Subiendo imagen…</span>
                    </>
                  ) : (
                    <>
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25">
                        <ImageUp className="h-5 w-5" />
                      </span>
                      <span className="text-sm font-bold text-slate-700">
                        {bannerDragOver ? "Suelta la imagen aquí" : "Arrastra una imagen o haz clic"}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        JPG, PNG o WebP · máx 3 MB · ideal 16:10
                      </span>
                    </>
                  )}
                </label>
              )}
            </div>

            <div>
              <label className={`${labelClass} mb-2`}>Tema de fondo</label>
              <div className="flex flex-wrap gap-2.5">
                {EVENT_THEMES.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTheme(t.key)}
                    title={t.label}
                    className={`relative h-11 w-11 rounded-xl bg-gradient-to-br transition-all ${t.gradient} ${
                      theme === t.key
                        ? "scale-105 ring-2 ring-violet-500 ring-offset-2"
                        : "opacity-80 hover:scale-105 hover:opacity-100"
                    }`}
                  >
                    {theme === t.key ? (
                      <span className="absolute inset-0 flex items-center justify-center text-white">
                        <Check className="h-4 w-4 drop-shadow" />
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between rounded-2xl border border-purple-100/60 bg-purple-50/50 p-4">
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800">Restricción UTEC</span>
                <span className="text-[10px] font-medium text-slate-500">
                  Permitir solo correos @utec.edu.pe y @utec.pe
                </span>
              </div>
              <label className="relative inline-flex cursor-pointer select-none items-center">
                <input
                  type="checkbox"
                  checked={allowOnlyUtecEmails}
                  onChange={(e) => setAllowOnlyUtecEmails(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-10 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-purple-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
              </label>
            </div>

            <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[11px] leading-relaxed text-slate-500">
              La inscripción se hace en Utopp Formulario con los campos estándar
              (nombre y correo). Para pedir datos adicionales, edita el evento
              desde el dashboard de Utopp Formulario.
            </p>

            {error ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || bannerUploading}
              className="rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:shadow-md disabled:opacity-60"
            >
              {submitting ? "Creando…" : "Crear evento"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

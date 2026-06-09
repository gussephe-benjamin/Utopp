import { useEffect, useState } from "react"
import { Eye, Pencil, Save } from "lucide-react"
import { getCurrentTerms, getCurrentPrivacy, updateTerms, updatePrivacy } from "../../api/legal.api"
import LegalMarkdownBody from "../../components/legal/LegalMarkdownBody"
import { TW_UTOPP_GRADIENT_R } from "../../shared/constants/brand"

type DocKind = "terms" | "privacy"

export default function AdminTermsPage() {
  const [kind, setKind] = useState<DocKind>("terms")
  const [content, setContent] = useState("")
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setFeedback(null)
    const fetcher = kind === "terms" ? getCurrentTerms : getCurrentPrivacy
    fetcher()
      .then((doc) => {
        if (cancelled) return
        setContent(doc.content)
        setTitle(doc.title ?? "")
      })
      .catch(() => {
        if (cancelled) return
        setContent("")
        setTitle("")
        setFeedback({ text: "No se pudo cargar el documento vigente.", ok: false })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [kind])

  async function handleSave() {
    setSaving(true)
    setFeedback(null)
    try {
      const updater = kind === "terms" ? updateTerms : updatePrivacy
      await updater({ content, title: title.trim() || null })
      setFeedback({ text: "Documento actualizado correctamente.", ok: true })
    } catch (err) {
      const maybeAxios = err as { response?: { data?: { detail?: string } }; message?: string }
      setFeedback({
        text: maybeAxios.response?.data?.detail ?? maybeAxios.message ?? "No se pudo guardar.",
        ok: false,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos legales</h1>
          <p className="mt-1 text-sm text-gray-500">
            Edita el contenido vigente. Los cambios se aplican en sitio sin forzar re-aceptación.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {preview ? <Pencil className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {preview ? "Editar" : "Previsualizar"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white ${TW_UTOPP_GRADIENT_R} disabled:opacity-50`}
          >
            <Save className="h-4 w-4" />
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>

      {/* Selector de documento */}
      <div className="mb-4 inline-flex rounded-xl border border-gray-200 bg-white p-1">
        {(["terms", "privacy"] as DocKind[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              kind === k ? "bg-violet-100 text-violet-700" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {k === "terms" ? "Términos y condiciones" : "Política de privacidad"}
          </button>
        ))}
      </div>

      {feedback && (
        <p
          className={`mb-4 rounded-xl border px-3 py-2 text-sm ${
            feedback.ok
              ? "border-green-100 bg-green-50 text-green-700"
              : "border-red-100 bg-red-50 text-red-700"
          }`}
        >
          {feedback.text}
        </p>
      )}

      {loading ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500">
          Cargando documento…
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <label className="mb-1 block text-sm font-medium text-gray-700">Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mb-4 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
            placeholder="Título del documento"
          />

          <label className="mb-1 block text-sm font-medium text-gray-700">
            Contenido (Markdown)
          </label>
          {preview ? (
            <div className="min-h-[360px] rounded-xl border border-gray-100 bg-gray-50/60 p-4">
              <LegalMarkdownBody markdown={content} />
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              spellCheck={false}
              className="min-h-[360px] w-full rounded-xl border border-gray-200 p-3 font-mono text-sm leading-relaxed focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
            />
          )}
        </div>
      )}
    </div>
  )
}

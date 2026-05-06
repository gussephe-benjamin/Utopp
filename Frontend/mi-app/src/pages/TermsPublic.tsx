import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { getCurrentTerms, type TermsCurrent } from "../api/legal.api"

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-PE", {
      dateStyle: "long",
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

/**
 * Página pública de solo lectura del documento legal vigente.
 * El contenido se muestra como texto (saltos de línea respetados); si en BD es Markdown puro, valorar react-markdown.
 */
export default function TermsPublic() {
  const navigate = useNavigate()
  const [doc, setDoc] = useState<TermsCurrent | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const t = await getCurrentTerms()
        if (!cancelled) setDoc(t)
      } catch {
        if (!cancelled) setError("No se pudieron cargar los términos. Intenta más tarde.")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            <ArrowLeft className="size-4" />
            Volver
          </button>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-4 py-10">
        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
        )}

        {doc && (
          <>
            <p className="text-sm font-medium uppercase tracking-wide text-indigo-600">Versión {doc.version}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {doc.title?.trim() || "Términos y condiciones"}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Vigente desde {formatDate(doc.effective_at)}
            </p>

            <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-base leading-relaxed text-slate-800 whitespace-pre-wrap">{doc.content}</div>
            </div>

            <p className="mt-8 text-center text-sm text-slate-500">
              <Link to="/register" className="font-medium text-indigo-600 hover:underline">
                Crear cuenta
              </Link>
              {" · "}
              <Link to="/login" className="font-medium text-indigo-600 hover:underline">
                Iniciar sesión
              </Link>
            </p>
          </>
        )}
      </article>
    </div>
  )
}

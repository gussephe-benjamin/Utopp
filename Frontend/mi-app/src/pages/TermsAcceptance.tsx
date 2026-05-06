import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { getCurrentTerms, acceptTerms, type TermsCurrent } from "../api/legal.api"
import { redirectAfterAuthSession } from "../auth/postAuthRedirect"
import { parseAuthApiError } from "../shared/lib/apiErrors"

/**
 * Pantalla obligatoria cuando el usuario tiene sesión pero debe aceptar
 * la versión vigente de términos (alta o re-consent por nueva versión).
 */
export default function TermsAcceptance() {
  const navigate = useNavigate()
  const [doc, setDoc] = useState<TermsCurrent | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const t = await getCurrentTerms()
        if (!cancelled) setDoc(t)
      } catch {
        if (!cancelled) setLoadError("No se pudieron cargar los términos. Intenta más tarde.")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleAccept = async () => {
    if (!doc || !checked) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await acceptTerms(doc.id)
      await redirectAfterAuthSession(navigate)
    } catch (e) {
      setSubmitError(parseAuthApiError(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0a38] via-[#120826] to-[#0c0518] text-white px-4 py-10">
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-bold text-white mb-1">Términos y condiciones</h1>
        <p className="text-violet-200/80 text-sm mb-6">
          Debes aceptar la versión vigente para usar Utopp.
        </p>

        {loadError && (
          <p className="text-red-300 text-sm mb-4">{loadError}</p>
        )}

        {doc && (
          <>
            <p className="text-sm text-violet-100/90 mb-4">
              Lee el texto completo en la{" "}
              <Link
                to="/terms"
                className="font-semibold text-white underline underline-offset-2 hover:text-violet-200"
              >
                página de términos y condiciones
              </Link>{" "}
              (versión {doc.version}
              {doc.title ? ` — ${doc.title}` : ""}).
            </p>

            <label className="flex items-start gap-3 cursor-pointer mb-6">
              <input
                type="checkbox"
                className="mt-1 size-4 rounded border-white/30 bg-white/10"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
              />
              <span className="text-sm text-violet-100">
                Confirmo que he leído y acepto la versión vigente de los términos y condiciones.
              </span>
            </label>

            {submitError && <p className="text-red-300 text-sm mb-3">{submitError}</p>}

            <button
              type="button"
              disabled={!checked || submitting}
              onClick={handleAccept}
              className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-3 font-semibold text-white shadow-lg shadow-violet-500/30 disabled:opacity-45 disabled:cursor-not-allowed"
            >
              {submitting ? "Guardando…" : "Aceptar y continuar"}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { getCurrentPrivacy, type TermsCurrent } from "../api/legal.api"
import LegalMarkdownBody from "../components/legal/LegalMarkdownBody"
import { useLegalPublicScrollUnlock } from "../hooks/useLegalPublicScrollUnlock"
import { navigateBackFromLegalPublic } from "../shared/navigation/legalPublicExit"

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-PE", {
      dateStyle: "long",
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

/** Página pública de solo lectura de la política de privacidad vigente (Markdown desde API). */
export default function PrivacyPublic() {
  const navigate = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [doc, setDoc] = useState<TermsCurrent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [markdownReady, setMarkdownReady] = useState(false)

  const handleMarkdownReady = useCallback(() => {
    setMarkdownReady(true)
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const t = await getCurrentPrivacy()
        if (!cancelled) {
          setDoc(t)
          setError(null)
        }
      } catch {
        if (!cancelled) setError("No se pudo cargar la política de privacidad. Intenta más tarde.")
      }
    }
    void load()
    const onVisibility = () => {
      if (document.visibilityState === "visible" && !cancelled) void load()
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      cancelled = true
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0)
  }, [doc?.id])

  useEffect(() => {
    setMarkdownReady(false)
  }, [doc?.id])

  const scrollActive = Boolean(doc) && !error && markdownReady
  const scrollContentKey = doc ? `${doc.id}-${markdownReady ? 1 : 0}` : null
  const { reachedEnd, onScroll } = useLegalPublicScrollUnlock(scrollActive, scrollRef, scrollContentKey)

  const canGoBack = Boolean(error) || !doc || reachedEnd

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col bg-slate-50 text-slate-900">
      <header className="shrink-0 border-b border-slate-200 bg-white/95 pt-[env(safe-area-inset-top,0px)] shadow-sm backdrop-blur-md">
        <div className="mx-auto max-w-3xl space-y-2 px-4 py-3">
          {doc && !error ? (
            <>
              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600 sm:text-base">
                UTOPP
              </p>
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl">
                {doc.title?.trim() || "Política de datos y privacidad"}
              </h1>
              <p className="text-sm text-slate-600 sm:text-base pt-1">
                Vigente desde {formatDate(doc.effective_at)}
              </p>
            </>
          ) : error ? (
            <p className="text-sm font-medium text-red-700">Error al cargar</p>
          ) : (
            <div className="h-6" aria-hidden />
          )}
        </div>
      </header>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="mx-auto min-h-0 w-full max-w-3xl flex-1 overflow-y-auto px-4 py-4"
      >
        {error && (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
        )}
        {doc && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <LegalMarkdownBody markdown={doc.content} variant="light" onReady={handleMarkdownReady} />
          </div>
        )}
      </div>

      <footer className="shrink-0 border-t border-slate-200 bg-white/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-2px_12px_rgba(15,23,42,0.05)] backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-3xl justify-end px-5 py-2.5">
          <button
            type="button"
            disabled={!canGoBack}
            onClick={() => navigateBackFromLegalPublic(navigate)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors enabled:hover:border-indigo-200 enabled:hover:bg-indigo-50 enabled:hover:text-indigo-800 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <ArrowLeft className="size-4 shrink-0" aria-hidden />
            Volver
          </button>
        </div>
      </footer>
    </div>
  )
}

import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { getCurrentPrivacy, getCurrentTerms, acceptLegal, type TermsCurrent } from "../api/legal.api"
import { getMe } from "../api/auth.api"
import { redirectAfterAuthSession } from "../auth/postAuthRedirect"
import { parseAuthApiError } from "../shared/lib/apiErrors"
import LegalMarkdownBody from "../components/legal/LegalMarkdownBody"

function useScrollToEnd() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const innerWrapRef = useRef<HTMLDivElement>(null)
  const [scrolledToEnd, setScrolledToEnd] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    const threshold = 8
    const needsScroll = scrollHeight > clientHeight + 8
    const atEnd = !needsScroll || scrollTop + clientHeight >= scrollHeight - threshold
    setScrolledToEnd(atEnd)
  }, [])

  return { scrollRef, innerWrapRef, scrolledToEnd, updateScrollState, setScrolledToEnd }
}

/**
 * Pantalla obligatoria cuando el usuario tiene sesión pero debe aceptar
 * términos y/o política de privacidad vigentes.
 */
export default function TermsAcceptance() {
  const navigate = useNavigate()
  const [termsDoc, setTermsDoc] = useState<TermsCurrent | null>(null)
  const [privacyDoc, setPrivacyDoc] = useState<TermsCurrent | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [needTerms, setNeedTerms] = useState(true)
  const [needPrivacy, setNeedPrivacy] = useState(true)
  const [meChecked, setMeChecked] = useState(false)

  const [termsChecked, setTermsChecked] = useState(false)
  const [privacyChecked, setPrivacyChecked] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const termsScroll = useScrollToEnd()
  const privacyScroll = useScrollToEnd()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const me = await getMe()
        if (cancelled) return
        const overall = me.needs_terms === true
        const nt = me.needs_terms_consent ?? overall
        const np = me.needs_privacy_consent ?? overall
        if (!overall) {
          await redirectAfterAuthSession(navigate)
          return
        }
        setNeedTerms(nt)
        setNeedPrivacy(np)
        setMeChecked(true)
        const [t, p] = await Promise.all([getCurrentTerms(), getCurrentPrivacy()])
        if (!cancelled) {
          setTermsDoc(t)
          setPrivacyDoc(p)
        }
      } catch {
        if (!cancelled) setLoadError("No se pudieron cargar los datos. Intenta más tarde.")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [navigate])

  useEffect(() => {
    setTermsChecked(false)
    termsScroll.setScrolledToEnd(false)
  }, [termsDoc?.id, needTerms])

  useEffect(() => {
    setPrivacyChecked(false)
    privacyScroll.setScrolledToEnd(false)
  }, [privacyDoc?.id, needPrivacy])

  useEffect(() => {
    const inner = termsScroll.innerWrapRef.current
    if (!inner || !termsDoc || !needTerms) return
    termsScroll.updateScrollState()
    const ro = new ResizeObserver(() => termsScroll.updateScrollState())
    ro.observe(inner)
    return () => ro.disconnect()
  }, [termsDoc, termsDoc?.content, needTerms, termsScroll.updateScrollState, termsScroll.innerWrapRef])

  useEffect(() => {
    const inner = privacyScroll.innerWrapRef.current
    if (!inner || !privacyDoc || !needPrivacy) return
    privacyScroll.updateScrollState()
    const ro = new ResizeObserver(() => privacyScroll.updateScrollState())
    ro.observe(inner)
    return () => ro.disconnect()
  }, [privacyDoc, privacyDoc?.content, needPrivacy, privacyScroll.updateScrollState, privacyScroll.innerWrapRef])

  const termsGate = !needTerms || (termsScroll.scrolledToEnd && termsChecked)
  const privacyGate = !needPrivacy || (privacyScroll.scrolledToEnd && privacyChecked)
  const canSubmit = meChecked && !!termsDoc && !!privacyDoc && termsGate && privacyGate && !submitting

  const handleAccept = async () => {
    if (!termsDoc || !privacyDoc || !canSubmit) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await acceptLegal({
        termsDocumentId: needTerms ? termsDoc.id : undefined,
        privacyDocumentId: needPrivacy ? privacyDoc.id : undefined,
      })
      await redirectAfterAuthSession(navigate)
    } catch (e) {
      setSubmitError(parseAuthApiError(e))
    } finally {
      setSubmitting(false)
    }
  }

  const renderScrollBlock = (
    doc: TermsCurrent,
    label: string,
    linkTo: string,
    linkLabel: string,
    need: boolean,
    scroll: ReturnType<typeof useScrollToEnd>,
    checked: boolean,
    setChecked: (v: boolean) => void
  ) => {
    if (!need) return null
    const canCheck = scroll.scrolledToEnd
    return (
      <section className="mb-8">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-violet-300/90">
            {label} · versión {doc.version}
            {doc.title ? ` · ${doc.title}` : ""}
          </p>
          <Link
            to={linkTo}
            className="text-xs font-semibold text-white/90 underline underline-offset-2 hover:text-violet-200"
          >
            {linkLabel}
          </Link>
        </div>

        <div
          ref={scroll.scrollRef}
          onScroll={scroll.updateScrollState}
          className="mb-4 max-h-[min(40vh,400px)] overflow-y-auto rounded-2xl border border-white/15 bg-black/25 px-4 py-4 shadow-inner shadow-black/40"
        >
          <div ref={scroll.innerWrapRef}>
            <LegalMarkdownBody markdown={doc.content} variant="dark" className="pr-1" />
          </div>
        </div>

        {!canCheck && (
          <p className="mb-4 text-xs text-violet-200/70">
            Desplázate hasta el final de este texto para poder marcar la casilla.
          </p>
        )}

        <label
          className={`flex items-start gap-3 mb-2 ${canCheck ? "cursor-pointer" : "cursor-not-allowed opacity-70"}`}
        >
          <input
            type="checkbox"
            className="mt-1 size-4 shrink-0 rounded border-white/30 bg-white/10 disabled:opacity-50"
            checked={checked}
            disabled={!canCheck}
            onChange={(e) => setChecked(e.target.checked)}
          />
          <span className="text-sm text-violet-100">
            Confirmo que he leído y acepto este documento.
          </span>
        </label>
      </section>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0a38] via-[#120826] to-[#0c0518] text-white px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-white mb-1">Consentimiento legal</h1>
        <p className="text-violet-200/80 text-sm mb-6">
          Debes aceptar los documentos pendientes para usar Utopp.
        </p>

        {loadError && <p className="text-red-300 text-sm mb-4">{loadError}</p>}

        {termsDoc && privacyDoc && (
          <>
            {renderScrollBlock(
              termsDoc,
              "Términos y condiciones",
              "/terms",
              "Abrir términos en página completa",
              needTerms,
              termsScroll,
              termsChecked,
              setTermsChecked
            )}
            {renderScrollBlock(
              privacyDoc,
              "Privacidad",
              "/privacy",
              "Abrir privacidad en página completa",
              needPrivacy,
              privacyScroll,
              privacyChecked,
              setPrivacyChecked
            )}

            {submitError && <p className="text-red-300 text-sm mb-3">{submitError}</p>}

            <button
              type="button"
              disabled={!canSubmit}
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

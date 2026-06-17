import { useCallback, useEffect, useState, type FormEvent } from "react"
import { Navigate, useNavigate, useSearchParams } from "react-router-dom"
import {
  cancelGoogleOAuthPending,
  completeGoogleOAuthRegister,
  fetchGoogleOAuthPending,
  getGoogleOAuthLoginUrl,
  getMe,
  loginSession,
} from "../../api/auth.api"
import { getCurrentPrivacy, getCurrentTerms, type TermsCurrent } from "../../api/legal.api"
import { useAuth } from "../../auth/useAuth"
import { redirectAfterAuthSession } from "../../auth/postAuthRedirect"
import LegalContentModal, { type LegalDocKind } from "../../components/auth/LegalContentModal"
import { Button } from "../../components/ui/button"
import {
  AuthFormAlert,
  AuthFormDivider,
  AuthFormHeading,
  AuthFormShell,
  GoogleMark,
} from "../../features/auth/components/AuthFormShell"
import {
  AUTH_ENTRY,
  AUTH_LOGIN,
  AUTH_REGISTER,
  AUTH_UTEC,
} from "../../features/auth/constants/authCopy"
import { EmailInput } from "../../features/auth/components/EmailInput"
import { PasswordInput } from "../../features/auth/components/PasswordInput"
import { parseAuthApiError } from "../../shared/lib/apiErrors"
import {
  TW_AUTH_CHECKBOX,
  TW_AUTH_FOOTER_LINK,
  TW_AUTH_LEGAL_LINK,
  TW_AUTH_FOCUS_RING,
  TW_UTOPP_GRADIENT_R,
} from "../../shared/constants/brand"

export default function AuthEntry() {
  const navigate = useNavigate()
  const { status, refreshSession } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const accessDenied = searchParams.get("error") === "access_denied"
  const googleRegisterParam = searchParams.get("google_register") === "1"
  const pendingToken = searchParams.get("pending_token")

  const [registerMode, setRegisterMode] = useState(false)
  const [pendingEmail, setPendingEmail] = useState("")
  const [pendingName, setPendingName] = useState("")
  const [termsDoc, setTermsDoc] = useState<TermsCurrent | null>(null)
  const [privacyDoc, setPrivacyDoc] = useState<TermsCurrent | null>(null)
  const [legalAccepted, setLegalAccepted] = useState(false)
  const [openLegalModal, setOpenLegalModal] = useState<LegalDocKind | null>(null)
  const [legalLoadError, setLegalLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [checkingPending, setCheckingPending] = useState(true)

  const legalReady = !!termsDoc && !!privacyDoc && !legalLoadError
  const canCreateAccount = legalReady && legalAccepted && !isSubmitting

  const loadPendingState = useCallback(async () => {
    setCheckingPending(true)
    try {
      const pending = await fetchGoogleOAuthPending(pendingToken)
      if (pending.pending) {
        setRegisterMode(true)
        setPendingEmail(pending.email ?? "")
        setPendingName(pending.full_name ?? "")
      } else if (googleRegisterParam) {
        setRegisterMode(false)
        setSubmitError(
          pendingToken
            ? "No se pudo validar tu registro con Google. Vuelve a continuar con Google."
            : "Tu sesión de registro expiró. Vuelve a continuar con Google.",
        )
      } else {
        setRegisterMode(false)
      }
    } catch {
      if (googleRegisterParam && pendingToken) {
        setRegisterMode(true)
      } else {
        setRegisterMode(false)
      }
    } finally {
      setCheckingPending(false)
    }
  }, [googleRegisterParam, pendingToken])

  useEffect(() => {
    void loadPendingState()
  }, [loadPendingState])

  useEffect(() => {
    if (!registerMode) return
    let cancelled = false
    ;(async () => {
      try {
        const [t, p] = await Promise.all([getCurrentTerms(), getCurrentPrivacy()])
        if (!cancelled) {
          setTermsDoc(t)
          setPrivacyDoc(p)
        }
      } catch {
        if (!cancelled) {
          setLegalLoadError(AUTH_REGISTER.legalLoadError)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [registerMode])

  useEffect(() => {
    if (!accessDenied) return
    const next = new URLSearchParams(searchParams)
    next.delete("error")
    setSearchParams(next, { replace: true })
  }, [accessDenied, searchParams, setSearchParams])

  const handleCancelRegister = async () => {
    try {
      await cancelGoogleOAuthPending()
    } catch {
      /* ignore */
    }
    setRegisterMode(false)
    setLegalAccepted(false)
    setOpenLegalModal(null)
    setSubmitError(null)
    const next = new URLSearchParams(searchParams)
    next.delete("google_register")
    next.delete("pending_token")
    setSearchParams(next, { replace: true })
  }

  const handleEmailLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email.trim() || !password) {
      setSubmitError(AUTH_ENTRY.credentialsRequired)
      return
    }

    setIsLoggingIn(true)
    setSubmitError(null)
    try {
      await loginSession({ email: email.trim(), password })
      await refreshSession()
      const me = await getMe()
      redirectAfterAuthSession(navigate, me)
    } catch (err) {
      setSubmitError(parseAuthApiError(err))
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleCreateAccount = async () => {
    if (!legalReady) return
    if (!legalAccepted) {
      setSubmitError(AUTH_REGISTER.legalAcceptRequired)
      return
    }
    if (!canCreateAccount || !termsDoc || !privacyDoc) return

    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await completeGoogleOAuthRegister({
        terms_document_id: termsDoc.id,
        privacy_document_id: privacyDoc.id,
        pending_token: pendingToken,
      })
      await refreshSession()
      const me = await getMe()
      redirectAfterAuthSession(navigate, me)
    } catch (err) {
      setSubmitError(parseAuthApiError(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const legalModal = (
    <LegalContentModal
      kind={openLegalModal}
      mode="accept"
      document={openLegalModal === "terms" ? termsDoc : openLegalModal === "privacy" ? privacyDoc : null}
      onClose={() => setOpenLegalModal(null)}
      onAccept={() => setLegalAccepted(true)}
    />
  )

  if (status === "initializing" || checkingPending) {
    return (
      <AuthFormShell tall={false} footer={null}>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
          <p className="text-sm text-slate-500">Verificando sesión...</p>
        </div>
      </AuthFormShell>
    )
  }

  if (status === "authenticated") {
    return <Navigate to="/" replace />
  }

  if (registerMode) {
    return (
      <>
        {legalModal}
        <AuthFormShell
          tall
          footer={
            <p className="text-center text-xs leading-relaxed text-slate-500">
              {AUTH_REGISTER.footerQuestion}{" "}
              <button type="button" onClick={() => void handleCancelRegister()} className={TW_AUTH_FOOTER_LINK}>
                {AUTH_REGISTER.footerAction}
              </button>
            </p>
          }
        >
          <AuthFormHeading title={AUTH_REGISTER.title} subtitle={AUTH_REGISTER.subtitle} />

          {(pendingName || pendingEmail) && (
            <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-center">
              <p className="text-sm font-semibold text-slate-800">{pendingName || pendingEmail}</p>
              {pendingName && pendingEmail ? (
                <p className="mt-0.5 truncate text-xs text-slate-500">{pendingEmail}</p>
              ) : null}
            </div>
          )}

          <AuthFormDivider />

          {legalLoadError ? <AuthFormAlert message={legalLoadError} /> : null}

          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 px-3 py-3">
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                className={`mt-0.5 size-4 shrink-0 rounded border-gray-300 ${TW_AUTH_CHECKBOX}`}
                checked={legalAccepted}
                onChange={(e) => setLegalAccepted(e.target.checked)}
                disabled={!legalReady}
              />
              <span className="text-xs leading-relaxed text-slate-600">
                {AUTH_REGISTER.legalCheckboxCombined}
              </span>
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 pl-6">
              <button
                type="button"
                onClick={() => setOpenLegalModal("terms")}
                disabled={!legalReady}
                className={`text-xs font-semibold ${TW_AUTH_LEGAL_LINK}`}
              >
                {AUTH_REGISTER.readTerms}
              </button>
              <span className="text-xs text-slate-300" aria-hidden>
                ·
              </span>
              <button
                type="button"
                onClick={() => setOpenLegalModal("privacy")}
                disabled={!legalReady}
                className={`text-xs font-semibold ${TW_AUTH_LEGAL_LINK}`}
              >
                {AUTH_REGISTER.readPrivacy}
              </button>
            </div>
          </div>

          <div className="mt-auto space-y-4 pt-8">
            {submitError ? <AuthFormAlert message={submitError} /> : null}

            <Button
              type="button"
              disabled={!canCreateAccount}
              onClick={() => void handleCreateAccount()}
              className={`h-12 w-full rounded-2xl ${TW_UTOPP_GRADIENT_R} text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all duration-300 hover:brightness-105 active:scale-[0.98]`}
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                AUTH_ENTRY.createAccount
              )}
            </Button>
          </div>
        </AuthFormShell>
      </>
    )
  }

  return (
    <AuthFormShell
      tall
      footer={
        <p className="text-center text-xs leading-relaxed text-slate-400">
          ¿Primera vez en Utopp?
          <br />
          Continúa con Google para crear tu cuenta.
        </p>
      }
    >
      <AuthFormHeading
        title={AUTH_ENTRY.title}
        subtitle={AUTH_ENTRY.subtitle}
      />

      {(accessDenied || submitError) && (
        <div className="mt-5 space-y-3">
          {accessDenied ? <AuthFormAlert message={AUTH_UTEC.accessDenied} /> : null}
          {submitError ? <AuthFormAlert message={submitError} /> : null}
        </div>
      )}

      <div className="mt-6">
        <button
          type="button"
          onClick={() => {
            window.location.href = getGoogleOAuthLoginUrl()
          }}
          className={`flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:shadow-md active:scale-[0.99] ${TW_AUTH_FOCUS_RING}`}
        >
          <GoogleMark />
          {AUTH_ENTRY.continueWithGoogle}
        </button>
      </div>

      <AuthFormDivider label={AUTH_ENTRY.dividerLabel} />

      <section className="flex flex-1 flex-col">
        <form onSubmit={(event) => void handleEmailLogin(event)} className="space-y-4">
          <EmailInput
            value={email}
            onChange={setEmail}
            placeholder="alumno@utec.edu.pe"
            autoComplete="username"
          />
          <PasswordInput
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />

          <div className="pt-1">
            <Button
              type="submit"
              disabled={isLoggingIn}
              className={`h-12 w-full rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99] disabled:opacity-60 ${TW_AUTH_FOCUS_RING}`}
            >
              {isLoggingIn ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-violet-600" />
              ) : (
                AUTH_LOGIN.submitLabel
              )}
            </Button>
          </div>
        </form>
      </section>
    </AuthFormShell>
  )
}

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
import { EmailInput } from "../../features/auth/components/EmailInput"
import { PasswordInput } from "../../features/auth/components/PasswordInput"
import {
  AuthFormAlert,
  GoogleMark,
} from "../../features/auth/components/AuthFormShell"
import {
  AUTH_ENTRY,
  AUTH_ENTRY_NEW,
  AUTH_LOGIN,
  AUTH_REGISTER,
  AUTH_UTEC,
} from "../../features/auth/constants/authCopy"
import { ProfileAvatar } from "../../features/profile/components/ProfileAvatar"
import { parseAuthApiError } from "../../shared/lib/apiErrors"
import {
  canonicalizeUtoppFormularioUrl,
  getRememberedUtoppFormularioReturnUrl,
  isAllowedUtoppFormularioUrl,
  rememberUtoppFormularioReturnUrl,
  redirectToUtoppFormularioSso,
} from "../../shared/lib/utoppFormularioUrl"
import { TW_AUTH } from "../../features/auth/constants/authTheme"

type AuthErrorCode = "access_denied" | "not_utec_email" | "session_expired"

function resolveErrorMessage(errorCode: string | null): string | null {
  if (errorCode === "not_utec_email") return AUTH_UTEC.notUtecEmail
  if (errorCode === "access_denied") return AUTH_UTEC.oauthFailed
  if (errorCode === "session_expired") return AUTH_UTEC.sessionExpired
  return null
}

export default function AuthEntry() {
  const navigate = useNavigate()
  const { status, user, refreshSession } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const errorCode = searchParams.get("error") as AuthErrorCode | null
  const googleRegisterParam = searchParams.get("google_register") === "1"
  const pendingToken = searchParams.get("pending_token")
  const formularioRedirect = searchParams.get("redirect")

  const [registerMode, setRegisterMode] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [rememberedFormularioRedirect, setRememberedFormularioRedirect] = useState<string | null>(null)
  const [pendingEmail, setPendingEmail] = useState("")
  const [pendingName, setPendingName] = useState("")
  const [pendingPictureUrl, setPendingPictureUrl] = useState<string | null>(null)
  const [termsDoc, setTermsDoc] = useState<TermsCurrent | null>(null)
  const [privacyDoc, setPrivacyDoc] = useState<TermsCurrent | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [openLegalModal, setOpenLegalModal] = useState<LegalDocKind | null>(null)
  const [legalLoadError, setLegalLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [checkingPending, setCheckingPending] = useState(true)
  const [returningToFormulario, setReturningToFormulario] = useState(false)
  const [formularioReturnFailed, setFormularioReturnFailed] = useState(false)

  const errorMessage = resolveErrorMessage(errorCode)
  const formularioReturnTarget = isAllowedUtoppFormularioUrl(formularioRedirect)
    ? canonicalizeUtoppFormularioUrl(formularioRedirect)
    : googleRegisterParam
      ? rememberedFormularioRedirect
      : null
  const canReturnToFormulario = isAllowedUtoppFormularioUrl(formularioReturnTarget)
  const legalReady = !!termsDoc && !!privacyDoc && !legalLoadError
  const canCreateAccount =
    legalReady && termsAccepted && privacyAccepted && !isSubmitting

  useEffect(() => {
    if (isAllowedUtoppFormularioUrl(formularioRedirect)) {
      rememberUtoppFormularioReturnUrl(formularioRedirect)
      setRememberedFormularioRedirect(formularioRedirect)
      return
    }
    setRememberedFormularioRedirect(getRememberedUtoppFormularioReturnUrl())
  }, [formularioRedirect])

  const loadPendingState = useCallback(async () => {
    setCheckingPending(true)
    try {
      const pending = await fetchGoogleOAuthPending(pendingToken)
      if (pending.pending) {
        setRegisterMode(true)
        setPendingEmail(pending.email ?? "")
        setPendingName(pending.full_name ?? "")
        setPendingPictureUrl(pending.picture_url ?? null)
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

  const handleRetry = () => {
    setSubmitError(null)
    const next = new URLSearchParams(searchParams)
    next.delete("error")
    next.delete("google_register")
    next.delete("pending_token")
    setSearchParams(next, { replace: true })
    setRegisterMode(false)
    setShowEmailForm(false)
  }

  const handleCancelRegister = async () => {
    try {
      await cancelGoogleOAuthPending()
    } catch {
      /* ignore */
    }
    setRegisterMode(false)
    setTermsAccepted(false)
    setPrivacyAccepted(false)
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
      if (canReturnToFormulario && !me.needs_terms && me.onboarding_completed) {
        setFormularioReturnFailed(false)
        setReturningToFormulario(true)
        await redirectToUtoppFormularioSso(formularioReturnTarget)
        return
      }
      redirectAfterAuthSession(navigate, me)
    } catch (err) {
      setSubmitError(parseAuthApiError(err))
      setReturningToFormulario(false)
      setFormularioReturnFailed(canReturnToFormulario)
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleCreateAccount = async () => {
    if (!legalReady || !termsDoc || !privacyDoc) return
    if (!termsAccepted || !privacyAccepted) {
      setSubmitError(AUTH_REGISTER.legalAcceptRequired)
      return
    }

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
      if (canReturnToFormulario && !me.needs_terms && me.onboarding_completed) {
        setFormularioReturnFailed(false)
        setReturningToFormulario(true)
        await redirectToUtoppFormularioSso(formularioReturnTarget)
        return
      }
      redirectAfterAuthSession(navigate, me)
    } catch (err) {
      setSubmitError(parseAuthApiError(err))
      setReturningToFormulario(false)
      setFormularioReturnFailed(canReturnToFormulario)
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (
      status !== "authenticated" ||
      !user ||
      !canReturnToFormulario ||
      returningToFormulario ||
      formularioReturnFailed ||
      user.needs_terms ||
      !user.onboarding_completed
    ) {
      return
    }

    setReturningToFormulario(true)
    setFormularioReturnFailed(false)
    redirectToUtoppFormularioSso(formularioReturnTarget).catch((err) => {
      setSubmitError(parseAuthApiError(err))
      setFormularioReturnFailed(true)
      setReturningToFormulario(false)
    })
  }, [canReturnToFormulario, formularioReturnTarget, formularioReturnFailed, returningToFormulario, status, user])

  if (status === "initializing" || checkingPending || returningToFormulario) {
    return (
      <AuthPanel>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-white/10"
            style={{ borderTopColor: "#6D5DFC" }}
          />
          <p className={`text-sm ${TW_AUTH.muted}`}>Verificando sesión...</p>
        </div>
      </AuthPanel>
    )
  }

  if (status === "authenticated") {
    if (canReturnToFormulario && user && !user.needs_terms && user.onboarding_completed && !formularioReturnFailed) {
      return (
        <AuthPanel>
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
            <div
              className="h-8 w-8 animate-spin rounded-full border-2 border-white/10"
              style={{ borderTopColor: "#6D5DFC" }}
            />
            <p className={`text-sm ${TW_AUTH.muted}`}>Volviendo a Utopp Formulario...</p>
          </div>
        </AuthPanel>
      )
    }

    if (canReturnToFormulario && user && formularioReturnFailed) {
      return (
        <AuthPanel>
          <div className="space-y-6">
            <AuthHeader
              title="No pudimos volver a Utopp Formulario"
              subtitle="Tu sesión en Utopp está iniciada, pero el retorno automático falló."
            />
            {submitError && <AuthFormAlert message={submitError} />}
            <button
              type="button"
              onClick={() => redirectAfterAuthSession(navigate, user)}
              className={`w-full ${TW_AUTH.btnPrimary} ${TW_AUTH.focusRing}`}
            >
              Continuar en Utopp
            </button>
          </div>
        </AuthPanel>
      )
    }
    return <Navigate to="/" replace />
  }

  if (errorMessage && !registerMode) {
    return (
      <AuthPanel>
        <div className="space-y-6">
          <AuthHeader
            title="No pudimos iniciar tu sesión"
            subtitle="Intenta de nuevo con tu cuenta institucional"
          />
          <AuthFormAlert message={errorMessage} />
          <button
            type="button"
            onClick={handleRetry}
            className={`w-full ${TW_AUTH.btnPrimary} ${TW_AUTH.focusRing}`}
          >
            {AUTH_UTEC.retry}
          </button>
        </div>
      </AuthPanel>
    )
  }

  if (registerMode) {
    const displayName = pendingName || pendingEmail
    return (
      <AuthPanel>
        <LegalContentModal
          kind={openLegalModal}
          mode="read"
          document={
            openLegalModal === "terms"
              ? termsDoc
              : openLegalModal === "privacy"
                ? privacyDoc
                : null
          }
          onClose={() => setOpenLegalModal(null)}
        />

        <div className="space-y-6">
          <div className="flex flex-col items-center text-center">
            <ProfileAvatar
              name={displayName}
              imageUrl={pendingPictureUrl}
              size="md"
              className="mb-4"
            />
            <h1 className={`text-[2rem] font-bold leading-tight ${TW_AUTH.heading}`}>
              {pendingName
                ? AUTH_ENTRY_NEW.registerWelcome(pendingName)
                : AUTH_ENTRY_NEW.registerWelcomeGeneric}
            </h1>
            {pendingEmail ? (
              <p className={`mt-1 text-sm ${TW_AUTH.muted}`}>{pendingEmail}</p>
            ) : null}
          </div>

          {legalLoadError ? <AuthFormAlert message={legalLoadError} /> : null}

          <div className={TW_AUTH.legalBox}>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className={TW_AUTH.checkbox}
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                disabled={!legalReady}
              />
              <span className={`text-sm ${TW_AUTH.subtitle}`}>{AUTH_ENTRY_NEW.termsCheckbox}</span>
            </label>
            <button
              type="button"
              onClick={() => setOpenLegalModal("terms")}
              disabled={!legalReady}
              className={`pl-7 text-left text-sm font-semibold ${TW_AUTH.link} ${TW_AUTH.focusRing}`}
            >
              {AUTH_ENTRY_NEW.readTerms}
            </button>

            <label className="flex cursor-pointer items-start gap-3 pt-1">
              <input
                type="checkbox"
                className={TW_AUTH.checkbox}
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                disabled={!legalReady}
              />
              <span className={`text-sm ${TW_AUTH.subtitle}`}>{AUTH_ENTRY_NEW.privacyCheckbox}</span>
            </label>
            <button
              type="button"
              onClick={() => setOpenLegalModal("privacy")}
              disabled={!legalReady}
              className={`pl-7 text-left text-sm font-semibold ${TW_AUTH.link} ${TW_AUTH.focusRing}`}
            >
              {AUTH_ENTRY_NEW.readPrivacy}
            </button>
          </div>

          {submitError ? <AuthFormAlert message={submitError} /> : null}

          <button
            type="button"
            disabled={!canCreateAccount}
            onClick={() => void handleCreateAccount()}
            className={`w-full ${TW_AUTH.btnPrimary} ${TW_AUTH.focusRing}`}
          >
            {isSubmitting ? AUTH_ENTRY_NEW.creatingAccount : AUTH_ENTRY_NEW.createAccount}
          </button>

          <button
            type="button"
            onClick={() => void handleCancelRegister()}
            className={`w-full text-center text-sm font-medium ${TW_AUTH.muted} transition-colors duration-200 hover:text-white ${TW_AUTH.focusRing}`}
          >
            {AUTH_ENTRY_NEW.cancelRegister}
          </button>
        </div>
      </AuthPanel>
    )
  }

  return (
    <AuthPanel>
      <div className="space-y-6">
        <AuthHeader title={AUTH_ENTRY_NEW.title} subtitle={AUTH_ENTRY_NEW.subtitle} />

        {submitError ? <AuthFormAlert message={submitError} /> : null}

        <button
          type="button"
          onClick={() => {
            if (canReturnToFormulario) {
              rememberUtoppFormularioReturnUrl(formularioReturnTarget)
            }
            window.location.href = getGoogleOAuthLoginUrl()
          }}
          className={`${TW_AUTH.btnGoogle} ${TW_AUTH.focusRing}`}
        >
          <GoogleMark />
          {AUTH_ENTRY_NEW.continueWithGoogle}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowEmailForm((prev) => !prev)}
            className={`text-sm font-medium ${TW_AUTH.link} ${TW_AUTH.focusRing}`}
          >
            {showEmailForm ? AUTH_ENTRY_NEW.emailFallbackHide : AUTH_ENTRY_NEW.emailFallbackPrompt}
          </button>
        </div>

        {showEmailForm ? (
          <form
            onSubmit={(event) => void handleEmailLogin(event)}
            className="space-y-4 border-t border-white/[0.08] pt-6"
          >
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
            <button
              type="submit"
              disabled={isLoggingIn}
              className={`w-full ${TW_AUTH.btnSecondary} ${TW_AUTH.focusRing}`}
            >
              {isLoggingIn ? "Iniciando sesión..." : AUTH_LOGIN.submitLabel}
            </button>
          </form>
        ) : null}
      </div>
    </AuthPanel>
  )
}

function AuthPanel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`w-full max-w-[30rem] p-6 sm:p-8 md:p-10 ${TW_AUTH.card} ${TW_AUTH.cardTransition} auth-fade-in`}
    >
      {children}
    </div>
  )
}

function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center">
      <h1 className={`text-[2rem] font-bold leading-tight ${TW_AUTH.heading}`}>{title}</h1>
      <p className={`mt-2 text-base leading-relaxed ${TW_AUTH.subtitle}`}>{subtitle}</p>
    </div>
  )
}

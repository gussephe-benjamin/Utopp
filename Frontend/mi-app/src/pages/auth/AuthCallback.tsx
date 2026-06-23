import { useEffect, useRef } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { exchangeSessionToken, getMe } from "../../api/auth.api"
import { useAuth } from "../../auth/useAuth"
import { redirectAfterAuthSession } from "../../auth/postAuthRedirect"
import { AUTH_CALLBACK } from "../../features/auth/constants/authCopy"
import { TW_AUTH } from "../../features/auth/constants/authTheme"
import { UTOPP_LOGO_SRC } from "../../shared/constants/brand"

export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { refreshSession } = useAuth()
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const sessionToken = searchParams.get("session_token")
    if (!sessionToken) {
      navigate("/login", { replace: true })
      return
    }

    const cleanUrl = () => {
      window.history.replaceState({}, "", "/auth/callback")
    }
    cleanUrl()

    ;(async () => {
      try {
        await exchangeSessionToken(sessionToken)
        await refreshSession()
        const me = await getMe()
        redirectAfterAuthSession(navigate, me)
      } catch {
        navigate("/login?error=session_expired", { replace: true })
      }
    })()
  }, [navigate, refreshSession, searchParams])

  return (
    <div className={`flex min-h-screen flex-col items-center justify-center ${TW_AUTH.pageBg} px-4`}>
      <div className="flex flex-col items-center gap-4 text-center auth-fade-in">
        <img src={UTOPP_LOGO_SRC} alt="" aria-hidden className="h-10 w-10 object-contain opacity-90" />
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-white/10"
          style={{ borderTopColor: "#6D5DFC" }}
        />
        <p className={`text-sm ${TW_AUTH.subtitle}`}>{AUTH_CALLBACK.loading}</p>
      </div>
    </div>
  )
}

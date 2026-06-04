import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { getLoginEmail, setLoginEmail } from "../../auth/loginEmailStorage";
import { login as apiLogin } from "../../api/auth.api";
import { redirectAfterAuthSession } from "../../auth/postAuthRedirect";
import { AlertCircle, Check, CheckCircle2 } from "lucide-react";
import GoogleLogin from "../../auth/GoogleLogin";
import { AuthDivider } from "../../features/auth/components/AuthDivider";
import { EmailInput } from "../../features/auth/components/EmailInput";
import { PasswordInput } from "../../features/auth/components/PasswordInput";
import { TransitionLink } from "../../features/auth/components/TransitionLink";
import { parseAuthApiError } from "../../shared/lib/apiErrors";
import {
  TW_AUTH_FOCUS_RING,
  TW_UTOPP_GRADIENT_R,
} from "../../shared/constants/brand";
import { AUTH_LOGIN } from "../../features/auth/constants/authCopy";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const registeredEmail =
    (location.state as { registeredEmail?: string } | null)?.registeredEmail ?? "";

  const [email, setEmail] = useState(() => registeredEmail || getLoginEmail());
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (registeredEmail) {
      setLoginEmail(registeredEmail);
    }
  }, [registeredEmail]);

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const emailEmpty = email.trim().length === 0;
  const passwordEmpty = password.length === 0;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitAttempted(true);
    if (emailEmpty || passwordEmpty) return;

    setIsLoading(true);
    setError(null);
    setLoginEmail(email);

    try {
      const data = await apiLogin(email, password);
      login(data.access_token);
      setSuccess(true);
      setTimeout(() => {
        void redirectAfterAuthSession(navigate, { replace: false });
      }, 600);
    } catch (err) {
      setError(parseAuthApiError(err));
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
          <div className="auth-panel-header text-center">
            <h2 className="text-2xl font-bold text-[#9333EA]">{AUTH_LOGIN.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{AUTH_LOGIN.subtitle}</p>
          </div>

          {registeredEmail && !error && (
            <div
              className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3"
              role="status"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  {AUTH_LOGIN.registeredBannerTitle}
                </p>
                <p className="mt-0.5 text-xs text-green-700">
                  {AUTH_LOGIN.registeredBannerBody}
                </p>
              </div>
            </div>
          )}

          <GoogleLogin />

          <AuthDivider label={AUTH_LOGIN.dividerLabel} />

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <EmailInput
              value={email}
              onChange={(value) => {
                setEmail(value);
                setLoginEmail(value);
                if (error) setError(null);
              }}
              error={submitAttempted && emailEmpty ? "Ingresa tu correo institucional." : null}
            />

            <PasswordInput
              value={password}
              onChange={(value) => {
                setPassword(value);
                if (error) setError(null);
              }}
              error={submitAttempted && passwordEmpty ? "Ingresa tu contraseña." : null}
            />

            {error && (
              <div
                className="auth-shake flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                role="alert"
              >
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                <p className="text-sm leading-snug text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || success}
              className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl ${
                success ? "bg-gradient-to-r from-[#2f55f6] to-[#ba4ef8]" : TW_UTOPP_GRADIENT_R
              } font-semibold text-white shadow-lg shadow-[#9333EA]/25 transition-all duration-200 hover:brightness-105 active:scale-[0.98] disabled:opacity-80 motion-reduce:transition-none ${TW_AUTH_FOCUS_RING}`}
            >
              {success ? (
                <>
                  <Check className="h-5 w-5" aria-hidden />
                  <span>¡Entrando!</span>
                </>
              ) : isLoading ? (
                <span
                  className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:animate-none"
                  aria-hidden
                />
              ) : (
                AUTH_LOGIN.submitLabel
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500">
            {AUTH_LOGIN.footerQuestion}{" "}
            <TransitionLink
              to="/register"
              className="font-medium text-violet-600 hover:text-violet-700 hover:underline"
            >
              {AUTH_LOGIN.footerAction}
            </TransitionLink>
          </p>
    </div>
  );
}

import { GoogleLogin } from "@react-oauth/google";
import { TW_AUTH_FOCUS_RING } from "../../../shared/constants/brand";
import { AUTH_GOOGLE, AUTH_LOGIN } from "../constants/authCopy";

type GoogleButtonProps = {
  onSuccess: (credential: string) => void | Promise<void>;
  onError?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
  variant?: "login" | "register";
  /** Muestra el microcopy "Recomendado si creaste tu cuenta con Google". */
  recommended?: boolean;
};

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

/**
 * Botón "Continuar con Google" con estilo de marca.
 * Mantiene el widget oficial de @react-oauth/google como capa transparente
 * superpuesta (necesario para obtener el ID token), mientras muestra el botón
 * visible con borde sutil y hover. Sigue las brand guidelines de Google.
 */
export function GoogleButton({
  onSuccess,
  onError,
  disabled = false,
  isLoading = false,
  loadingLabel = AUTH_GOOGLE.connecting,
  variant = "login",
  recommended = false,
}: GoogleButtonProps) {
  const blocked = disabled || isLoading;

  const handleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential || blocked) return;
    await onSuccess(credentialResponse.credential);
  };

  if (isLoading) {
    return (
      <div className="flex w-full flex-col gap-2">
        <div
          className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 opacity-70 shadow-sm"
          aria-busy="true"
          aria-live="polite"
        >
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-violet-300 border-t-violet-600 motion-reduce:animate-none"
            aria-hidden
          />
          <span className="auth-ellipsis">{loadingLabel.replace(/\.+$/, "")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="group relative w-full">
        <div
          className={`pointer-events-none flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-[rgba(148,163,184,0.3)] bg-white px-4 text-sm font-medium text-slate-800 shadow-sm transition-all duration-200 group-hover:scale-[1.01] group-hover:shadow-md motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${TW_AUTH_FOCUS_RING}`}
          aria-hidden
        >
          <GoogleIcon />
          <span>{AUTH_GOOGLE.continue}</span>
        </div>

        <div
          className={`absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl ${
            blocked ? "pointer-events-none opacity-0" : "opacity-[0.011]"
          }`}
        >
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={onError}
            type="standard"
            theme="outline"
            size="large"
            text={variant === "register" ? "signup_with" : "continue_with"}
            shape="rectangular"
            width="400"
          />
        </div>
      </div>

      {recommended && (
        <p className="text-center text-xs text-slate-400">{AUTH_LOGIN.googleHint}</p>
      )}
    </div>
  );
}

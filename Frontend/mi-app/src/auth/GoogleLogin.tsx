import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { useState } from "react";
import { googleLogin } from "../api/auth.api";
import { redirectAfterAuthSession } from "./postAuthRedirect";
import { GoogleButton } from "../features/auth/components/GoogleButton";
import { AUTH_GOOGLE } from "../features/auth/constants/authCopy";

export default function GoogleLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSuccess = async (credential: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await googleLogin(credential);
      login(data.access_token);
      await redirectAfterAuthSession(navigate);
    } catch (err) {
      console.error("Error en Google login:", err);
      setError("No se pudo iniciar sesión con Google. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <GoogleButton
        variant="login"
        recommended
        isLoading={isLoading}
        loadingLabel={AUTH_GOOGLE.validatingLogin}
        onSuccess={handleGoogleSuccess}
        onError={() => setError("Login con Google falló. Intenta de nuevo.")}
      />
      {error && (
        <p className="text-center text-xs text-red-600" role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}

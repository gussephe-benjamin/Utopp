import { GoogleLogin as GoogleLoginButton } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { useState } from "react";
import { googleLogin } from "../api/auth.api";
import { redirectAfterAuthSession } from "./postAuthRedirect";

export default function GoogleLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return;

    setIsLoading(true);
    setError(null);
    try {
      // Usa el interceptor de axios (base URL, headers, refresh automático)
      const data = await googleLogin(credentialResponse.credential);
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
    <div className="flex flex-col items-center gap-3 w-full">
      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
          <span>Validando con Google...</span>
        </div>
      ) : (
        <GoogleLoginButton
          onSuccess={handleGoogleSuccess}
          onError={() => setError("Login con Google falló. Intenta de nuevo.")}
        />
      )}
      {error && <p className="text-red-500 text-xs text-center">{error}</p>}
    </div>
  );
}

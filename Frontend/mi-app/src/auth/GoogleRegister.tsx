import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { useState } from "react";
import { googleRegister } from "../api/auth.api";

export default function GoogleRegister() {
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
      const data = await googleRegister(credentialResponse.credential);
      login(data.access_token);
      navigate("/onboarding", { replace: true });
    } catch (err: unknown) {
      console.error("Error en Google register:", err);
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      const detail = axiosErr?.response?.data?.detail;
      if (detail?.includes("ya está registrado")) {
        setError("Ya tienes una cuenta. Usa 'Iniciar sesión' con Google.");
      } else {
        setError("No se pudo registrar con Google. Intenta de nuevo.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
          <span>Registrando con Google...</span>
        </div>
      ) : (
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError("Registro con Google falló. Intenta de nuevo.")}
          type="standard"
          theme="outline"
          size="large"
          text="continue_with"
          shape="rectangular"
          logo_alignment="center"
        />
      )}
      {error && <p className="text-red-500 text-xs text-center">{error}</p>}
    </div>
  );
}

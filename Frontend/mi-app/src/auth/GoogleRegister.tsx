import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { useState } from "react";
import { googleRegister } from "../api/auth.api";
import { acceptTerms } from "../api/legal.api";
import { redirectAfterAuthSession } from "./postAuthRedirect";

export interface GoogleRegisterProps {
  /** Id del documento legal vigente; obligatorio para registrar. */
  termsDocumentId: number | null;
  /** El usuario marcó explícitamente la casilla de aceptación. */
  termsAccepted: boolean;
  /** Términos cargados correctamente (no loading ni error). */
  termsReady: boolean;
}

export default function GoogleRegister({
  termsDocumentId,
  termsAccepted,
  termsReady,
}: GoogleRegisterProps) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const blocked = !termsReady || !termsAccepted || termsDocumentId == null;

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential || blocked || termsDocumentId == null) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await googleRegister(credentialResponse.credential);
      login(data.access_token);
      try {
        await acceptTerms(termsDocumentId);
      } catch {
        // Si falla el POST, /auth/me seguirá con needs_terms y redirectAfterAuthSession o la pantalla de términos lo resuelve.
      }
      await redirectAfterAuthSession(navigate);
    } catch (err: unknown) {
      console.error("Error en Google register:", err);
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      const detail = axiosErr?.response?.data?.detail;
      if (typeof detail === "string" && detail.includes("ya está registrado")) {
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
      {!termsReady && (
        <p className="text-gray-500 text-xs text-center">Cargando términos y condiciones…</p>
      )}
      {termsReady && !termsAccepted && (
        <p className="text-amber-700 text-xs text-center">
          Marca la casilla de abajo para aceptar los términos y poder continuar con Google.
        </p>
      )}
      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
          <span>Registrando con Google...</span>
        </div>
      ) : (
        <div
          className={blocked ? "pointer-events-none opacity-40 w-full flex justify-center" : "w-full flex justify-center"}
          aria-disabled={blocked}
        >
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
        </div>
      )}
      {error && <p className="text-red-500 text-xs text-center">{error}</p>}
    </div>
  );
}

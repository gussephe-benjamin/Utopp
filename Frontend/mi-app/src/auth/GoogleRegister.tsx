import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { useState } from "react";
import { googleRegister } from "../api/auth.api";
import { getCurrentPrivacy, getCurrentTerms } from "../api/legal.api";
import { redirectAfterAuthSession } from "./postAuthRedirect";

export interface GoogleRegisterProps {
  /** El usuario marcó explícitamente ambas casillas de aceptación. */
  termsAccepted: boolean;
  privacyAccepted: boolean;
  /** Ambos documentos legales cargaron correctamente. */
  legalReady: boolean;
}

export default function GoogleRegister({
  termsAccepted,
  privacyAccepted,
  legalReady,
}: GoogleRegisterProps) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const blocked = !legalReady || !termsAccepted || !privacyAccepted;

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential || blocked) return;

    setIsLoading(true);
    setError(null);
    try {
      const termsFresh = await getCurrentTerms();
      const privacyFresh = await getCurrentPrivacy();
      const data = await googleRegister(
        credentialResponse.credential,
        termsFresh.id,
        privacyFresh.id
      );
      login(data.access_token);
      await redirectAfterAuthSession(navigate);
    } catch (err: unknown) {
      console.error("Error en Google register:", err);
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      const detail = axiosErr?.response?.data?.detail;
      if (typeof detail === "string" && detail.includes("ya está registrado")) {
        setError("Ya tienes una cuenta. Usa 'Iniciar sesión' con Google.");
      } else if (
        typeof detail === "string" &&
        detail.includes("documentos legales")
      ) {
        setError("Los textos legales se actualizaron. Recarga la página y vuelve a intentarlo.");
      } else {
        setError("No se pudo registrar con Google. Intenta de nuevo.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {!legalReady && (
        <p className="text-gray-500 text-xs text-center">Cargando términos y política de privacidad…</p>
      )}
      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-[#9333EA] rounded-full animate-spin" />
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

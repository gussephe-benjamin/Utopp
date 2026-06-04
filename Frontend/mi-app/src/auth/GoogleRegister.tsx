import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { useState } from "react";
import { googleRegister } from "../api/auth.api";
import { getCurrentPrivacy, getCurrentTerms } from "../api/legal.api";
import { redirectAfterAuthSession } from "./postAuthRedirect";
import { GoogleButton } from "../features/auth/components/GoogleButton";
import { AUTH_GOOGLE } from "../features/auth/constants/authCopy";

export interface GoogleRegisterProps {
  /** Ambos documentos legales cargaron correctamente. */
  legalReady: boolean;
}

export default function GoogleRegister({ legalReady }: GoogleRegisterProps) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSuccess = async (credential: string) => {
    if (!legalReady) return;

    setIsLoading(true);
    setError(null);
    try {
      const termsFresh = await getCurrentTerms();
      const privacyFresh = await getCurrentPrivacy();
      const data = await googleRegister(
        credential,
        termsFresh.id,
        privacyFresh.id,
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
    <div className="flex w-full flex-col gap-3">
      {!legalReady && (
        <p className="text-center text-xs text-gray-500" aria-live="polite">
          Cargando términos y política de privacidad…
        </p>
      )}
      <GoogleButton
        variant="register"
        disabled={!legalReady}
        isLoading={isLoading}
        loadingLabel={AUTH_GOOGLE.registering}
        onSuccess={handleGoogleSuccess}
        onError={() => setError("Registro con Google falló. Intenta de nuevo.")}
      />
      {error && (
        <p className="text-center text-xs text-red-600" role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}

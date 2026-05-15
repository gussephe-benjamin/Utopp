import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GoogleRegister from "../../auth/GoogleRegister";
import { AuthScreenLayout } from "../../shared/layout/AuthScreenLayout";
import { getCurrentPrivacy, getCurrentTerms, type TermsCurrent } from "../../api/legal.api";
import {
  TW_AUTH_CHECKBOX,
  TW_AUTH_FOOTER_LINK,
  TW_AUTH_HEADING,
  TW_AUTH_LEGAL_LINK,
} from "../../shared/constants/brand";

export default function RegisterOG() {
  const navigate = useNavigate();
  const [termsDoc, setTermsDoc] = useState<TermsCurrent | null>(null);
  const [privacyDoc, setPrivacyDoc] = useState<TermsCurrent | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [t, p] = await Promise.all([getCurrentTerms(), getCurrentPrivacy()]);
        if (!cancelled) {
          setTermsDoc(t);
          setPrivacyDoc(p);
        }
      } catch {
        if (!cancelled) {
          setLoadError("No se pudieron cargar los textos legales. Recarga la página o intenta más tarde.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const legalReady = !!termsDoc && !!privacyDoc && !loadError;

  return (
    <AuthScreenLayout>
      <div className="bg-white rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <h1 className={`text-2xl font-bold ${TW_AUTH_HEADING}`}>Crear cuenta</h1>
          <p className="text-gray-500 text-sm">Únete a la comunidad Utopp</p>
        </div>

        {loadError && (
          <p className="text-red-600 text-sm text-center mb-4">{loadError}</p>
        )}

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-400">utopp</span>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className={`mt-0.5 size-4 rounded border-gray-300 ${TW_AUTH_CHECKBOX}`}
              checked={termsChecked}
              onChange={(e) => setTermsChecked(e.target.checked)}
              disabled={!legalReady}
            />
            <span className="text-sm text-gray-700">
              He leído y acepto los{" "}
              <Link
                to="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className={TW_AUTH_LEGAL_LINK}
              >
                términos y condiciones
              </Link>
              .
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className={`mt-0.5 size-4 rounded border-gray-300 ${TW_AUTH_CHECKBOX}`}
              checked={privacyChecked}
              onChange={(e) => setPrivacyChecked(e.target.checked)}
              disabled={!legalReady}
            />
            <span className="text-sm text-gray-700">
              He leído y acepto la{" "}
              <Link
                to="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className={TW_AUTH_LEGAL_LINK}
              >
                política de datos y privacidad
              </Link>
              .
            </span>
          </label>
        </div>

        <GoogleRegister
          termsAccepted={termsChecked}
          privacyAccepted={privacyChecked}
          legalReady={legalReady}
        />

        <p className="text-center mt-6 text-gray-500 text-sm">
          ¿Ya tienes cuenta?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className={TW_AUTH_FOOTER_LINK}
          >
            Inicia sesión
          </button>
        </p>
      </div>
    </AuthScreenLayout>
  );
}

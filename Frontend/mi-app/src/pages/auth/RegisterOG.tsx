import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GoogleRegister from "../../auth/GoogleRegister";
import { AuthScreenLayout } from "../../shared/layout/AuthScreenLayout";
import { getCurrentTerms, type TermsCurrent } from "../../api/legal.api";

export default function RegisterOG() {
  const navigate = useNavigate();
  const [doc, setDoc] = useState<TermsCurrent | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const t = await getCurrentTerms();
        if (!cancelled) setDoc(t);
      } catch {
        if (!cancelled) setLoadError("No se pudieron cargar los términos. Recarga la página o intenta más tarde.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const termsReady = !!doc && !loadError;

  return (
    <AuthScreenLayout>
      <div className="bg-white rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#4F46E5]">Crear cuenta</h1>
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

        <label className="flex items-start gap-3 cursor-pointer mb-6">
          <input
            type="checkbox"
            className="mt-0.5 size-4 rounded border-gray-300 text-[#4F46E5] focus:ring-[#4F46E5]"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            disabled={!termsReady}
          />
          <span className="text-sm text-gray-700">
            He leído y acepto los{" "}
            <Link to="/terms" className="font-semibold text-[#4F46E5] underline underline-offset-2 hover:text-[#4338CA]">
              términos y condiciones
            </Link>
            . Podré volver a aceptar una versión nueva cuando se actualicen.
          </span>
        </label>

        <GoogleRegister
          termsDocumentId={doc?.id ?? null}
          termsAccepted={checked}
          termsReady={termsReady}
        />

        <p className="text-center mt-6 text-gray-500 text-sm">
          ¿Ya tienes cuenta?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-[#4F46E5] font-semibold hover:underline transition-all"
          >
            Inicia sesión
          </button>
        </p>
      </div>
    </AuthScreenLayout>
  );
}

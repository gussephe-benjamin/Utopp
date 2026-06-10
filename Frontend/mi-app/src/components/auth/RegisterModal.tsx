import { useEffect, useState } from "react";
import { X } from "lucide-react";
import GoogleRegister from "../../auth/GoogleRegister";
import { DottedSurface } from "../ui/dotted-surface";
import LegalContentModal, { type LegalDocKind } from "./LegalContentModal";
import {
  getCurrentPrivacy,
  getCurrentTerms,
  type TermsCurrent,
} from "../../api/legal.api";
import {
  TW_AUTH_CHECKBOX,
  TW_AUTH_FOOTER_LINK,
  TW_AUTH_HEADING,
  TW_AUTH_LEGAL_LINK,
  UTOPP_LOGO_SRC,
} from "../../shared/constants/brand";

type RegisterModalProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Modal de registro: mismo estilo y fondo (campo de puntos Utopp) que el login.
 * Sustituye la navegación a `/register`; los enlaces legales abren el contenido
 * completo en otro modal sin salir de aquí.
 */
export default function RegisterModal({ open, onClose }: RegisterModalProps) {
  const [termsDoc, setTermsDoc] = useState<TermsCurrent | null>(null);
  const [privacyDoc, setPrivacyDoc] = useState<TermsCurrent | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  // Qué documento legal mostrar en el modal anidado (null = cerrado).
  const [legalOpen, setLegalOpen] = useState<LegalDocKind | null>(null);

  // Carga de textos legales al abrir.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadError(null);
    (async () => {
      try {
        const [t, p] = await Promise.all([getCurrentTerms(), getCurrentPrivacy()]);
        if (!cancelled) {
          setTermsDoc(t);
          setPrivacyDoc(p);
        }
      } catch {
        if (!cancelled)
          setLoadError(
            "No se pudieron cargar los textos legales. Recarga la página o intenta más tarde.",
          );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Escape para cerrar (solo si no hay modal legal encima) + bloqueo de scroll.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && legalOpen === null) onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, legalOpen]);

  if (!open) return null;

  const legalReady = !!termsDoc && !!privacyDoc && !loadError;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Crear cuenta"
    >
      {/* Fondo: mismo que el login (blanco + campo de puntos Utopp) */}
      <div className="absolute inset-0 bg-slate-50 animate-in fade-in duration-200" />
      <DottedSurface />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(248,250,252,0.85)_85%)]"
      />
      {/* Capa clicable para cerrar */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden />

      {/* Tarjeta */}
      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300">
        <div className="relative bg-white rounded-3xl shadow-2xl p-8">
          {/* Cerrar */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Encabezado */}
          <div className="text-center mb-6">
            <img
              src={UTOPP_LOGO_SRC}
              alt=""
              aria-hidden
              className="h-12 w-12 object-contain mx-auto mb-3"
            />
            <h1 className={`text-2xl font-bold ${TW_AUTH_HEADING}`}>
              Únete a la comunidad
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Comienza en segundos con tu cuenta de Google
            </p>
          </div>

          {loadError && (
            <p className="text-red-600 text-sm text-center mb-4">{loadError}</p>
          )}

          {/* Checkbox único (acepta términos + privacidad) */}
          <label className="flex items-start gap-3 cursor-pointer mb-5">
            <input
              type="checkbox"
              className={`mt-0.5 size-4 rounded border-gray-300 ${TW_AUTH_CHECKBOX}`}
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              disabled={!legalReady}
            />
            <span className="text-sm text-gray-700 leading-relaxed">
              He leído y acepto los{" "}
              <button
                type="button"
                onClick={() => setLegalOpen("terms")}
                className={TW_AUTH_LEGAL_LINK}
              >
                Términos y condiciones
              </button>{" "}
              y la{" "}
              <button
                type="button"
                onClick={() => setLegalOpen("privacy")}
                className={TW_AUTH_LEGAL_LINK}
              >
                Política de Privacidad
              </button>
              .
            </span>
          </label>

          {/* Registro con Google (acepta ambos documentos a la vez) */}
          <GoogleRegister
            legalDocsReady={legalReady}
            legalAccepted={accepted}
          />

          <p className="text-center mt-6 text-gray-500 text-sm">
            ¿Ya tienes cuenta?{" "}
            <button type="button" onClick={onClose} className={TW_AUTH_FOOTER_LINK}>
              Inicia sesión
            </button>
          </p>
        </div>
      </div>

      {/* Modal anidado con el contenido legal completo */}
      <LegalContentModal kind={legalOpen} onClose={() => setLegalOpen(null)} />
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  getCurrentPrivacy,
  getCurrentTerms,
  type TermsCurrent,
} from "../../api/legal.api";
import LegalMarkdownBody from "../legal/LegalMarkdownBody";

export type LegalDocKind = "terms" | "privacy";

type LegalContentModalProps = {
  /** Documento a mostrar; `null` mantiene el modal cerrado. */
  kind: LegalDocKind | null;
  onClose: () => void;
};

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-PE", { dateStyle: "long" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

/**
 * Modal de solo lectura con el contenido legal vigente (términos o privacidad).
 * Reutiliza `LegalMarkdownBody` (mismo render que las páginas /terms y /privacy)
 * pero sin navegar fuera del login.
 */
export default function LegalContentModal({ kind, onClose }: LegalContentModalProps) {
  const open = kind !== null;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<TermsCurrent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const handleReady = useCallback(() => setReady(true), []);

  // Carga del documento al abrir / cambiar de tipo.
  useEffect(() => {
    if (!kind) return;
    let cancelled = false;
    setDoc(null);
    setError(null);
    setReady(false);
    (async () => {
      try {
        const data =
          kind === "terms" ? await getCurrentTerms() : await getCurrentPrivacy();
        if (!cancelled) setDoc(data);
      } catch {
        if (!cancelled)
          setError("No se pudo cargar el documento. Intenta más tarde.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kind]);

  // Cierra con Escape y bloquea el scroll del body mientras está abierto.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [doc?.id]);

  if (!open) return null;

  const fallbackTitle =
    kind === "terms" ? "Términos y condiciones" : "Política de Privacidad";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={fallbackTitle}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden
      />

      {/* Tarjeta */}
      <div className="relative z-10 flex w-full max-w-2xl max-h-[88vh] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#9333EA]">
              UTOPP
            </p>
            <h2 className="text-xl font-bold leading-tight text-slate-900 truncate">
              {doc?.title?.trim() || fallbackTitle}
            </h2>
            {doc && (
              <p className="text-xs text-slate-500 mt-0.5">
                Vigente desde {formatDate(doc.effective_at)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="shrink-0 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo scrolleable con el contenido completo */}
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto px-6 py-5"
        >
          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          )}
          {doc && (
            <LegalMarkdownBody
              markdown={doc.content}
              variant="light"
              onReady={handleReady}
            />
          )}
          {!doc && !error && (
            <p className="text-sm text-slate-500">Cargando texto legal…</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-200 px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={!ready && !error}
            className="inline-flex items-center justify-center rounded-xl bg-[#9333EA] px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

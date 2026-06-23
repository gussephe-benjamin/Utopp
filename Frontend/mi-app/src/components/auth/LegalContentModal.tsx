import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  getCurrentPrivacy,
  getCurrentTerms,
  type TermsCurrent,
} from "../../api/legal.api";
import { AUTH_REGISTER } from "../../features/auth/constants/authCopy";
import LegalMarkdownBody from "../legal/LegalMarkdownBody";

export type LegalDocKind = "terms" | "privacy";

type LegalContentModalProps = {
  /** Documento a mostrar; `null` mantiene el modal cerrado. */
  kind: LegalDocKind | null;
  onClose: () => void;
  /** `read`: solo lectura. `accept`: requiere scroll y confirma aceptación. */
  mode?: "read" | "accept";
  /** Documento precargado (evita re-fetch). */
  document?: TermsCurrent | null;
  /** Llamado al confirmar aceptación en modo `accept`. */
  onAccept?: () => void;
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
 * Modal con contenido legal vigente (términos o privacidad).
 * Modo `accept`: exige scroll al final antes de habilitar "He leído y acepto".
 */
export default function LegalContentModal({
  kind,
  onClose,
  mode = "read",
  document: preloadedDocument,
  onAccept,
}: LegalContentModalProps) {
  const open = kind !== null;
  const isAcceptMode = mode === "accept";
  const scrollRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<TermsCurrent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);

  const handleReady = useCallback(() => setReady(true), []);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const threshold = 8;
    const needsScroll = scrollHeight > clientHeight + threshold;
    const atEnd = !needsScroll || scrollTop + clientHeight >= scrollHeight - threshold;
    setScrolledToEnd(atEnd);
  }, []);

  useEffect(() => {
    if (!kind) return;
    setError(null);
    setReady(false);
    setScrolledToEnd(false);

    if (preloadedDocument) {
      setDoc(preloadedDocument);
      return;
    }

    let cancelled = false;
    setDoc(null);
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
  }, [kind, preloadedDocument]);

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
    setScrolledToEnd(false);
  }, [doc?.id, kind]);

  useEffect(() => {
    if (!open || !ready) return;
    updateScrollState();
  }, [open, ready, updateScrollState]);

  if (!open) return null;

  const fallbackTitle =
    kind === "terms" ? "Términos y condiciones" : "Política de Privacidad";

  const canAccept = isAcceptMode && ready && scrolledToEnd && !error;

  const handleAccept = () => {
    onAccept?.();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={fallbackTitle}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden
      />

      <div className="relative z-10 flex w-full max-w-2xl max-h-[88vh] flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-[#171A23] shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300">
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] px-6 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8B5CF6]">
              UTOPP
            </p>
            <h2 className="text-xl font-bold leading-tight text-white truncate">
              {doc?.title?.trim() || fallbackTitle}
            </h2>
            {doc && (
              <p className="text-xs text-[#8A93A2] mt-0.5">
                Vigente desde {formatDate(doc.effective_at)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="shrink-0 rounded-full p-2 text-[#8A93A2] transition-colors duration-200 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5DFC] focus-visible:ring-offset-2 focus-visible:ring-offset-[#171A23]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          ref={scrollRef}
          onScroll={isAcceptMode ? updateScrollState : undefined}
          className="min-h-0 flex-1 overflow-y-auto px-6 py-5 text-[#B8C0CC]"
        >
          {error && (
            <p className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#FCA5A5]">
              {error}
            </p>
          )}
          {doc && (
            <LegalMarkdownBody
              markdown={doc.content}
              variant="dark"
              onReady={handleReady}
            />
          )}
          {!doc && !error && (
            <p className="text-sm text-[#8A93A2]">Cargando texto legal…</p>
          )}
        </div>

        {isAcceptMode && ready && !scrolledToEnd && !error && (
          <p className="border-t border-white/[0.08] bg-[#6D5DFC]/10 px-6 py-2 text-center text-xs text-[#B8C0CC]">
            {AUTH_REGISTER.scrollToAcceptHint}
          </p>
        )}

        <div
          className={`flex border-t border-white/[0.08] px-6 py-3 ${
            isAcceptMode ? "justify-end gap-3" : "justify-end"
          }`}
        >
          {isAcceptMode ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/[0.08] px-5 py-2 text-sm font-semibold text-[#B8C0CC] transition-colors duration-200 hover:bg-white/[0.04]"
              >
                {AUTH_REGISTER.modalClose}
              </button>
              <button
                type="button"
                onClick={handleAccept}
                disabled={!canAccept}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-[#6D5DFC] to-[#8B5CF6] px-5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {AUTH_REGISTER.acceptLegalInModal}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              disabled={!ready && !error}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-[#6D5DFC] to-[#8B5CF6] px-5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Entendido
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

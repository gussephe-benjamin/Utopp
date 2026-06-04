import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import GoogleRegister from "../../auth/GoogleRegister";
import { TransitionLink } from "../../features/auth/components/TransitionLink";
import { getCurrentPrivacy, getCurrentTerms, type TermsCurrent } from "../../api/legal.api";
import {
  TW_AUTH_LEGAL_LINK,
  TW_UTOPP_GRADIENT_BR,
} from "../../shared/constants/brand";
import { AUTH_REGISTER } from "../../features/auth/constants/authCopy";

export default function RegisterOG() {
  const [, setTermsDoc] = useState<TermsCurrent | null>(null);
  const [, setPrivacyDoc] = useState<TermsCurrent | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [legalReady, setLegalReady] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [legalHighlight, setLegalHighlight] = useState(false);

  useEffect(() => {
    if (legalAccepted) setLegalHighlight(false);
  }, [legalAccepted]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [t, p] = await Promise.all([getCurrentTerms(), getCurrentPrivacy()]);
        if (!cancelled) {
          setTermsDoc(t);
          setPrivacyDoc(p);
          setLegalReady(true);
        }
      } catch {
        if (!cancelled) {
          setLoadError(AUTH_REGISTER.legalLoadError);
          setLegalReady(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
          <div className="auth-panel-header text-center">
            <h2 className="text-2xl font-bold text-slate-900">{AUTH_REGISTER.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{AUTH_REGISTER.subtitle}</p>
          </div>

          {loadError && (
            <p className="text-center text-sm text-red-600" role="alert">
              {loadError}
            </p>
          )}

          <div
            className={`rounded-2xl transition-all duration-300 ${
              legalHighlight
                ? "auth-shake border border-violet-200/80 bg-gradient-to-br from-violet-50 to-fuchsia-50/70 p-4 shadow-sm ring-1 ring-violet-200/70"
                : "border border-transparent p-0"
            }`}
            role={legalHighlight ? "alert" : undefined}
          >
            {legalHighlight && (
              <div className="mb-3 flex items-center gap-2.5">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow-sm ${TW_UTOPP_GRADIENT_BR}`}
                >
                  <ShieldCheck className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {AUTH_REGISTER.legalNudgeTitle}
                  </p>
                  <p className="text-xs leading-snug text-slate-500">
                    {AUTH_REGISTER.legalNudgeBody}
                  </p>
                </div>
              </div>
            )}

            <label className="flex cursor-pointer items-start gap-3">
              <input
                id="register-legal"
                type="checkbox"
                checked={legalAccepted}
                onChange={(e) => setLegalAccepted(e.target.checked)}
                disabled={!legalReady}
                className={`mt-0.5 size-4 shrink-0 rounded border-slate-300 text-[#9333EA] transition-all focus:ring-[#9333EA]/40 ${
                  legalHighlight ? "border-[#9333EA] ring-2 ring-violet-300/70" : ""
                }`}
              />
              <span
                className={`text-sm leading-snug ${
                  legalHighlight ? "font-medium text-slate-700" : "text-slate-600"
                }`}
              >
                {AUTH_REGISTER.legalCheckboxPrefix}{" "}
                <Link to="/terms" className={TW_AUTH_LEGAL_LINK}>
                  {AUTH_REGISTER.termsLabel}
                </Link>{" "}
                {AUTH_REGISTER.legalCheckboxMiddle}{" "}
                <Link to="/privacy" className={TW_AUTH_LEGAL_LINK}>
                  {AUTH_REGISTER.privacyLabel}
                </Link>
                .
              </span>
            </label>
          </div>

          <GoogleRegister
            legalDocsReady={legalReady}
            legalAccepted={legalAccepted}
            onLegalRequired={() => setLegalHighlight(true)}
          />

          <p className="text-center text-sm text-slate-500">
            {AUTH_REGISTER.footerQuestion}{" "}
            <TransitionLink
              to="/login"
              className="font-medium text-violet-600 hover:text-violet-700 hover:underline"
            >
              {AUTH_REGISTER.footerAction}
            </TransitionLink>
          </p>
    </div>
  );
}

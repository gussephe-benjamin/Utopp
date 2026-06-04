import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import GoogleRegister from "../../auth/GoogleRegister";
import { TransitionLink } from "../../features/auth/components/TransitionLink";
import { getCurrentPrivacy, getCurrentTerms, type TermsCurrent } from "../../api/legal.api";
import { TW_AUTH_LEGAL_LINK } from "../../shared/constants/brand";
import { AUTH_REGISTER } from "../../features/auth/constants/authCopy";

export default function RegisterOG() {
  const [, setTermsDoc] = useState<TermsCurrent | null>(null);
  const [, setPrivacyDoc] = useState<TermsCurrent | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [legalReady, setLegalReady] = useState(false);

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

          <GoogleRegister legalReady={legalReady} />

          <p className="text-center text-xs leading-relaxed text-slate-400">
            {AUTH_REGISTER.legalPrefix}{" "}
            <Link to="/terms" className={TW_AUTH_LEGAL_LINK}>
              {AUTH_REGISTER.termsLabel}
            </Link>{" "}
            {AUTH_REGISTER.legalMiddle}{" "}
            <Link to="/privacy" className={TW_AUTH_LEGAL_LINK}>
              {AUTH_REGISTER.privacyLabel}
            </Link>
            .
          </p>

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

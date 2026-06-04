import { useEffect, useState } from "react";
import { Briefcase, CalendarDays, MessageCircle, Sparkles, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  AUTH_BACKGROUND_IMAGE_URL,
  AUTH_LEFT_PANEL_OVERLAY,
  TW_AUTH_BRAND_GRADIENT,
  TW_UTOPP_GRADIENT_TEXT,
  UTOPP_LOGO_SRC,
} from "../../../shared/constants/brand";
import { AUTH_VALUE } from "../constants/authCopy";
import { useAuthShowcase } from "../hooks/useAuthShowcase";
import { AuthLatestEvents } from "./AuthLatestEvents";
import { OrgCarousel } from "./OrgCarousel";

const benefitIcons: LucideIcon[] = [MessageCircle, Sparkles, Users, Briefcase];

function UtoppLogoWhite() {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src={UTOPP_LOGO_SRC}
        alt=""
        aria-hidden
        className="h-9 w-9 object-contain drop-shadow-sm"
      />
      <span className="text-xl font-bold tracking-tight text-white">Utopp</span>
    </div>
  );
}

/** True desde el breakpoint md (768px). Evita montar el showcase (y su fetch) en móvil. */
function useIsMdUp(): boolean {
  const [isMdUp, setIsMdUp] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsMdUp(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isMdUp;
}

function AuthShowcaseSection() {
  const { events, organizations, loading, hasEvents, hasOrganizations } =
    useAuthShowcase();

  if (!loading && !hasEvents && !hasOrganizations) return null;

  return (
    <div className="mt-10 space-y-3">
      {(loading || hasEvents) && (
        <div className="flex items-center gap-2 px-1">
          <CalendarDays className="h-4 w-4 shrink-0 text-white/90" aria-hidden />
          <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
            Últimos eventos
          </p>
        </div>
      )}
      <AuthLatestEvents events={events} loading={loading} />

      {(loading || hasOrganizations) && (
        <div className="flex items-center gap-2 px-1 pt-2">
          <Sparkles className="h-4 w-4 shrink-0 text-white/90" aria-hidden />
          <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
            Organizaciones en Utopp
          </p>
        </div>
      )}
      <OrgCarousel organizations={organizations} loading={loading} />
    </div>
  );
}

type AuthLeftPanelProps = {
  /** Versión compacta para la cabecera en móvil (solo logo + tagline). */
  compact?: boolean;
};

export function AuthLeftPanel({ compact = false }: AuthLeftPanelProps) {
  const isMdUp = useIsMdUp();

  if (compact) {
    return (
      <div className={`relative overflow-hidden ${TW_AUTH_BRAND_GRADIENT} md:hidden`}>
        <div className="absolute inset-0 bg-white/[0.94]" aria-hidden />
        <div className="relative px-6 pt-8 pb-10 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <img src={UTOPP_LOGO_SRC} alt="" aria-hidden className="h-8 w-8 object-contain" />
            <span className={`text-lg font-bold tracking-tight ${TW_UTOPP_GRADIENT_TEXT}`}>
              Utopp
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-900">{AUTH_VALUE.headline}</p>
          <p className="mt-1 text-xs text-gray-600">{AUTH_VALUE.mobileTagline}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex h-full flex-col justify-center overflow-hidden px-8 py-12 lg:px-12 xl:px-16 ${TW_AUTH_BRAND_GRADIENT}`}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `${AUTH_LEFT_PANEL_OVERLAY}, url("${AUTH_BACKGROUND_IMAGE_URL.replace(/"/g, '\\"')}")`,
          backgroundSize: "cover, cover",
          backgroundPosition: "center, center",
        }}
        aria-hidden
      />

      <div className="relative z-10 max-w-lg">
        <div className="mb-10">
          <UtoppLogoWhite />
        </div>

        <h1
          className="font-bold leading-tight tracking-tight text-white"
          style={{ fontSize: "clamp(1.75rem, 2.5vw, 2.25rem)" }}
        >
          {AUTH_VALUE.headline}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-white/75">
          {AUTH_VALUE.subheadline}
        </p>

        <ul className="mt-8 space-y-3.5">
          {AUTH_VALUE.benefits.map((benefit, index) => {
            const Icon = benefitIcons[index] ?? MessageCircle;
            return (
              <li key={benefit} className="flex items-center gap-3 text-[0.9375rem] text-white">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
                  <Icon className="h-5 w-5 text-white/90" aria-hidden />
                </span>
                <span className="font-medium">{benefit}</span>
              </li>
            );
          })}
        </ul>

        {isMdUp && <AuthShowcaseSection />}
      </div>
    </div>
  );
}

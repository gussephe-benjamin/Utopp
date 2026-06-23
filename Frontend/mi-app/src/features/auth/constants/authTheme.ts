/** Tokens visuales del flujo de autenticación (dark premium). */
export const AUTH_THEME = {
  primary: "#6D5DFC",
  secondary: "#8B5CF6",
  accent: "#A855F7",
  background: "#0F1117",
  card: "#171A23",
  cardElevated: "#1E2230",
  border: "rgba(255,255,255,0.08)",
  textPrimary: "#FFFFFF",
  textSecondary: "#B8C0CC",
  muted: "#8A93A2",
  success: "#22C55E",
  error: "#EF4444",
} as const

/** Tokens del fondo ambiental del panel derecho. */
export const AUTH_AMBIENT = {
  base: "#0F1117",
  surface: "#151925",
  glowPrimary: "#6D5DFC",
  glowSecondary: "#8B5CF6",
  glowAccent: "#A855F7",
  orbOpacity: { all: 0.16 },
  shapeOpacity: { all: 0.42 },
  particleOpacity: { min: 0.25, max: 0.7 },
  particleCount: { desktop: 22, mobile: 14 },
  particleSize: { min: 3, max: 6 },
  particleSpeed: 24,
} as const

/** Clases Tailwind reutilizables (literales para JIT). */
export const TW_AUTH = {
  pageBg: "bg-[#0F1117]",
  card: "relative z-10 rounded-3xl border border-white/[0.08] bg-[rgba(23,26,35,0.82)] backdrop-blur-[20px] shadow-[0_24px_80px_-24px_rgba(0,0,0,0.6)]",
  cardTransition: "transition-[box-shadow,transform] duration-[250ms] ease-out motion-reduce:transition-none",
  heading: "font-display text-white",
  subtitle: "text-[#B8C0CC]",
  muted: "text-[#8A93A2]",
  btnPrimary:
    "min-h-[44px] rounded-xl bg-gradient-to-r from-[#6D5DFC] to-[#8B5CF6] text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(109,93,252,0.55)] auth-btn-lift auth-glow-hover transition-all duration-200 ease-out motion-reduce:transition-none disabled:opacity-50",
  btnGoogle:
    "flex min-h-[44px] w-full items-center justify-center gap-3 rounded-xl border border-white/[0.08] bg-[#1E2230] text-sm font-semibold text-white auth-btn-lift transition-all duration-200 ease-out motion-reduce:transition-none hover:border-white/[0.14] hover:bg-[#232836]",
  btnSecondary:
    "min-h-[44px] rounded-xl border border-white/[0.08] bg-transparent text-sm font-semibold text-[#B8C0CC] transition-all duration-200 ease-out hover:border-white/[0.14] hover:bg-white/[0.04] motion-reduce:transition-none disabled:opacity-60",
  link: "text-[#8B5CF6] font-medium transition-colors duration-200 hover:text-[#A855F7]",
  focusRing:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5DFC] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1117]",
  input:
    "h-12 min-h-[44px] w-full rounded-xl border border-white/10 bg-[#1E2230] text-base text-white transition-colors duration-200 placeholder:text-[#8A93A2] focus:border-[#6D5DFC]/50 focus:outline-none focus:ring-2 focus:ring-[#6D5DFC]/40",
  alertError:
    "rounded-2xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-3.5 py-3 text-center text-sm leading-relaxed text-[#FCA5A5]",
  legalBox: "space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4",
  checkbox: "mt-0.5 size-4 shrink-0 rounded border-white/20 bg-[#1E2230] text-[#6D5DFC] focus:ring-[#6D5DFC]/40",
  benefitGlass:
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:border-white/20 group-hover:shadow-[0_8px_24px_-8px_rgba(109,93,252,0.35)] motion-reduce:transform-none",
  heroContent:
    "flex w-full max-w-[35rem] flex-col gap-[clamp(1.25rem,2vw,2rem)]",
  heroLogo: "inline-flex items-center gap-3",
  heroLogoIcon:
    "object-contain drop-shadow-[0_4px_12px_rgba(109,93,252,0.35)] size-[clamp(2rem,4vw,2.5rem)]",
  heroLogoText:
    "font-display font-bold tracking-tight text-white text-[clamp(1.1rem,1.6vw,1.35rem)]",
  heroTitle:
    "max-w-[520px] font-display text-[clamp(2.25rem,4vw,3.5rem)] font-extrabold leading-[0.98] tracking-[-0.04em] text-white",
  heroTitleCompact:
    "max-w-[520px] font-display text-[clamp(1.85rem,3.4vw,2.4rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-white",
  heroDescription:
    "mt-4 max-w-[500px] text-[clamp(1rem,1.25vw,1.125rem)] leading-[1.65] text-white/[0.78]",
  heroBenefits: "grid max-w-[520px] grid-cols-1 gap-x-8 gap-y-3.5 md:grid-cols-2",
  heroBenefitItem: "group flex min-h-10 items-center gap-3.5",
  heroBenefitIcon:
    "flex size-[38px] shrink-0 items-center justify-center rounded-full border border-white/[0.14] bg-white/[0.08] backdrop-blur-[12px] transition-all duration-200 ease-out group-hover:border-white/20 motion-reduce:transform-none",
  heroBenefitText: "text-[0.95rem] font-semibold text-white/[0.92]",
  heroSectionLabel:
    "flex items-center gap-1.5 text-[0.76rem] font-bold uppercase tracking-[0.06em] text-white/55",
  heroSectionLabelMobile:
    "flex items-center gap-1.5 text-[0.76rem] font-bold uppercase tracking-[0.06em] text-[#8A93A2]",
  heroShowcaseCard:
    "min-h-16 overflow-hidden rounded-2xl border border-white/[0.13] bg-white/[0.075] p-[0.85rem] backdrop-blur-[14px] sm:p-3",
  heroShowcaseCardCompact:
    "min-h-14 overflow-hidden rounded-2xl border border-white/[0.13] bg-white/[0.075] p-3 backdrop-blur-[14px]",
  heroEventDate:
    "flex size-11 shrink-0 flex-col items-center justify-center rounded-[0.85rem] border border-white/[0.16] bg-white/[0.14] text-white",
  heroCarouselDot:
    "block size-1.5 shrink-0 rounded-full bg-white/35 transition-all duration-300 ease-out hover:bg-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
  heroCarouselDotActive: "h-1.5 w-[18px] shrink-0 rounded-full bg-white/95",
  showcaseCard:
    "min-h-16 overflow-hidden rounded-2xl border border-white/[0.13] bg-white/[0.075] p-[0.85rem] backdrop-blur-[14px]",
  showcaseCardCompact:
    "min-h-14 overflow-hidden rounded-2xl border border-white/[0.13] bg-white/[0.075] p-3 backdrop-blur-[14px]",
} as const

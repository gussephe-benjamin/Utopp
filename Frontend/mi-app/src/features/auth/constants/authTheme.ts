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

/** Clases Tailwind reutilizables (literales para JIT). */
export const TW_AUTH = {
  pageBg: "bg-[#0F1117]",
  card: "rounded-3xl border border-white/[0.08] bg-[#171A23]/90 backdrop-blur-xl shadow-[0_24px_80px_-24px_rgba(0,0,0,0.6)]",
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
  showcaseCard:
    "rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm",
} as const

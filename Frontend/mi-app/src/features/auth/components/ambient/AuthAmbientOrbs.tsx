import { AUTH_AMBIENT } from "../../constants/authTheme"

type OrbConfig = {
  className: string
  color: string
  blur: string
  animation: string
  delay: string
}

const ORBS: OrbConfig[] = [
  {
    className: "auth-ambient-orb-desktop auth-ambient-orb -right-16 top-[12%] h-72 w-72",
    color: AUTH_AMBIENT.glowPrimary,
    blur: "blur-[72px]",
    animation: "auth-ambient-float",
    delay: "0s",
  },
  {
    className: "auth-ambient-orb-desktop auth-ambient-orb left-[10%] top-[55%] h-64 w-64",
    color: AUTH_AMBIENT.glowSecondary,
    blur: "blur-[64px]",
    animation: "auth-ambient-float-alt",
    delay: "-6s",
  },
  {
    className: "auth-ambient-orb-desktop auth-ambient-orb bottom-[8%] right-[15%] h-56 w-56",
    color: AUTH_AMBIENT.glowAccent,
    blur: "blur-[56px]",
    animation: "auth-ambient-pulse",
    delay: "-3s",
  },
  {
    className: "auth-ambient-orb-tablet auth-ambient-orb -right-10 top-[20%] h-60 w-60",
    color: AUTH_AMBIENT.glowPrimary,
    blur: "blur-[56px]",
    animation: "auth-ambient-float",
    delay: "-2s",
  },
  {
    className: "auth-ambient-orb-tablet auth-ambient-orb bottom-[15%] left-[5%] h-52 w-52",
    color: AUTH_AMBIENT.glowSecondary,
    blur: "blur-[48px]",
    animation: "auth-ambient-float-alt",
    delay: "-8s",
  },
  {
    className: "auth-ambient-orb-mobile auth-ambient-orb left-1/4 top-[35%] h-48 w-48 -translate-x-1/2",
    color: AUTH_AMBIENT.glowPrimary,
    blur: "blur-[40px]",
    animation: "auth-ambient-float",
    delay: "-4s",
  },
]

/** Orbes difuminados de ambiente (Layer 2). */
export function AuthAmbientOrbs() {
  return (
    <div className="auth-ambient-parallax-orbs absolute inset-0" aria-hidden>
      {ORBS.map((orb) => (
        <div
          key={orb.className}
          className={`auth-ambient-orb pointer-events-none absolute rounded-full ${orb.className} ${orb.blur} ${orb.animation}`}
          style={{
            backgroundColor: orb.color,
            opacity: AUTH_AMBIENT.orbOpacity.all,
            animationDelay: orb.delay,
          }}
        />
      ))}
    </div>
  )
}

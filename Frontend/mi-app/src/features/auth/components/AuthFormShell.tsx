import type { ReactNode } from "react"
import { UtoppBrandMark } from "../../../shared/brand/UtoppBrandMark"
import { TW_UTOPP_GRADIENT_R } from "../../../shared/constants/brand"

type AuthFormShellProps = {
  children: ReactNode
  footer?: ReactNode
  showLogo?: boolean
  tall?: boolean
}

export function AuthFormShell({
  children,
  footer,
  showLogo = true,
  tall = true,
}: AuthFormShellProps) {
  return (
    <div
      className={`relative mx-auto flex w-full max-w-[19.5rem] flex-col overflow-hidden rounded-[1.75rem] border border-slate-200/90 bg-white shadow-[0_24px_64px_-20px_rgba(147,51,234,0.22)] sm:max-w-[20.5rem] ${
        tall ? "min-h-[32rem] sm:min-h-[34rem]" : "min-h-[28rem]"
      }`}
    >
      <div className={`h-1.5 w-full ${TW_UTOPP_GRADIENT_R}`} aria-hidden />

      <div className="flex flex-1 flex-col px-6 py-8 sm:px-7 sm:py-9">
        {showLogo ? (
          <div className="mb-7 flex justify-center">
            <UtoppBrandMark variant="auth" className="mb-0" />
          </div>
        ) : null}

        <div className="flex flex-1 flex-col">{children}</div>

        {footer ? <div className="mt-auto pt-6">{footer}</div> : null}
      </div>
    </div>
  )
}

export function AuthFormHeading({
  title,
  subtitle,
  hint,
}: {
  title: string
  subtitle: string
  hint?: string
}) {
  return (
    <div className="text-center">
      <h1 className="text-[1.65rem] font-bold leading-tight tracking-tight text-[#9333EA]">{title}</h1>
      <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{subtitle}</p>
      {hint ? (
        <span className="mt-4 inline-flex rounded-full border border-violet-100 bg-violet-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-violet-700">
          {hint}
        </span>
      ) : null}
    </div>
  )
}

export function AuthFormDivider({ label }: { label?: string }) {
  const isBrand = label === undefined

  return (
    <div className="relative my-6" role="separator" aria-label={label ?? "utopp"}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-slate-100" />
      </div>
      <div className="relative flex justify-center">
        <span
          className={`bg-white px-3 ${
            isBrand
              ? "text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300"
              : "text-[11px] font-medium text-slate-400"
          }`}
        >
          {isBrand ? "utopp" : label}
        </span>
      </div>
    </div>
  )
}

export function AuthFormAlert({ message }: { message: string }) {
  return (
    <div
      className="rounded-2xl border border-red-100 bg-red-50/90 px-3.5 py-3 text-center text-xs leading-relaxed text-red-700"
      role="alert"
    >
      {message}
    </div>
  )
}

export function GoogleMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

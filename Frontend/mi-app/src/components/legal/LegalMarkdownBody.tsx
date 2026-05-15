import { lazy, Suspense, type ReactNode } from "react"
import { cn } from "../../lib/utils"
import type { LegalMarkdownVariant } from "./types"

export type { LegalMarkdownVariant } from "./types"

const LegalMarkdownInner = lazy(() => import("./LegalMarkdownInner"))

type Props = {
  markdown: string
  className?: string
  variant?: LegalMarkdownVariant
  fallback?: ReactNode
  /** Se llama cuando el cuerpo Markdown (chunk lazy) ya está montado; útil para gating de scroll/IO. */
  onReady?: () => void
}

export default function LegalMarkdownBody({
  markdown,
  className,
  variant = "light",
  fallback,
  onReady,
}: Props) {
  return (
    <div className={cn(className)}>
      <Suspense
        fallback={
          fallback ?? (
            <p className={cn("text-sm opacity-70", variant === "dark" ? "text-violet-200" : "text-slate-500")}>
              Cargando texto legal…
            </p>
          )
        }
      >
        <LegalMarkdownInner markdown={markdown} variant={variant} onReady={onReady} />
      </Suspense>
    </div>
  )
}

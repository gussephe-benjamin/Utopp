import { useEffect } from "react"
import ReactMarkdown from "react-markdown"
import rehypeSanitize, { defaultSchema } from "rehype-sanitize"
import remarkGfm from "remark-gfm"
import type { ExtraProps } from "react-markdown"
import type { Schema } from "hast-util-sanitize"
import type { LegalMarkdownVariant } from "./types"

/** Tablas GFM (remark-gfm) requieren etiquetas extra en el esquema de saneado. */
const sanitizeSchema: Schema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
  ],
}

const styles: Record<
  LegalMarkdownVariant,
  {
    h1: string
    h2: string
    h3: string
    p: string
    ul: string
    ol: string
    li: string
    a: string
    strong: string
    code: string
    blockquote: string
    hr: string
    tableWrap: string
    th: string
    td: string
  }
> = {
  light: {
    h1: "mt-8 first:mt-0 text-2xl font-bold tracking-tight text-slate-900",
    h2: "mt-6 text-xl font-semibold text-slate-900",
    h3: "mt-5 text-lg font-semibold text-slate-800",
    p: "mt-3 text-base leading-relaxed text-slate-800",
    ul: "mt-3 list-disc space-y-1 pl-6 text-slate-800",
    ol: "mt-3 list-decimal space-y-1 pl-6 text-slate-800",
    li: "leading-relaxed",
    a: "font-medium text-indigo-600 underline decoration-indigo-600/40 underline-offset-2 hover:text-indigo-800",
    strong: "font-semibold text-slate-900",
    code: "rounded-md bg-slate-100 px-1.5 py-0.5 text-[0.9em] font-mono text-slate-800",
    blockquote: "mt-3 border-l-4 border-indigo-200 pl-4 italic text-slate-700",
    hr: "my-8 border-slate-200",
    tableWrap: "mt-4 overflow-x-auto rounded-lg border border-slate-200",
    th: "border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-semibold text-slate-900",
    td: "border border-slate-200 px-3 py-2 text-sm text-slate-800",
  },
  dark: {
    h1: "mt-6 first:mt-0 text-lg font-bold text-white",
    h2: "mt-5 text-base font-semibold text-violet-100",
    h3: "mt-4 text-sm font-semibold text-violet-100",
    p: "mt-3 text-sm leading-relaxed text-violet-100/95",
    ul: "mt-3 list-disc space-y-1.5 pl-5 text-violet-100/90",
    ol: "mt-3 list-decimal space-y-1.5 pl-5 text-violet-100/90",
    li: "leading-relaxed",
    a: "font-semibold text-white underline underline-offset-2 hover:text-violet-200",
    strong: "font-semibold text-white",
    code: "rounded-md bg-white/10 px-1.5 py-0.5 text-[0.85em] font-mono text-violet-100",
    blockquote: "mt-3 border-l-4 border-violet-400/50 pl-4 italic text-violet-200/90",
    hr: "my-6 border-white/20",
    tableWrap: "mt-4 overflow-x-auto rounded-xl border border-white/15",
    th: "border border-white/20 bg-white/5 px-2.5 py-2 text-left text-xs font-semibold text-white",
    td: "border border-white/15 px-2.5 py-2 text-xs text-violet-100/95",
  },
}

export default function LegalMarkdownInner({
  markdown,
  variant,
  onReady,
}: {
  markdown: string
  variant: LegalMarkdownVariant
  onReady?: () => void
}) {
  const s = styles[variant]

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => onReady?.())
    })
    return () => cancelAnimationFrame(id)
  }, [markdown, onReady])

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
      components={{
        h1: ({ children }) => <h1 className={s.h1}>{children}</h1>,
        h2: ({ children }) => <h2 className={s.h2}>{children}</h2>,
        h3: ({ children }) => <h3 className={s.h3}>{children}</h3>,
        p: ({ children }) => <p className={s.p}>{children}</p>,
        ul: ({ children }) => <ul className={s.ul}>{children}</ul>,
        ol: ({ children }) => <ol className={s.ol}>{children}</ol>,
        li: ({ children }) => <li className={s.li}>{children}</li>,
        strong: ({ children }) => <strong className={s.strong}>{children}</strong>,
        blockquote: ({ children }) => <blockquote className={s.blockquote}>{children}</blockquote>,
        hr: () => <hr className={s.hr} />,
        code: ({ className, children, ...props }: React.HTMLAttributes<HTMLElement> & ExtraProps) => {
          const isBlock = className?.includes("language-")
          if (isBlock) {
            return (
              <code className={`${s.code} block overflow-x-auto p-3 text-xs`} {...props}>
                {children}
              </code>
            )
          }
          return (
            <code className={s.code} {...props}>
              {children}
            </code>
          )
        },
        pre: ({ children }) => <pre className="mt-3 overflow-x-auto rounded-xl bg-black/20 p-0">{children}</pre>,
        a: ({ href, children }) => (
          <a href={href} className={s.a} target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className={s.tableWrap}>
            <table className="w-full min-w-[280px] border-collapse text-left">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead>{children}</thead>,
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => <tr>{children}</tr>,
        th: ({ children }) => <th className={s.th}>{children}</th>,
        td: ({ children }) => <td className={s.td}>{children}</td>,
      }}
    >
      {markdown}
    </ReactMarkdown>
  )
}

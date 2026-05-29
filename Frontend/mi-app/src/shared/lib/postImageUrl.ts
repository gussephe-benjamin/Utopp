/** Resuelve URLs de imagen relativas contra la API (evita 404 en datos demo locales). */
export function resolvePostImageUrl(rawUrl: string): string {
  if (!rawUrl) return rawUrl
  if (/^(https?:)?\/\//i.test(rawUrl) || rawUrl.startsWith("data:") || rawUrl.startsWith("blob:")) {
    return rawUrl
  }
  const apiBase = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "")
  if (!apiBase) return rawUrl
  const normalizedPath = rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`
  return `${apiBase}${normalizedPath}`
}

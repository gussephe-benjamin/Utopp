import { buildCloudinaryUrl } from "./cloudinaryUrl"
import { resolveApiBaseUrl } from "./apiBaseUrl"

/** Resuelve URLs de imagen relativas contra la API y optimiza Cloudinary a WebP. */
export function resolvePostImageUrl(rawUrl: string): string {
  if (!rawUrl) return rawUrl
  if (/^(https?:)?\/\//i.test(rawUrl) || rawUrl.startsWith("data:") || rawUrl.startsWith("blob:")) {
    return buildCloudinaryUrl(rawUrl, "feed")
  }
  const apiBase = resolveApiBaseUrl()
  const normalizedPath = rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`
  return buildCloudinaryUrl(`${apiBase}${normalizedPath}`, "feed")
}

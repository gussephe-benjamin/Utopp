export type CloudinaryPreset = "avatar" | "thumbnail" | "feed" | "full"

const PRESET_TRANSFORMS: Record<CloudinaryPreset, string> = {
  avatar: "f_webp,q_auto,w_256,h_256,c_fill",
  thumbnail: "f_webp,q_auto,w_400,c_limit",
  feed: "f_webp,q_auto,w_800,c_limit",
  full: "f_webp,q_auto,w_1600,c_limit",
}

const CLOUDINARY_UPLOAD_MARKER = "/image/upload/"
const TRANSFORM_SEGMENT_PATTERN = /^[a-z0-9_,]+$/i

function isCloudinaryUrl(url: string): boolean {
  return /res\.cloudinary\.com/i.test(url) && url.includes(CLOUDINARY_UPLOAD_MARKER)
}

function hasTransformSegment(afterUpload: string): boolean {
  const firstSegment = afterUpload.split("/")[0] ?? ""
  if (!firstSegment) return false
  if (firstSegment.startsWith("v") && /^\d+$/.test(firstSegment.slice(1))) return false
  return TRANSFORM_SEGMENT_PATTERN.test(firstSegment)
}

/**
 * Inyecta transformaciones Cloudinary (WebP + calidad/tamaño) en una URL de entrega.
 * Reemplaza transformaciones existentes para permitir cambiar de preset (p. ej. feed → full).
 */
export function buildCloudinaryUrl(
  rawUrl: string,
  preset: CloudinaryPreset = "feed",
): string {
  if (!rawUrl || !isCloudinaryUrl(rawUrl)) return rawUrl

  const markerIndex = rawUrl.indexOf(CLOUDINARY_UPLOAD_MARKER)
  const before = rawUrl.slice(0, markerIndex + CLOUDINARY_UPLOAD_MARKER.length)
  let after = rawUrl.slice(markerIndex + CLOUDINARY_UPLOAD_MARKER.length)

  if (hasTransformSegment(after)) {
    const slashIndex = after.indexOf("/")
    after = after.slice(slashIndex + 1)
  }

  const transforms = PRESET_TRANSFORMS[preset]
  return `${before}${transforms}/${after}`
}

/** Resuelve URL de avatar (Cloudinary → WebP optimizado). */
export function resolveAvatarUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null
  return buildCloudinaryUrl(rawUrl, "avatar")
}

/** Resuelve URL de imagen de organización (miniatura). */
export function resolveOrgImageUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null
  return buildCloudinaryUrl(rawUrl, "thumbnail")
}

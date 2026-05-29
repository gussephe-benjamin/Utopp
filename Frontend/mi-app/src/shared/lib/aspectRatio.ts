// Formatos (aspect ratio) de publicación, estilo Instagram.
// Un mismo formato aplica a todas las imágenes del carrusel de una publicación.

export type PostAspectRatio = "1:1" | "4:5" | "1.91:1"

export const DEFAULT_POST_ASPECT_RATIO: PostAspectRatio = "4:5"

/** Ancho máximo uniforme de cada tarjeta en el feed (independiente del formato de imagen). */
export const FEED_POST_CARD_MAX_WIDTH = 680

/** Valor numérico (width / height) para cada formato. */
export const POST_ASPECT_RATIOS: Record<PostAspectRatio, number> = {
  "1:1": 1,
  "4:5": 0.8,
  "1.91:1": 1.91,
}

/** Opciones para el selector de formato en el editor. */
export const POST_ASPECT_RATIO_OPTIONS: {
  value: PostAspectRatio
  label: string
  hint: string
}[] = [
  { value: "1:1", label: "Cuadrado", hint: "1:1" },
  { value: "4:5", label: "Vertical", hint: "4:5" },
  { value: "1.91:1", label: "Horizontal", hint: "1.91:1" },
]

/** Normaliza un valor arbitrario a un formato válido (fallback al default). */
export function normalizeAspectRatio(value: unknown): PostAspectRatio {
  if (value === "1:1" || value === "4:5" || value === "1.91:1") {
    return value
  }
  return DEFAULT_POST_ASPECT_RATIO
}

/** Devuelve el valor numérico (width/height) de un formato. */
export function aspectRatioValue(ratio: PostAspectRatio): number {
  return POST_ASPECT_RATIOS[ratio]
}

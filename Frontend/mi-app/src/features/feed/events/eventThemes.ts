/**
 * Temas de fondo de los eventos. Las claves son las mismas que guarda Utopp
 * Formulario en `formulario.events.theme`, para que el evento se vea igual en
 * el landing público y en esta sección.
 *
 * Aquí solo se usan los gradientes: los fondos de video y los shaders del
 * landing de Formulario no se replican.
 */
export type EventThemeOption = {
  key: string
  label: string
  /** Clases tailwind del gradiente (swatch y fallback sin imagen) */
  gradient: string
}

export const EVENT_THEMES: EventThemeOption[] = [
  { key: "violet", label: "Lightfall", gradient: "from-blue-600 via-violet-600 to-fuchsia-600" },
  { key: "sunset", label: "Cinematic", gradient: "from-orange-500 via-rose-600 to-fuchsia-700" },
  { key: "ocean", label: "Océano", gradient: "from-sky-500 via-blue-600 to-indigo-700" },
  { key: "emerald", label: "GridScan", gradient: "from-slate-800 via-fuchsia-900 to-slate-900" },
  { key: "magenta", label: "Bloom", gradient: "from-fuchsia-600 via-pink-600 to-rose-600" },
  { key: "midnight", label: "Código", gradient: "from-emerald-800 via-slate-900 to-slate-950" },
]

export const getEventTheme = (key?: string | null): EventThemeOption =>
  EVENT_THEMES.find((t) => t.key === key) || EVENT_THEMES[0]

/** Gradiente listo para usar como clase de fondo. */
export const getEventGradient = (key?: string | null): string =>
  `bg-gradient-to-br ${getEventTheme(key).gradient}`

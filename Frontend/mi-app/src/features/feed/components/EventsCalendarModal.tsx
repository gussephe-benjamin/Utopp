import { useMemo, useState } from "react"
import ReactDOM from "react-dom"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, X } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { ProfileLink } from "../../profile/components/ProfileLink"
import type { FeedPostOut, SubPostType } from "../../../types/post.types"
import { publicFormularioHref } from "../../../shared/lib/utoppFormularioUrl"

type EventsCalendarModalProps = {
  open: boolean
  onClose: () => void
  posts: FeedPostOut[]
  currentUserId: number | null
}

const WEEKDAYS = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"]

// ── Categorías (color por tipo de evento), estilo de referencia ──────────
type CategoryKey = "tech" | "academic" | "cultural" | "entrepreneurship" | "competitions"

const CATEGORIES: Record<
  CategoryKey,
  { label: string; dot: string; bar: string; pillBg: string; pillText: string }
> = {
  tech: { label: "Tecnología", dot: "bg-blue-500", bar: "bg-blue-500", pillBg: "bg-blue-50", pillText: "text-blue-600" },
  academic: { label: "Académico", dot: "bg-violet-500", bar: "bg-violet-500", pillBg: "bg-violet-50", pillText: "text-violet-600" },
  cultural: { label: "Cultural", dot: "bg-rose-500", bar: "bg-rose-500", pillBg: "bg-rose-50", pillText: "text-rose-600" },
  entrepreneurship: { label: "Emprendimiento", dot: "bg-emerald-500", bar: "bg-emerald-500", pillBg: "bg-emerald-50", pillText: "text-emerald-600" },
  competitions: { label: "Competencias", dot: "bg-amber-500", bar: "bg-amber-500", pillBg: "bg-amber-50", pillText: "text-amber-600" },
}

const CATEGORY_ORDER: CategoryKey[] = [
  "tech",
  "academic",
  "cultural",
  "entrepreneurship",
  "competitions",
]

const SUBTYPE_CATEGORY: Partial<Record<SubPostType, CategoryKey>> = {
  competencia: "competitions",
  competencias: "competitions",
  hackathon: "competitions",
  emprendimiento: "entrepreneurship",
  arte: "cultural",
  deporte: "cultural",
  voluntariado: "cultural",
  urgente: "cultural",
  conferencia: "academic",
  congresos_talleres: "academic",
  investigacion: "academic",
  proyecto_investigacion: "academic",
  visita_academica: "academic",
  comunicado: "academic",
  "4+1": "academic",
  intercambio: "tech",
  pasantia: "tech",
  empleo: "tech",
  informativo: "tech",
  pregunta: "tech",
  debate: "tech",
}

function resolveCategory(post: FeedPostOut): CategoryKey {
  for (const raw of post.tags ?? []) {
    const t = raw.toLowerCase()
    if (t in CATEGORIES) return t as CategoryKey
  }
  if (post.subtype && SUBTYPE_CATEGORY[post.subtype]) {
    return SUBTYPE_CATEGORY[post.subtype] as CategoryKey
  }
  return "tech"
}

/** Clave local YYYY-MM-DD (sin desfase de zona horaria). */
function dateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function startOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1)
}

/** Índice del día de la semana con lunes = 0. */
function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ── Avatar del organizador (logo de la organización) ─────────────────────
function OrgAvatar({
  url,
  name,
  size = "h-7 w-7",
}: {
  url?: string | null
  name?: string
  size?: string
}) {
  const initial = (name ?? "U").charAt(0).toUpperCase()
  return (
    <span
      className={`inline-flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-600 to-fuchsia-500 p-[2px] shadow-sm`}
      title={name}
    >
      <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white p-[1.5px]">
        {url ? (
          <img src={url} alt={name ?? ""} className="h-full w-full rounded-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-fuchsia-500 text-[11px] font-bold text-white">
            {initial}
          </span>
        )}
      </span>
    </span>
  )
}

export function EventsCalendarModal({
  open,
  onClose,
  posts,
  currentUserId,
}: EventsCalendarModalProps) {
  const dated = useMemo(() => posts.filter((p) => !!p.deadline_at), [posts])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, FeedPostOut[]>()
    for (const p of dated) {
      const key = dateKey(new Date(p.deadline_at as string))
      const arr = map.get(key)
      if (arr) arr.push(p)
      else map.set(key, [p])
    }
    return map
  }, [dated])

  const firstEventDate = useMemo(() => {
    if (dated.length === 0) return new Date()
    const sorted = [...dated].sort(
      (a, b) =>
        new Date(a.deadline_at as string).getTime() -
        new Date(b.deadline_at as string).getTime(),
    )
    return new Date(sorted[0].deadline_at as string)
  }, [dated])

  const [cursor, setCursor] = useState(() => ({
    year: firstEventDate.getFullYear(),
    month: firstEventDate.getMonth(),
  }))
  const [selectedKey, setSelectedKey] = useState<string>(() => dateKey(firstEventDate))

  const todayKey = dateKey(new Date())

  const cells = useMemo(() => {
    const first = startOfMonth(cursor.year, cursor.month)
    const lead = mondayIndex(first)
    const gridStart = new Date(cursor.year, cursor.month, 1 - lead)
    return Array.from({ length: 42 }, (_, i) =>
      new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i),
    )
  }, [cursor])

  // Cuántos eventos caen en el mes visible (subtítulo del header).
  const monthCount = useMemo(() => {
    let n = 0
    for (const p of dated) {
      const d = new Date(p.deadline_at as string)
      if (d.getFullYear() === cursor.year && d.getMonth() === cursor.month) n++
    }
    return n
  }, [dated, cursor])

  const monthLabel = useMemo(
    () => capitalize(new Intl.DateTimeFormat("es-PE", { month: "long" }).format(startOfMonth(cursor.year, cursor.month))),
    [cursor],
  )

  const selectedEvents = eventsByDay.get(selectedKey) ?? []
  const selectedDateObj = useMemo(() => {
    const [y, m, d] = selectedKey.split("-").map(Number)
    return new Date(y, m - 1, d)
  }, [selectedKey])

  const selectedHeading = capitalize(
    new Intl.DateTimeFormat("es-PE", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(selectedDateObj),
  )

  const goMonth = (delta: number) => {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  if (typeof document === "undefined") return null

  return ReactDOM.createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-fuchsia-500 text-white shadow-sm">
                  <CalendarIcon className="h-4.5 w-4.5" />
                </span>
                <div>
                  <h3 className="text-base font-bold leading-tight text-gray-900">
                    Eventos próximos
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    {monthCount} {monthCount === 1 ? "evento" : "eventos"} este mes
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cuerpo: calendario + panel del día */}
            <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
              {/* ── Calendario mensual ─────────────────────────────── */}
              <div className="flex min-h-0 flex-1 flex-col p-5 lg:border-r lg:border-gray-100">
                {/* Navegación de mes */}
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-2xl font-bold leading-none text-gray-900">{monthLabel}</h4>
                    <p className="text-xs text-gray-400">{cursor.year}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => goMonth(-1)}
                      aria-label="Mes anterior"
                      className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() =>
                        setCursor({
                          year: new Date().getFullYear(),
                          month: new Date().getMonth(),
                        })
                      }
                      className="rounded-full bg-gradient-to-r from-blue-600 to-fuchsia-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:brightness-105 active:scale-95"
                    >
                      Hoy
                    </button>
                    <button
                      onClick={() => goMonth(1)}
                      aria-label="Mes siguiente"
                      className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Cabecera de días */}
                <div className="grid grid-cols-7 gap-1.5 pb-1.5">
                  {WEEKDAYS.map((w) => (
                    <div
                      key={w}
                      className="py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400"
                    >
                      {w}
                    </div>
                  ))}
                </div>

                {/* Rejilla de días */}
                <div className="grid flex-1 auto-rows-fr grid-cols-7 gap-1.5">
                  {cells.map((d) => {
                    const key = dateKey(d)
                    const inMonth = d.getMonth() === cursor.month
                    const isToday = key === todayKey
                    const isSelected = key === selectedKey
                    const dayEvents = eventsByDay.get(key) ?? []
                    const hasEvents = dayEvents.length > 0
                    // Categorías únicas presentes ese día (para los dots).
                    const cats = Array.from(new Set(dayEvents.map(resolveCategory)))

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => hasEvents && setSelectedKey(key)}
                        disabled={!hasEvents}
                        className={[
                          "group relative flex min-h-[58px] flex-col rounded-2xl border p-2 text-left transition-all",
                          isSelected
                            ? "border-transparent bg-gradient-to-br from-blue-600 to-fuchsia-500 text-white shadow-md"
                            : hasEvents
                              ? "border-violet-100 bg-violet-50/70 hover:border-violet-300 hover:shadow-sm"
                              : inMonth
                                ? "border-gray-100 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                                : "border-transparent bg-transparent",
                          !inMonth && !isSelected ? "opacity-40" : "",
                          hasEvents ? "cursor-pointer" : "cursor-default",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "text-sm font-bold leading-none",
                            isSelected
                              ? "text-white"
                              : isToday
                                ? "text-violet-600"
                                : inMonth
                                  ? "text-gray-700"
                                  : "text-gray-400",
                          ].join(" ")}
                        >
                          {d.getDate()}
                        </span>

                        {/* Dots de categoría */}
                        {hasEvents && (
                          <div className="mt-auto flex flex-wrap items-center gap-1 pt-1">
                            {cats.slice(0, 4).map((c) => (
                              <span
                                key={c}
                                className={`h-2 w-2 rounded-full ${isSelected ? "bg-white/90" : CATEGORIES[c].dot}`}
                              />
                            ))}
                            {dayEvents.length > 1 && (
                              <span
                                className={`text-[9px] font-bold leading-none ${isSelected ? "text-white/90" : "text-gray-400"}`}
                              >
                                {dayEvents.length}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Leyenda de categorías */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {CATEGORY_ORDER.map((c) => (
                    <span
                      key={c}
                      className={`inline-flex items-center gap-1.5 rounded-full ${CATEGORIES[c].pillBg} px-2.5 py-1`}
                    >
                      <span className={`h-2 w-2 rounded-full ${CATEGORIES[c].dot}`} />
                      <span className={`text-[11px] font-semibold ${CATEGORIES[c].pillText}`}>
                        {CATEGORIES[c].label}
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              {/* ── Panel del día seleccionado ─────────────────────── */}
              <div className="flex min-h-0 w-full flex-col bg-gray-50/60 p-5 lg:w-96">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Detalle del día
                </p>
                <h4 className="mt-1 text-lg font-bold leading-tight text-gray-900">
                  {selectedHeading}
                </h4>
                <p className="mb-4 text-[11px] text-gray-400">
                  {selectedEvents.length} {selectedEvents.length === 1 ? "evento" : "eventos"}
                </p>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto no-scrollbar">
                  {selectedEvents.length === 0 ? (
                    <p className="py-10 text-center text-xs text-gray-400">
                      No hay eventos este día.
                    </p>
                  ) : (
                    selectedEvents.map((post) => {
                      const title = post.title?.trim() || "Sin título"
                      const cat = CATEGORIES[resolveCategory(post)]
                      const time = new Date(post.deadline_at as string).toLocaleTimeString(
                        "es-PE",
                        { hour: "2-digit", minute: "2-digit" },
                      )
                      return (
                        <div
                          key={post.id}
                          className="flex overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                        >
                          {/* Barra de color de categoría */}
                          <span className={`w-1.5 shrink-0 ${cat.bar}`} />
                          <div className="min-w-0 flex-1 p-3.5">
                            {/* Pill categoría + hora */}
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <span
                                className={`inline-flex items-center rounded-md ${cat.pillBg} px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cat.pillText}`}
                              >
                                {cat.label}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                                <Clock className="h-3 w-3" />
                                {time}
                              </span>
                            </div>

                            {/* Título */}
                            <ProfileLink
                              userId={post.user_id}
                              currentUserId={currentUserId}
                              postId={post.id}
                              onClick={onClose}
                              className="block w-full break-words text-left text-sm font-bold leading-snug text-gray-800 hover:text-[#2563EB]"
                            >
                              {title}
                            </ProfileLink>

                            {/* Organización (logo + nombre) */}
                            <div className="mt-2.5 flex items-center gap-2">
                              <OrgAvatar
                                url={post.user_profile_image_url}
                                name={post.user_name}
                              />
                              <span className="truncate text-[12px] font-medium text-gray-600">
                                {post.user_name || "Organización"}
                              </span>
                            </div>
                            {publicFormularioHref(post.registration_url) && (
                              <a
                                href={publicFormularioHref(post.registration_url)!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2.5 inline-flex items-center rounded-full bg-gradient-to-r from-blue-600 to-fuchsia-500 px-3 py-1 text-[11px] font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-95"
                              >
                                Inscribirse
                              </a>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

import { useEffect, useMemo, useState } from "react"
import FullCalendar from "@fullcalendar/react"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import type { DateSelectArg, EventClickArg, DatesSetArg } from "@fullcalendar/core"
import type { AxiosError } from "axios"
import { createSchedule, deleteSchedule, getSchedule, updateSchedule } from "../api/apiFunctions/schedule"
import type { ScheduleItem } from "../api/apiFunctions/schedule"

// Tipos estructurales locales para evitar dependencias frágiles de tipos de FullCalendar
type DropInfo = {
  event: { id: string | number; start: Date | null; end: Date | null }
  revert: () => void
}
type ResizeInfo = {
  event: { id: string | number; start: Date | null; end: Date | null }
  revert: () => void
}

function toDateForWeek(dayOfWeek: number, timeStr: string, baseDate: Date) {
  // Align baseDate to the week start (Monday)
  const d = new Date(baseDate)
  const currentDay = (d.getDay() + 6) % 7 // convert Sun=0 to Mon=0
  const diff = dayOfWeek - currentDay
  d.setDate(d.getDate() + diff)
  const [h, m, s] = timeStr.split(":")
  d.setHours(Number(h), Number(m || 0), Number(s || 0), 0)
  return d
}

function fromDate(date: Date) {
  return date.toTimeString().slice(0, 8)
}

export default function Schedule() {
  const [items, setItems] = useState<ScheduleItem[]>([])
  const [weekRef, setWeekRef] = useState(new Date())

  const dayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

  function formatRange(it: ScheduleItem) {
    return `${it.start_time.slice(0,5)} - ${it.end_time.slice(0,5)}`
  }

  useEffect(() => {
    void (async () => {
      const data = await getSchedule()
      setItems(data)
    })()
  }, [])

  const events = useMemo(() => {
    return items.map(it => {
      const start = toDateForWeek(it.day_of_week, it.start_time, weekRef)
      const end = toDateForWeek(it.day_of_week, it.end_time, weekRef)
      return {
        id: String(it.id),
        title: it.type,
        start,
        end,
        allDay: false,
      }
    })
  }, [items, weekRef])

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Horario</h1>
      <FullCalendar
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        weekends={true}
        allDaySlot={false}
        headerToolbar={{ left: "title", center: "", right: "today prev,next" }}
        slotMinTime="07:00:00"
        slotMaxTime="22:00:00"
        events={events}
        editable={true}
        selectable={true}
        selectMirror={true}
        select={async (arg: DateSelectArg) => {
          // Create block for selected range
          const start = arg.start
          const end = arg.end
          // Compute day_of_week (Mon=0 ... Sun=6)
          const dow = (start.getDay() + 6) % 7
          const nombre = (prompt("Nombre del bloque", "disponible") || "").trim()
          if (!nombre) return
          const payload = {
            day_of_week: dow,
            start_time: fromDate(start),
            end_time: fromDate(end),
            type: nombre,
          }
          try {
            const created = await createSchedule(payload)
            setItems(prev => [...prev, created])
          } catch (e: unknown) {
            const detail = (e as AxiosError<{ detail?: string }>).response?.data?.detail
            alert(detail ?? "No se pudo crear el bloque (posible colisión)")
          }
        }}
        eventDrop={async (info: DropInfo) => {
          const id = Number(info.event.id)
          const start = info.event.start!
          const end = info.event.end || new Date(start.getTime() + 60 * 60 * 1000)
          const dow = (start.getDay() + 6) % 7
          try {
            const updated = await updateSchedule(id, {
              day_of_week: dow,
              start_time: fromDate(start),
              end_time: fromDate(end),
            })
            setItems(prev => prev.map(x => x.id === id ? updated : x))
          } catch (e: unknown) {
            info.revert()
            const detail = (e as AxiosError<{ detail?: string }>).response?.data?.detail
            alert(detail ?? "No se pudo mover (colisión)")
          }
        }}
        eventResize={async (info: ResizeInfo) => {
          const id = Number(info.event.id)
          const start = info.event.start!
          const end = info.event.end!
          try {
            const updated = await updateSchedule(id, {
              start_time: fromDate(start),
              end_time: fromDate(end),
            })
            setItems(prev => prev.map(x => x.id === id ? updated : x))
          } catch (e: unknown) {
            info.revert()
            const detail = (e as AxiosError<{ detail?: string }>).response?.data?.detail
            alert(detail ?? "No se pudo cambiar duración (colisión)")
          }
        }}
        eventClick={async (info: EventClickArg) => {
          const id = Number(info.event.id)
          const current = items.find(x => x.id === id)
          const input = prompt(
            'Escribe "eliminar" para borrar, o un nuevo nombre para renombrar. Deja vacío para cancelar.',
            current?.type || ""
          )
          if (input === null) return
          const value = input.trim()
          if (!value) return
          if (value.toLowerCase() === "eliminar") {
            await deleteSchedule(id)
            setItems(prev => prev.filter(x => x.id !== id))
            return
          }
          try {
            const updated = await updateSchedule(id, { type: value })
            setItems(prev => prev.map(x => x.id === id ? updated : x))
          } catch {
            alert("No se pudo renombrar")
          }
        }}
        datesSet={(arg: DatesSetArg) => setWeekRef(arg.start)}
      />
      <p className="text-sm text-gray-500 mt-2">Tip: Selecciona una franja para crear, arrastra para mover, y estira para cambiar duración. Click para eliminar.</p>

      <div className="mt-6">
        <h2 className="font-medium mb-2">Tus bloques (semana tipo)</h2>
        <div className="grid gap-2">
          {items
            .slice()
            .sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time))
            .map(it => (
              <div key={it.id} className="flex items-center justify-between border rounded p-2">
                <div>
                  <div className="font-medium">{it.type}</div>
                  <div className="text-xs text-gray-600">{dayNames[it.day_of_week]} · {formatRange(it)}</div>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={async () => {
                      const nuevo = prompt("Nuevo nombre", it.type)
                      if (!nuevo) return
                      const updated = await updateSchedule(it.id, { type: nuevo.trim() })
                      setItems(prev => prev.map(x => x.id === it.id ? updated : x))
                    }}
                    className="px-2 py-1 text-sm border rounded"
                  >Renombrar</button>
                  <button
                    onClick={async () => {
                      if (!confirm("¿Eliminar este bloque?")) return
                      await deleteSchedule(it.id)
                      setItems(prev => prev.filter(x => x.id !== it.id))
                    }}
                    className="px-2 py-1 text-sm bg-red-600 text-white rounded"
                  >Eliminar</button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

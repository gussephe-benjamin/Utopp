/**
 * API de Horarios
 *
 * Endpoints del backend (prefix: /schedule):
 *   GET    /schedule      — Lista los bloques de horario del usuario autenticado
 *   POST   /schedule      — Crea un nuevo bloque de horario
 *   PUT    /schedule/{id} — Actualiza un bloque de horario
 *   DELETE /schedule/{id} — Elimina un bloque de horario
 */

import api from "./axios"

export interface ScheduleItem {
  id: number
  user_id: number
  day_of_week: number
  start_time: string
  end_time: string
  type: string
}

export interface ScheduleCreate {
  day_of_week: number
  start_time: string
  end_time: string
  type: string
}

export interface ScheduleUpdate {
  day_of_week?: number
  start_time?: string
  end_time?: string
  type?: string
}

/**
 * GET /schedule
 * Lista todos los bloques de horario del usuario autenticado.
 * Auth: Requerida.
 */
export async function getSchedule(): Promise<ScheduleItem[]> {
  const { data } = await api.get<ScheduleItem[]>("/schedule")
  return data
}

/**
 * POST /schedule
 * Crea un nuevo bloque de horario para el usuario autenticado.
 * Auth: Requerida.
 */
export async function createSchedule(payload: ScheduleCreate): Promise<ScheduleItem> {
  const { data } = await api.post<ScheduleItem>("/schedule", payload)
  return data
}

/**
 * PUT /schedule/{id}
 * Actualiza un bloque de horario existente (partial update).
 * Auth: Requerida.
 */
export async function updateSchedule(id: number, payload: ScheduleUpdate): Promise<ScheduleItem> {
  const { data } = await api.put<ScheduleItem>(`/schedule/${id}`, payload)
  return data
}

/**
 * DELETE /schedule/{id}
 * Elimina un bloque de horario.
 * Auth: Requerida.
 */
export async function deleteSchedule(id: number): Promise<void> {
  await api.delete(`/schedule/${id}`)
}

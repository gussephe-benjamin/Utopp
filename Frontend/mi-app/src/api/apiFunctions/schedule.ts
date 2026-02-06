import api from "../axios"

export type ScheduleType = string

export interface ScheduleItem {
  id: number
  user_id: number
  day_of_week: number
  start_time: string
  end_time: string
  type: ScheduleType
}

export async function getSchedule(): Promise<ScheduleItem[]> {
  const { data } = await api.get<ScheduleItem[]>("/schedule")
  return data
}

export async function createSchedule(payload: {
  day_of_week: number
  start_time: string
  end_time: string
  type: ScheduleType
}): Promise<ScheduleItem> {
  const { data } = await api.post<ScheduleItem>("/schedule", payload)
  return data
}

export async function updateSchedule(id: number, payload: Partial<{
  day_of_week: number
  start_time: string
  end_time: string
  type: ScheduleType
}>): Promise<ScheduleItem> {
  const { data } = await api.put<ScheduleItem>(`/schedule/${id}`, payload)
  return data
}

export async function deleteSchedule(id: number): Promise<void> {
  await api.delete(`/schedule/${id}`)
}

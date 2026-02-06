import api from "../axios"

export async function getFeed(params: {
  tipo?: string[]
  tags?: string[]
  fecha_from?: string
  fecha_to?: string
  page?: number
  size?: number
}) {
  const { data } = await api.get("/feed", { params })
  return data
}

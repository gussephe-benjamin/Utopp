import api from "../axios"

export interface CommunityPostIn {
  content: string
  post_type?: string
  link_form?: string | null
  closing_date?: string | null
  required_roles?: string[]
  tags?: string[]
}

export async function listCommunityPosts(params?: { tags?: string[] }) {
  const { data } = await api.get("/community/posts", { params })
  return data
}

export async function createCommunityPost(payload: CommunityPostIn) {
  const { data } = await api.post("/community/posts", payload)
  return data
}

export async function updateCommunityPost(id: number, payload: Partial<CommunityPostIn>) {
  const { data } = await api.put(`/community/posts/${id}`, payload)
  return data
}

export async function deleteCommunityPost(id: number) {
  const { data } = await api.delete(`/community/posts/${id}`)
  return data
}

export async function recommendedCommunityPosts(params?: { tags?: string[]; page?: number; size?: number }) {
  const { data } = await api.get("/community/recommended", { params })
  return data
}

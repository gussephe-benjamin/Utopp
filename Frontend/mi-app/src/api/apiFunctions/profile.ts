import api from "../axios"

export async function getMyProfile() {
  const { data } = await api.get("/profile/me")
  return data
}

export async function getProfile(userId: number) {
  const { data } = await api.get(`/profile/${userId}`)
  return data
}

export async function follow(userId: number) {
  const { data } = await api.post(`/profile/follow/${userId}`)
  return data
}

export async function unfollow(userId: number) {
  const { data } = await api.delete(`/profile/follow/${userId}`)
  return data
}

export async function updateInterests(interests: string[]) {
  const { data } = await api.put(`/profile/interests`, { interests })
  return data
}

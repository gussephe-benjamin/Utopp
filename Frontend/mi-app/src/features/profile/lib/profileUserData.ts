import type { UserProfileResponse } from "../../../api/users.api"
import type { ProfileUserData } from "../views/types"

/** Normaliza la respuesta del API (campos `null`) al tipo usado en vistas de perfil. */
export function toProfileUserData(raw: UserProfileResponse): ProfileUserData {
  return {
    id: raw.id,
    email: raw.email,
    full_name: raw.full_name ?? undefined,
    role_name: raw.role_name,
    career: raw.career ?? undefined,
    cycle: raw.cycle ?? undefined,
    availability: raw.availability ?? undefined,
    interests: raw.interests ?? undefined,
    followers_count: raw.followers_count,
    following_count: raw.following_count,
    posts_count: raw.posts_count,
    profile_image_url: raw.profile_image_url ?? undefined,
    description: raw.description ?? undefined,
    contacts: raw.contacts ?? undefined,
  }
}

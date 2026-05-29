import type { OrganizationSummary } from "../../../api/users.api"

export type ProfileMode = "student-self" | "student-public" | "org-self" | "org-public"

export interface ProfileUserData {
  id: number
  full_name?: string
  email?: string
  role_name?: string
  career?: string
  cycle?: number
  availability?: number
  interests?: string[]
  followers_count?: number
  following_count?: number
  posts_count?: number
  profile_image_url?: string
  description?: string
  contacts?: Record<string, string>
  satisfaction_score?: number
  avg_students_per_event?: number
}

export interface StudentSharedProps {
  user: ProfileUserData
  avatarUrl: string | null
  organizationsFollowed: OrganizationSummary[]
}

import type { FeedPostOut, PostType, SubPostType, TimeStatus } from "../../../types/post.types"

interface SavedPostUser {
  id: number
  full_name?: string | null
  email?: string
  profile_image_url?: string | null
}

interface SavedPostImage {
  url: string
}

export interface SavedPostRaw {
  id: number
  user_id: number
  title?: string | null
  description: string
  post_type: PostType
  subtype?: SubPostType | null
  status?: string
  time_status?: TimeStatus
  tags?: string[] | null
  deadline_at?: string | null
  created_at: string
  is_pinned?: boolean
  pin_priority?: number
  user?: SavedPostUser | null
  images?: SavedPostImage[]
  links?: unknown[]
}

/**
 * Convierte la respuesta de `/users/me/saved-posts` (PostOut con relaciones anidadas)
 * al formato `FeedPostOut` que consume el componente `PostCard` del feed.
 */
export function mapSavedPostToFeedPost(raw: SavedPostRaw): FeedPostOut {
  const firstImage = raw.images && raw.images.length > 0 ? raw.images[0].url : undefined

  return {
    id: raw.id,
    user_id: raw.user_id,
    title: raw.title ?? undefined,
    description: raw.description,
    post_type: raw.post_type,
    subtype: raw.subtype ?? undefined,
    tags: raw.tags ?? undefined,
    deadline_at: raw.deadline_at ?? undefined,
    time_status: raw.time_status ?? "no_deadline",
    created_at: raw.created_at,
    user_name: raw.user?.full_name ?? undefined,
    user_email: raw.user?.email,
    user_profile_image_url: raw.user?.profile_image_url ?? undefined,
    image_url: firstImage,
    images_count: raw.images?.length ?? 0,
    links_count: raw.links?.length ?? 0,
    is_pinned: raw.is_pinned ?? false,
    pin_priority: raw.pin_priority ?? 0,
    is_saved: true,
    status: raw.status,
  }
}

import type { FeedPostOut, PostAspectRatio, PostType, SubPostType, TimeStatus } from "../../../types/post.types"

interface PostOutUser {
  id?: number
  full_name?: string | null
  email?: string
  profile_image_url?: string | null
}

interface PostOutImage {
  url: string
}

/** PostOut del backend (`/users/{id}/posts`, `/users/me/saved-posts`, etc.). */
export interface PostOutRaw {
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
  aspect_ratio?: PostAspectRatio | string
  is_pinned?: boolean
  pin_priority?: number
  user?: PostOutUser | null
  images?: PostOutImage[]
  links?: unknown[]
}

export type SavedPostRaw = PostOutRaw

type MapPostOutOptions = {
  is_saved?: boolean
}

/**
 * Convierte PostOut (relaciones anidadas) al formato `FeedPostOut` que consume `PostCard`.
 */
export function mapPostOutToFeedPost(raw: PostOutRaw, options: MapPostOutOptions = {}): FeedPostOut {
  const imageList = raw.images ?? []
  const firstImage = imageList.length > 0 ? imageList[0].url : undefined

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
    images_count: imageList.length,
    links_count: raw.links?.length ?? 0,
    is_pinned: raw.is_pinned ?? false,
    pin_priority: raw.pin_priority ?? 0,
    is_saved: options.is_saved ?? false,
    status: raw.status,
    aspect_ratio: (raw.aspect_ratio as PostAspectRatio | undefined) ?? undefined,
  }
}

/** Alias para posts guardados (`/users/me/saved-posts`). */
export function mapSavedPostToFeedPost(raw: PostOutRaw): FeedPostOut {
  return mapPostOutToFeedPost(raw, { is_saved: true })
}

/** Alias para posts de perfil (`/users/{id}/posts`). */
export function mapUserPostToFeedPost(raw: PostOutRaw): FeedPostOut {
  return mapPostOutToFeedPost(raw)
}

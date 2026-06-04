import type { FeedPostOut } from "../../../types/post.types"

export function filterEventsByQuery(posts: FeedPostOut[], query: string): FeedPostOut[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return posts

  return posts.filter((post) => {
    const title = (post.title ?? "").toLowerCase()
    const org = (post.user_name ?? "").toLowerCase()
    return title.includes(normalized) || org.includes(normalized)
  })
}

import type { FeedPostOut } from "../../../types/post.types"

export function filterPostsByQuery(posts: FeedPostOut[], query: string): FeedPostOut[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return posts

  return posts.filter((post) => {
    const title = (post.title ?? "").toLowerCase()
    const org = (post.user_name ?? "").toLowerCase()
    const description = (post.description ?? "").toLowerCase()
    return title.includes(normalized) || org.includes(normalized) || description.includes(normalized)
  })
}

/** @deprecated Usar filterPostsByQuery */
export const filterEventsByQuery = filterPostsByQuery

import type { FeedPostOut } from "../../../types/post.types"
import { PostCard } from "../../feed/components/PostCard"

interface ProfilePostItemProps {
  post: FeedPostOut
  currentUserId: number | null
  highlighted?: boolean
  onEdited?: (updated: FeedPostOut) => void
  onDeleted?: (id: number) => void
}

/** Publicación en perfil: mismo ancho fijo que el feed y centrada en la columna. */
export function ProfilePostItem({ post, highlighted = false, ...postCardProps }: ProfilePostItemProps) {
  return (
    <div className="flex justify-center">
      <div
        id={`post-${post.id}`}
        className={`w-full transition-all duration-1000 ${
          highlighted
            ? "rounded-[22px] ring-4 ring-violet-500/80 ring-offset-2 scale-[1.01] shadow-[0_0_20px_rgba(139,92,246,0.25)]"
            : ""
        }`}
      >
        <PostCard
          post={post}
          currentUserId={postCardProps.currentUserId}
          onEdited={postCardProps.onEdited ?? (() => {})}
          onDeleted={postCardProps.onDeleted}
        />
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from "react"
import { Loader2, Send, Trash2 } from "lucide-react"
import {
  listComments,
  createComment,
  deleteComment,
  type CommentOut,
} from "../../../api/comments.api"
import { timeAgo } from "../../../shared/lib/date"
import { ProfileAvatar } from "../../profile/components/ProfileAvatar"
import { TW_UTOPP_GRADIENT_BR } from "../../../shared/constants/brand"

type PostCommentsSectionProps = {
  postId: number
  currentUserId: number | null
  onCountChange?: (count: number) => void
}

function CommentAvatar({ name, url, userId }: { name?: string | null; url?: string | null; userId?: number }) {
  return (
    <ProfileAvatar
      name={name}
      userId={userId}
      imageUrl={url}
      size="xs"
      fallbackClassName={TW_UTOPP_GRADIENT_BR}
    />
  )
}

const COMMENT_MAX_LENGTH = 500

export function PostCommentsSection({ postId, currentUserId, onCountChange }: PostCommentsSectionProps) {
  const [comments, setComments] = useState<CommentOut[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const onCountChangeRef = useRef(onCountChange)
  useEffect(() => { onCountChangeRef.current = onCountChange }, [onCountChange])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    listComments(postId, { page: 1, size: 50 })
      .then(data => {
        if (cancelled) return
        setComments(data)
        onCountChangeRef.current?.(data.length)
      })
      .catch(() => {
        if (!cancelled) setError("No se pudieron cargar los comentarios.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [postId])

  const handleSubmit = async () => {
    const content = text.trim()
    if (!content || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const created = await createComment(postId, content)
      setComments(prev => {
        const next = [...prev, created]
        onCountChangeRef.current?.(next.length)
        return next
      })
      setText("")
    } catch {
      setError("No se pudo publicar el comentario.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId: number) => {
    try {
      await deleteComment(postId, commentId)
      setComments(prev => {
        const next = prev.filter(c => c.id !== commentId)
        onCountChangeRef.current?.(next.length)
        return next
      })
    } catch {
      setError("No se pudo eliminar el comentario.")
    }
  }

  return (
    <div className="space-y-3">
      {loading ? (
        <div className="flex items-center justify-center py-4 text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3 max-h-72 overflow-y-auto">
          {comments.length === 0 ? (
            <p className="py-2 text-center text-xs text-gray-400">
              Sé el primero en comentar.
            </p>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="flex items-start gap-2.5">
                <CommentAvatar
                  name={comment.user_name}
                  url={comment.user_profile_image_url}
                  userId={comment.user_id}
                />
                <div className="flex-1 rounded-2xl bg-gray-50 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-gray-800">
                      {comment.user_name ?? "Usuario"}
                    </span>
                    <span className="text-[10px] text-gray-400">{timeAgo(comment.created_at)}</span>
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-gray-700">
                    {comment.content}
                  </p>
                </div>
                {currentUserId !== null && comment.user_id === currentUserId && (
                  <button
                    type="button"
                    onClick={() => handleDelete(comment.id)}
                    className="mt-1 text-gray-300 transition-colors hover:text-red-500"
                    title="Eliminar comentario"
                    aria-label="Eliminar comentario"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {error && <p className="text-xs font-medium text-red-500">{error}</p>}

      {currentUserId !== null && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            maxLength={COMMENT_MAX_LENGTH}
            placeholder="Escribe un comentario..."
            className="flex-1 rounded-full border border-gray-200 bg-gray-50/60 px-4 py-2 text-sm text-gray-800 focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || text.trim().length === 0}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-white transition-colors hover:bg-violet-700 disabled:opacity-50 active:scale-95"
            aria-label="Enviar comentario"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      )}
    </div>
  )
}

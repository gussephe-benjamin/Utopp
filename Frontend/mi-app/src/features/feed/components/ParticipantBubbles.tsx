import { useEffect, useState } from "react"
import {
  listParticipants,
  getParticipantCounts,
  type ParticipantPublicOut,
  type ParticipantCounts,
} from "../../../api/participants.api"

const BUBBLE_COLORS = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981",
  "#3b82f6", "#8b5cf6", "#ef4444", "#14b8a6",
]

function colorFor(seed: string): string {
  let hash = 0
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return BUBBLE_COLORS[hash % BUBBLE_COLORS.length]
}

function initialsOf(name: string | null): string {
  if (!name?.trim()) return "?"
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ""
  const second = parts.length > 1 ? parts[parts.length - 1][0] : ""
  return (first + second).toUpperCase()
}

const MAX_VISIBLE = 5

/** Globitos de asistentes de un evento: participantes de Utopp + inscritos vía Utopp Formulario. */
export function ParticipantBubbles({ postId }: { postId: number }) {
  const [participants, setParticipants] = useState<ParticipantPublicOut[]>([])
  const [counts, setCounts] = useState<ParticipantCounts | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      listParticipants(postId, { size: MAX_VISIBLE + 1 }),
      getParticipantCounts(postId),
    ])
      .then(([list, c]) => {
        if (cancelled) return
        setParticipants(list)
        setCounts(c)
      })
      .catch(() => {
        /* noop: sin globitos si falla */
      })
    return () => {
      cancelled = true
    }
  }, [postId])

  if (!counts || counts.total === 0) return null

  const visible = participants.slice(0, MAX_VISIBLE)
  const extra = counts.total - visible.length

  const summaryParts: string[] = []
  const upcoming = counts.going + counts.interested
  if (upcoming > 0) summaryParts.push(`${upcoming} asistirá${upcoming === 1 ? "" : "n"}`)
  if (counts.attended > 0) summaryParts.push(`${counts.attended} ya asistieron`)

  return (
    <div className="flex items-center gap-2.5 px-4 pb-3">
      <div className="flex -space-x-2">
        {visible.map((p, i) => {
          const name = p.full_name ?? "Invitado"
          return p.avatar_url ? (
            <img
              key={i}
              src={p.avatar_url}
              alt={name}
              title={name}
              className="h-7 w-7 rounded-full border-2 border-white object-cover shadow-sm"
            />
          ) : (
            <div
              key={i}
              title={name}
              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white shadow-sm"
              style={{ backgroundColor: colorFor(name) }}
            >
              {initialsOf(p.full_name)}
            </div>
          )
        })}
        {extra > 0 && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-[10px] font-bold text-gray-600 shadow-sm">
            +{extra}
          </div>
        )}
      </div>
      <span className="text-xs font-semibold text-gray-500">
        {summaryParts.join(" · ")}
      </span>
    </div>
  )
}

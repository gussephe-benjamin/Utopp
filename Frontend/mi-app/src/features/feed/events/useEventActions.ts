import { useCallback, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import { savePost, unsavePost } from "../../../api/saved-posts.api"
import {
  participate,
  cancelParticipation,
  type ParticipantStatus,
} from "../../../api/participants.api"
import type { FeedPostOut } from "../../../types/post.types"

/**
 * Acciones compartidas de la sección Eventos: guardar (corazón) y participar.
 * Actualiza optimistamente la lista de eventos pasada por `setEvents`.
 */
export function useEventActions(setEvents: Dispatch<SetStateAction<FeedPostOut[]>>) {
  const [savingId, setSavingId] = useState<number | null>(null)
  const [participatingId, setParticipatingId] = useState<number | null>(null)

  const patchEvent = useCallback(
    (id: number, patch: Partial<FeedPostOut>) => {
      setEvents((prev) => prev.map((ev) => (ev.id === id ? { ...ev, ...patch } : ev)))
    },
    [setEvents],
  )

  const toggleSave = useCallback(
    async (event: FeedPostOut) => {
      if (savingId === event.id) return
      setSavingId(event.id)
      const next = !event.is_saved
      patchEvent(event.id, { is_saved: next })
      try {
        if (next) await savePost(event.id)
        else await unsavePost(event.id)
      } catch (err) {
        console.error("Error al guardar evento:", err)
        patchEvent(event.id, { is_saved: !next })
      } finally {
        setSavingId(null)
      }
    },
    [savingId, patchEvent],
  )

  const toggleParticipation = useCallback(
    async (event: FeedPostOut, status: ParticipantStatus = "going") => {
      if (participatingId === event.id) return
      setParticipatingId(event.id)
      const isParticipating = Boolean(event.participation_status)
      patchEvent(event.id, { participation_status: isParticipating ? undefined : status })
      try {
        if (isParticipating) await cancelParticipation(event.id)
        else await participate(event.id, status)
      } catch (err) {
        console.error("Error al participar en evento:", err)
        patchEvent(event.id, {
          participation_status: isParticipating ? event.participation_status : undefined,
        })
      } finally {
        setParticipatingId(null)
      }
    },
    [participatingId, patchEvent],
  )

  return { toggleSave, toggleParticipation, savingId, participatingId }
}

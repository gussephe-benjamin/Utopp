import { useEffect, useMemo, useRef, useState } from "react"
import ReactDOM from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { X, Users, Sparkles, ArrowUpRight, Orbit, Check, Plus } from "lucide-react"
import type { OrganizationSummary } from "../../../api/users.api"
import { UTOPP_LOGO_SRC, TW_UTOPP_GRADIENT_R } from "../../../shared/constants/brand"
import { getOrgAvatarStyle } from "../lib/weeklyHighlightUtils"
import { ProfileLink } from "../../profile/components/ProfileLink"

type OrgsOrbitalModalProps = {
  open: boolean
  onClose: () => void
  organizations: OrganizationSummary[]
  followedIds: Set<number>
  isStudent: boolean
  currentUserId: number | null
  actionLoadingId: number | null
  onFollowToggle: (orgId: number) => void
}

/** Grados por segundo de giro de la órbita (suave y constante via rAF). */
const SPIN_DEG_PER_SEC = 18

/**
 * Vista "galaxia" de organizaciones dentro de una tarjeta clara: las orgs
 * orbitan alrededor del logo de Utopp y giran de forma continua y fluida. Al
 * tocar una se abre una mini-tarjeta justo debajo de su logo (nombre,
 * seguidores y oportunidades) sin recolocar ni cerrar el resto de la órbita.
 */
export function OrgsOrbitalModal({
  open,
  onClose,
  organizations,
  followedIds,
  isStudent,
  currentUserId,
  actionLoadingId,
  onFollowToggle,
}: OrgsOrbitalModalProps) {
  const [rotation, setRotation] = useState(0)
  const rotationRef = useRef(0)
  const targetRef = useRef<number | null>(null)
  const [activeId, setActiveId] = useState<number | null>(null)

  // Escape para cerrar + bloqueo de scroll.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  // Reinicia al abrir.
  useEffect(() => {
    if (open) setActiveId(null)
  }, [open])

  // Giro continuo y fluido cuando no hay nada seleccionado.
  useEffect(() => {
    if (!open || activeId !== null) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      rotationRef.current = (rotationRef.current + SPIN_DEG_PER_SEC * dt) % 360
      setRotation(rotationRef.current)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [open, activeId])

  // Al seleccionar: lleva la org elegida hasta arriba (270°) con easing suave.
  useEffect(() => {
    if (!open || activeId === null || targetRef.current === null) return
    let raf = 0
    const tick = () => {
      const cur = rotationRef.current
      const tgt = targetRef.current as number
      const delta = tgt - cur
      if (Math.abs(delta) < 0.08) {
        rotationRef.current = tgt
        setRotation(tgt)
        return
      }
      rotationRef.current = cur + delta * 0.035
      setRotation(rotationRef.current)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [open, activeId])

  // Selecciona una org y calcula el giro necesario para subirla al tope.
  const selectOrg = (orgId: number, index: number) => {
    if (activeId === orgId) {
      setActiveId(null)
      return
    }
    const total = organizations.length
    const base = (index / total) * 360
    const current = rotationRef.current
    let diff = (((270 - base - current) % 360) + 360) % 360
    if (diff > 180) diff -= 360 // toma el camino más corto
    targetRef.current = current + diff
    setActiveId(orgId)
  }

  // Radio de la órbita según cuántas orgs haya (tarjeta más grande).
  const radius = useMemo(() => {
    const n = organizations.length
    if (n <= 6) return 180
    if (n <= 10) return 205
    return 220
  }, [organizations.length])

  if (typeof document === "undefined") return null

  return ReactDOM.createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-fuchsia-500 text-white shadow-sm">
                  <Orbit className="h-4.5 w-4.5" />
                </span>
                <div>
                  <h3 className="text-base font-bold leading-tight text-gray-900">
                    Organizaciones en Utopp
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    {organizations.length} comunidades · toca una para conocerla
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Galaxia orbital (ocupa toda la tarjeta) */}
            <div
              onClick={() => setActiveId(null)}
              className="relative flex min-h-[600px] flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-violet-50 via-white to-blue-50"
            >
              {/* Resplandor central tenue */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 50% 50%, rgba(124,58,237,0.10) 0%, transparent 60%)",
                }}
              />

              <div
                className="relative flex items-center justify-center"
                style={{ width: radius * 2 + 110, height: radius * 2 + 110 }}
              >
                {/* Anillos de la órbita */}
                <div
                  className="absolute rounded-full border border-violet-200/70"
                  style={{ width: radius * 2, height: radius * 2 }}
                />
                <div
                  className="absolute rounded-full border border-dashed border-violet-200/40"
                  style={{ width: radius * 2 + 56, height: radius * 2 + 56 }}
                />

                {/* Centro: logo de Utopp */}
                <div className="absolute z-20 flex items-center justify-center">
                  <div className="absolute h-20 w-20 animate-ping rounded-full border border-violet-400/30 opacity-60" />
                  <div
                    className="absolute h-28 w-28 animate-ping rounded-full border border-blue-400/20 opacity-40"
                    style={{ animationDelay: "0.6s" }}
                  />
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-full ${TW_UTOPP_GRADIENT_R} shadow-[0_0_30px_rgba(124,58,237,0.45)]`}
                  >
                    <img
                      src={UTOPP_LOGO_SRC}
                      alt="Utopp"
                      className="h-10 w-10 object-contain drop-shadow"
                    />
                  </div>
                </div>

                {/* Nodos (organizaciones) */}
                {organizations.map((org, index) => {
                  const total = organizations.length
                  const angle = ((index / total) * 360 + rotation) % 360
                  const rad = (angle * Math.PI) / 180
                  const x = radius * Math.cos(rad)
                  const y = radius * Math.sin(rad)
                  // Profundidad: los de "delante" (cos alto) algo más opacos.
                  const depthOpacity = Math.max(0.7, Math.min(1, 0.7 + 0.3 * ((1 + Math.sin(rad)) / 2)))
                  const zIndex = Math.round(100 + 50 * Math.cos(rad))
                  const isActive = activeId === org.id
                  // La mini-tarjeta se coloca arriba si el nodo está en la mitad inferior.
                  const placeAbove = y > 0
                  const initial = (org.full_name ?? "O").charAt(0).toUpperCase()
                  const isFollowing = followedIds.has(org.id)

                  return (
                    <div
                      key={org.id}
                      className="absolute left-1/2 top-1/2"
                      style={{
                        transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                        zIndex: isActive ? 300 : zIndex,
                        opacity: isActive ? 1 : depthOpacity,
                        transition: "opacity 0.3s",
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        selectOrg(org.id, index)
                      }}
                    >
                      {/* Halo */}
                      <div
                        className={`absolute -inset-2 rounded-full ${isActive ? "animate-pulse" : ""}`}
                        style={{
                          background:
                            "radial-gradient(circle, rgba(167,139,250,0.30) 0%, rgba(167,139,250,0) 70%)",
                        }}
                      />

                      {/* Avatar */}
                      <button
                        type="button"
                        aria-label={org.full_name ?? "Organización"}
                        className={`relative flex items-center justify-center rounded-full border-2 bg-white transition-transform duration-200 ${
                          isActive
                            ? "scale-110 border-violet-500 shadow-[0_0_22px_rgba(124,58,237,0.45)]"
                            : "border-white shadow-md hover:scale-110 hover:border-violet-300"
                        }`}
                        style={{ height: "3.75rem", width: "3.75rem" }}
                      >
                        {org.profile_image_url ? (
                          <img
                            src={org.profile_image_url}
                            alt={org.full_name ?? "Organización"}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <span
                            className={`flex h-full w-full items-center justify-center rounded-full text-lg font-bold ${getOrgAvatarStyle(org.id)}`}
                          >
                            {initial}
                          </span>
                        )}
                      </button>

                      {/* Nombre bajo el nodo (se oculta cuando está activo: lo muestra la tarjeta) */}
                      {!isActive && (
                        <div className="absolute left-1/2 top-[3.9rem] w-32 -translate-x-1/2 truncate text-center text-[11px] font-semibold tracking-wide text-gray-500">
                          {org.full_name}
                        </div>
                      )}

                      {/* Mini-tarjeta de detalle (debajo o encima del logo) */}
                      {isActive && (
                        <div
                          className={`absolute left-1/2 z-[310] w-64 -translate-x-1/2 ${
                            placeAbove ? "bottom-full mb-3.5" : "top-full mt-3.5"
                          } animate-in fade-in zoom-in-95 duration-200`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="relative overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-[0_12px_40px_-8px_rgba(124,58,237,0.35)]">
                            {/* Conector */}
                            <span
                              className={`absolute left-1/2 z-10 h-3.5 w-px -translate-x-1/2 bg-violet-200 ${
                                placeAbove ? "top-full" : "bottom-full"
                              }`}
                            />
                            {/* Cinta superior de marca */}
                            <div className={`h-1.5 w-full ${TW_UTOPP_GRADIENT_R}`} />

                            <div className="p-4">
                              {/* Nombre + verificado */}
                              <div className="flex items-center gap-1.5">
                                <h4 className="flex-1 truncate text-[15px] font-bold leading-tight text-gray-900">
                                  {org.full_name}
                                </h4>
                                <svg
                                  className="h-4 w-4 shrink-0 fill-current text-blue-500"
                                  viewBox="0 0 24 24"
                                  aria-hidden
                                >
                                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                </svg>
                              </div>

                              {/* Seguidores · Oportunidades */}
                              <div className="mt-3 flex gap-2">
                                <div className="flex-1 rounded-xl bg-violet-50 px-2 py-2 text-center">
                                  <p className="text-lg font-extrabold leading-none text-violet-600">
                                    {org.followers_count ?? 0}
                                  </p>
                                  <div className="mt-1 flex items-center justify-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-violet-400">
                                    <Users className="h-2.5 w-2.5" /> Seguidores
                                  </div>
                                </div>
                                <div className="flex-1 rounded-xl bg-blue-50 px-2 py-2 text-center">
                                  <p className="text-lg font-extrabold leading-none text-blue-600">
                                    {org.posts_count ?? 0}
                                  </p>
                                  <div className="mt-1 flex items-center justify-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-blue-400">
                                    <Sparkles className="h-2.5 w-2.5" /> Oportun.
                                  </div>
                                </div>
                              </div>

                              {/* Acciones (apiladas, mejor UI) */}
                              <div className="mt-3.5 space-y-2">
                                {isStudent && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onFollowToggle(org.id)
                                    }}
                                    disabled={actionLoadingId === org.id}
                                    className={`flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-[13px] font-bold transition-all active:scale-[0.98] ${
                                      isFollowing
                                        ? "border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                                        : `${TW_UTOPP_GRADIENT_R} text-white shadow-md shadow-violet-300/40 hover:brightness-110`
                                    }`}
                                  >
                                    {actionLoadingId === org.id ? (
                                      "..."
                                    ) : isFollowing ? (
                                      <>
                                        <Check className="h-4 w-4" /> Siguiendo
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="h-4 w-4" /> Seguir
                                      </>
                                    )}
                                  </button>
                                )}
                                <ProfileLink
                                  userId={org.id}
                                  currentUserId={currentUserId}
                                  onClick={onClose}
                                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-[13px] font-bold text-violet-600 transition-colors hover:bg-violet-50"
                                >
                                  Ver perfil <ArrowUpRight className="h-3.5 w-3.5" />
                                </ProfileLink>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

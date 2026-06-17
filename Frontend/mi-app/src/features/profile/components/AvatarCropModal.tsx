import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2, X } from "lucide-react"
import { parseObjectPositionPercent } from "../../../shared/lib/avatarUtils"
import { exportCroppedAvatar } from "../lib/exportCroppedAvatar"
import { Button } from "../../../components/ui/button"
import { TW_UTOPP_GRADIENT_R } from "../../../shared/constants/brand"

type AvatarCropModalProps = {
  file: File | null
  saving?: boolean
  onClose: () => void
  onConfirm: (file: File) => Promise<void>
}

function AvatarCropEditor({
  previewUrl,
  objectPosition,
  scale,
  onPositionChange,
  onScaleChange,
}: {
  previewUrl: string
  objectPosition: string
  scale: number
  onPositionChange: (value: string) => void
  onScaleChange: (value: number) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)

  const [rawX = "50%", rawY = "50%"] = objectPosition.split(" ")
  const posX = parseObjectPositionPercent(rawX)
  const posY = parseObjectPositionPercent(rawY)
  const objPos = `${posX}% ${posY}%`

  const startPan = (x: number, y: number) => {
    isDragging.current = true
    setIsPanning(true)
    lastPos.current = { x, y }
  }

  const movePan = (x: number, y: number) => {
    if (!isDragging.current) return
    const dx = x - lastPos.current.x
    const dy = y - lastPos.current.y
    lastPos.current = { x, y }

    const w = containerRef.current?.offsetWidth ?? 280
    const h = containerRef.current?.offsetHeight ?? 280
    const newX = Math.max(0, Math.min(100, posX - (dx / w) * 100))
    const newY = Math.max(0, Math.min(100, posY - (dy / h) * 100))
    onPositionChange(`${newX.toFixed(2)}% ${newY.toFixed(2)}%`)
  }

  const endPan = () => {
    isDragging.current = false
    setIsPanning(false)
  }

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className="relative mx-auto aspect-square w-full max-w-[280px] cursor-move overflow-hidden rounded-2xl bg-slate-100 shadow-inner select-none"
        onMouseDown={(e) => {
          e.preventDefault()
          startPan(e.clientX, e.clientY)
        }}
        onMouseMove={(e) => movePan(e.clientX, e.clientY)}
        onMouseUp={endPan}
        onMouseLeave={endPan}
        onTouchStart={(e) => startPan(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => {
          e.preventDefault()
          movePan(e.touches[0].clientX, e.touches[0].clientY)
        }}
        onTouchEnd={endPan}
      >
        <img
          src={previewUrl}
          alt=""
          draggable={false}
          className="pointer-events-none h-full w-full object-cover"
          style={{
            objectPosition: objPos,
            transform: `scale(${scale})`,
            transformOrigin: objPos,
            transition: isPanning ? "none" : "transform 0.12s ease",
          }}
        />
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-white/80 ring-inset" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[88%] w-[88%] rounded-full border-2 border-dashed border-white/70 shadow-[0_0_0_9999px_rgba(15,23,42,0.18)]" />
        </div>
        <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-[10px] font-medium text-white">
          Arrastra para mover · Ajusta el zoom
        </p>
      </div>

      <div className="flex items-center gap-3 px-1">
        <span className="text-xs font-medium text-slate-500">Zoom</span>
        <input
          type="range"
          min="1"
          max="3"
          step="0.05"
          value={scale}
          onChange={(e) => onScaleChange(parseFloat(e.target.value))}
          className="h-1.5 flex-1 accent-violet-600"
        />
        <span className="w-8 text-right text-xs text-slate-500">{scale.toFixed(1)}×</span>
      </div>
    </div>
  )
}

export function AvatarCropModal({ file, saving = false, onClose, onConfirm }: AvatarCropModalProps) {
  const open = file !== null
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [objectPosition, setObjectPosition] = useState("50% 50%")
  const [scale, setScale] = useState(1)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      setObjectPosition("50% 50%")
      setScale(1)
      setError(null)
      return
    }

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const handleConfirm = useCallback(async () => {
    if (!file || !previewUrl) return
    setExporting(true)
    setError(null)
    try {
      const cropped = await exportCroppedAvatar(previewUrl, { objectPosition, scale })
      await onConfirm(cropped)
      onClose()
    } catch {
      setError("No se pudo procesar la imagen. Intenta con otro archivo.")
    } finally {
      setExporting(false)
    }
  }, [file, previewUrl, objectPosition, scale, onConfirm, onClose])

  if (!open) return null

  const busy = saving || exporting

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-crop-title"
        className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 id="avatar-crop-title" className="text-base font-bold text-slate-900">
              Ajustar foto de perfil
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">Mueve y haz zoom para encuadrar tu foto.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-5">
          {previewUrl ? (
            <AvatarCropEditor
              previewUrl={previewUrl}
              objectPosition={objectPosition}
              scale={scale}
              onPositionChange={setObjectPosition}
              onScaleChange={setScale}
            />
          ) : null}
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="flex gap-3 border-t border-slate-100 px-5 py-4">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onClose}
            className="h-11 flex-1 rounded-2xl"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={busy || !previewUrl}
            onClick={() => void handleConfirm()}
            className={`h-11 flex-1 rounded-2xl ${TW_UTOPP_GRADIENT_R} text-white`}
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : "Guardar foto"}
          </Button>
        </div>
      </div>
    </div>
  )
}

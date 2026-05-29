import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { type WizardImage } from '../types/post.types'
import {
  POST_ASPECT_RATIO_OPTIONS,
  aspectRatioValue,
  type PostAspectRatio,
} from '../shared/lib/aspectRatio'

interface StepFrameEditorProps {
  images: WizardImage[]
  aspectRatio: PostAspectRatio
  onAspectRatioChange: (ratio: PostAspectRatio) => void
  onUpdate: (images: WizardImage[]) => void
}

/**
 * Paso de formato y encuadre — estilo Instagram.
 * El usuario elige un formato (1:1, 4:5 o 1.91:1) que aplica a TODAS las
 * imágenes de la publicación, y por cada imagen arrastra para mover el punto
 * focal y usa el slider de zoom. Los valores (objectPosition, scale) y el
 * aspect_ratio se persisten y se usan tal cual en el feed.
 */
export default function StepFrameEditor({ images, aspectRatio, onAspectRatioChange, onUpdate }: StepFrameEditorProps) {
  const readyImages = images.filter(img => img.status === 'done' && img.cloudinaryUrl)
  const [currentIdx, setCurrentIdx] = useState(0)

  if (readyImages.length === 0) return null

  const img = readyImages[Math.min(currentIdx, readyImages.length - 1)]

  const updateImg = (patch: Partial<WizardImage>) => {
    onUpdate(images.map(i => i.tempId === img.tempId ? { ...i, ...patch } : i))
  }

  const canPrev = currentIdx > 0
  const canNext = currentIdx < readyImages.length - 1
  const goTo    = (idx: number) => setCurrentIdx(Math.max(0, Math.min(readyImages.length - 1, idx)))

  const arrowClass = (enabled: boolean) =>
    `w-10 h-10 rounded-full flex items-center justify-center border transition-colors shrink-0 ${
      enabled
        ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm cursor-pointer'
        : 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed'
    }`

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-sm font-semibold text-gray-700">Elige el formato y ajusta el encuadre</h3>
        <p className="text-xs text-gray-400 mt-0.5">El formato aplica a todas las imágenes · Arrastra para mover · Slider para zoom</p>
      </div>

      {/* Selector de formato (aspect ratio) — único para toda la publicación */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
          {POST_ASPECT_RATIO_OPTIONS.map(opt => {
            const active = opt.value === aspectRatio
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onAspectRatioChange(opt.value)}
                className={`flex flex-col items-center gap-0.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? 'bg-white text-[#4F46E5] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                aria-pressed={active}
              >
                <span>{opt.label}</span>
                <span className={`text-[10px] font-medium ${active ? 'text-[#4F46E5]/70' : 'text-gray-400'}`}>{opt.hint}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Contador de imágenes */}
      {readyImages.length > 1 && (
        <p className="text-xs text-gray-400 text-center font-medium">
          Imagen {currentIdx + 1} de {readyImages.length}
        </p>
      )}

      {/* Fila principal: [← flecha] [editor] [→ flecha] */}
      <div className="flex items-center gap-3 w-full max-w-[460px] mx-auto">
        <button
          onClick={() => goTo(currentIdx - 1)}
          disabled={!canPrev}
          className={arrowClass(canPrev)}
          aria-label="Imagen anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex-1">
          <CropEditor img={img} aspectRatio={aspectRatio} onUpdate={updateImg} />
        </div>

        <button
          onClick={() => goTo(currentIdx + 1)}
          disabled={!canNext}
          className={arrowClass(canNext)}
          aria-label="Imagen siguiente"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Dots indicadores */}
      {readyImages.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {readyImages.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all ${
                i === currentIdx ? 'w-5 h-2 bg-[#4F46E5]' : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Sub-componente: editor de encuadre ──────────────────────

interface CropEditorProps {
  img: WizardImage
  aspectRatio: PostAspectRatio
  onUpdate: (patch: Partial<WizardImage>) => void
}

/** Parses a percentage string safely — returns fallback if zero or NaN */
function parsePct(s: string | undefined, fallback = 50): number {
  if (s === undefined || s === '') return fallback
  const n = parseFloat(s)
  return isNaN(n) ? fallback : n
}

/**
 * Editor de encuadre con pan + zoom para el formato elegido.
 * - Drag → cambia objectPosition (sin snap-to-center al llegar a 0%)
 * - Zoom slider → cambia scale, anclado al punto focal actual (transformOrigin)
 * - El frame visible ES exactamente lo que se publica (mismo CSS en el feed)
 */
function CropEditor({ img, aspectRatio, onUpdate }: CropEditorProps) {
  const containerRef              = useRef<HTMLDivElement>(null)
  const isDragging                = useRef(false)
  const lastPos                   = useRef({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)

  const scale = img.scale ?? 1
  const ratioValue = aspectRatioValue(aspectRatio)

  // Parse objectPosition safely — fix: parseFloat('0%') === 0, and 0 || 50 wrongly returns 50
  const [rawX = '50%', rawY = '50%'] = (img.objectPosition ?? '50% 50%').split(' ')
  const posX = parsePct(rawX)
  const posY = parsePct(rawY)
  const objPos = `${posX}% ${posY}%`

  // ── Pan ─────────────────────────────────────────────────

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

    const w = containerRef.current?.offsetWidth  ?? 300
    const h = containerRef.current?.offsetHeight ?? 375

    // Drag right → image moves right → less of right side visible → focal X decreases
    const newX = Math.max(0, Math.min(100, posX - (dx / w) * 100))
    const newY = Math.max(0, Math.min(100, posY - (dy / h) * 100))

    onUpdate({ objectPosition: `${newX.toFixed(2)}% ${newY.toFixed(2)}%` })
  }

  const endPan = () => { isDragging.current = false; setIsPanning(false) }

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => { e.preventDefault(); startPan(e.clientX, e.clientY) }
  const onMouseMove = (e: React.MouseEvent) => movePan(e.clientX, e.clientY)
  const onMouseUp   = () => endPan()

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => startPan(e.touches[0].clientX, e.touches[0].clientY)
  const onTouchMove  = (e: React.TouchEvent) => { e.preventDefault(); movePan(e.touches[0].clientX, e.touches[0].clientY) }
  const onTouchEnd   = () => endPan()

  return (
    <div className="space-y-2">
      {/* Viewport de recorte con el formato elegido — overflow:hidden hace el crop real */}
      <div
        ref={containerRef}
        className="relative w-full bg-gray-200 rounded-xl overflow-hidden cursor-move select-none shadow-md mx-auto"
        style={{ aspectRatio: ratioValue, maxWidth: ratioValue >= 1 ? '100%' : '340px' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={img.cloudinaryUrl!}
          alt="Encuadre"
          className="w-full h-full object-cover pointer-events-none"
          draggable={false}
          style={{
            objectPosition: objPos,
            transform:       `scale(${scale})`,
            transformOrigin: objPos,          // zoom se ancla al punto focal
            transition:      isPanning ? 'none' : 'transform 0.12s ease',
          }}
        />
        {/* Indicador del punto focal */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-5 h-5 rounded-full border-2 border-white/70 bg-black/10 shadow-sm" />
        </div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full pointer-events-none whitespace-nowrap">
          Lo que se publicará
        </div>
      </div>

      {/* Slider de zoom */}
      <div className="flex items-center gap-2">
        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="range"
          min="1"
          max="3"
          step="0.05"
          value={scale}
          onChange={e => onUpdate({ scale: parseFloat(e.target.value) })}
          className="flex-1 accent-[#4F46E5] h-1.5"
        />
        <span className="text-xs text-gray-500 w-7 shrink-0 text-right">{scale.toFixed(1)}×</span>
      </div>
    </div>
  )
}

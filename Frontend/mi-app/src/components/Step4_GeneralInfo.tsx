import { useRef, useState, useCallback, useEffect } from 'react'
import { type WizardImage } from '../types/post.types'
import { uploadToCloudinary } from '../api/cloudinary'

interface Step4GeneralInfoProps {
  title: string
  description: string
  deadline_at: string   // string ISO YYYY-MM-DD, vacío si no aplica
  images: WizardImage[]
  /** Indica si el tipo de publicación requiere deadline obligatorio (ej: announcement) */
  requiresDeadline?: boolean
  onChange: (data: { title: string; description: string; deadline_at: string }) => void
  onImagesChange: (images: WizardImage[]) => void
}

export default function Step4GeneralInfo({
  title,
  description,
  deadline_at,
  images,
  requiresDeadline = false,
  onChange,
  onImagesChange,
}: Step4GeneralInfoProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Controla si el usuario está arrastrando un archivo sobre la zona de drop
  const [isDragOver, setIsDragOver] = useState(false)
  // Índice del thumbnail que se está arrastrando para reordenar
  const dragIndexRef = useRef<number | null>(null)

  // Referencia siempre actualizada al array de imágenes del padre.
  // Se usa dentro de funciones async para evitar el problema de "stale closure"
  // (donde una función captura una versión antigua del estado).
  const latestImages = useRef(images)
  useEffect(() => { latestImages.current = images }, [images])

  /** Procesa los archivos seleccionados o soltados, los sube a Cloudinary y
   *  actualiza el estado de cada imagen individualmente al completarse. */
  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return
    const allowed = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!allowed.length) return

    // Crear entradas inmediatamente con status 'uploading' para feedback visual
    const newImages: WizardImage[] = allowed.map(file => ({
      tempId: crypto.randomUUID(),
      file,
      // Object URL para preview local inmediato (no requiere subida previa)
      previewUrl: URL.createObjectURL(file),
      status: 'uploading' as const,
    }))

    // Agregar al estado del padre antes de iniciar las subidas
    const updated = [...images, ...newImages]
    onImagesChange(updated)

    // Subir cada imagen a Cloudinary de forma asíncrona
    newImages.forEach(async (img) => {
      try {
        const result = await uploadToCloudinary(img.file!)
        // Usar latestImages.current para no sobreescribir actualizaciones paralelas
        onImagesChange(
          latestImages.current.map(i =>
            i.tempId === img.tempId
              ? { ...i, status: 'done', cloudinaryId: result.public_id, cloudinaryUrl: result.secure_url }
              : i
          )
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al subir'
        onImagesChange(
          latestImages.current.map(i =>
            i.tempId === img.tempId ? { ...i, status: 'error', errorMsg: message } : i
          )
        )
      }
    })
  }, [images, onImagesChange])

  // ── Drag-and-drop para SOLTAR IMÁGENES ─────────────────

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => setIsDragOver(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  // ── Drag-and-drop para REORDENAR thumbnails ────────────

  /** Inicia el drag de un thumbnail para reordenar */
  const handleThumbDragStart = (index: number) => {
    dragIndexRef.current = index
  }

  /** Al soltar sobre otro thumbnail, intercambia posiciones */
  const handleThumbDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    const fromIndex = dragIndexRef.current
    if (fromIndex === null || fromIndex === targetIndex) return

    const reordered = [...images]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(targetIndex, 0, moved)
    dragIndexRef.current = null
    onImagesChange(reordered)
  }

  /** Elimina una imagen de la lista por su tempId */
  const removeImage = (tempId: string) => {
    onImagesChange(images.filter(img => img.tempId !== tempId))
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">

      {/* Campo: Título */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Título <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={e => onChange({ title: e.target.value, description, deadline_at })}
          maxLength={200}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Título de la publicación"
        />
        <div className="text-xs text-gray-400 mt-1 text-right">{title.length}/200</div>
      </div>

      {/* Campo: Descripción */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descripción <span className="text-red-500">*</span>
        </label>
        <textarea
          value={description}
          onChange={e => onChange({ title, description: e.target.value, deadline_at })}
          rows={5}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          placeholder="Describe tu publicación..."
        />
        <div className="text-xs text-gray-400 mt-1">
          {description.trim().split(/\s+/).filter(Boolean).length} palabras
        </div>
      </div>

      {/* Campo: Fecha límite (opcional salvo announcement) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fecha límite {requiresDeadline && <span className="text-red-500">*</span>}
          {!requiresDeadline && <span className="text-gray-400 font-normal"> (opcional)</span>}
        </label>
        <input
          type="date"
          value={deadline_at}
          onChange={e => onChange({ title, description, deadline_at: e.target.value })}
          min={today}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <div className="text-xs text-gray-400 mt-1">
          Fecha hasta la que el post es relevante
        </div>
      </div>

      {/* Sección: Subir imágenes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Imágenes <span className="text-gray-400 font-normal">(opcional)</span>
        </label>

        {/* Zona de drag-and-drop para soltar imágenes */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            isDragOver
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
          }`}
        >
          <div className="text-3xl mb-2">🖼️</div>
          <p className="text-sm font-medium text-gray-700">Arrastra imágenes aquí</p>
          <p className="text-xs text-gray-400 mt-1">o haz clic para seleccionar desde tu dispositivo</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />
        </div>

        {/* Thumbnails de imágenes subidas/subiendo — arrastra para reordenar */}
        {images.length > 0 && (
          <div className="mt-4 space-y-4">
            <p className="text-xs text-gray-500">
              Arrastra los thumbnails para cambiar el orden · Haz clic en <span className="font-medium">Editar encuadre</span> para ajustar formato y recorte visual
            </p>
            <div className="flex flex-wrap gap-3">
              {images.map((img, index) => (
                <ImageThumbnail
                  key={img.tempId}
                  img={img}
                  index={index}
                  onDragStart={() => handleThumbDragStart(index)}
                  onDrop={(e: React.DragEvent) => handleThumbDrop(e, index)}
                  onRemove={() => removeImage(img.tempId)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sub-componente: thumbnail (reorder + delete, sin editor inline) ──

interface ImageThumbnailProps {
  img: WizardImage
  index: number
  onDragStart: () => void
  onDrop: (e: React.DragEvent) => void
  onRemove: () => void
}

/** Thumbnail draggable con indicador de estado y botón de eliminar. */
function ImageThumbnail({ img, index, onDragStart, onDrop, onRemove }: ImageThumbnailProps) {
  const objPos = img.objectPosition ?? 'center center'

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={e => e.preventDefault()}
      onDrop={onDrop}
      className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-200 cursor-grab active:cursor-grabbing group"
    >
      <img
        src={img.previewUrl}
        alt={`Imagen ${index + 1}`}
        className="w-full h-full object-cover"
        style={{ objectPosition: objPos }}
      />

      {img.status === 'uploading' && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {img.status === 'error' && (
        <div className="absolute inset-0 bg-red-500/70 flex items-center justify-center">
          <span className="text-white text-xs text-center px-1">{img.errorMsg ?? 'Error'}</span>
        </div>
      )}
      {img.status === 'done' && (
        <div className="absolute top-1 right-1">
          <span className="bg-green-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">✓</span>
        </div>
      )}
      <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs rounded px-1">{index + 1}</div>
      <button
        onClick={e => { e.stopPropagation(); onRemove() }}
        className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
        title="Eliminar imagen"
      >
        ×
      </button>
    </div>
  )
}

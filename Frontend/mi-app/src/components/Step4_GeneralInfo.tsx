import { useRef, useState, useCallback, useEffect } from 'react'
import { ImageIcon } from 'lucide-react'
import { type WizardImage } from '../types/post.types'
import { uploadToCloudinary } from '../api/cloudinary'
import { INTERESTS } from '../constants/interests'
import {
  countWords,
  POST_DESCRIPTION_MAX_WORDS,
} from '../shared/lib/wordCount'

interface Step4GeneralInfoProps {
  title: string
  description: string
  deadline_at: string   // string ISO YYYY-MM-DDTHH:mm o YYYY-MM-DD
  images: WizardImage[]
  tags?: string[]
  /** Indica si el tipo de publicación requiere deadline obligatorio (ej: announcement) */
  requiresDeadline?: boolean
  /** Oculta el campo de título (ej: publicaciones simples sin título) */
  hideTitle?: boolean
  /** Oculta el campo de fecha límite (ej: publicaciones simples) */
  hideDeadline?: boolean
  onChange: (data: { title: string; description: string; deadline_at: string }) => void
  onImagesChange: (images: WizardImage[]) => void
  onTagsChange?: (tags: string[]) => void
}

export default function Step4GeneralInfo({
  title,
  description,
  deadline_at,
  images,
  tags = [],
  requiresDeadline = false,
  hideTitle = false,
  hideDeadline = false,
  onChange,
  onImagesChange,
  onTagsChange,
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

  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}T${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
  const descriptionWordCount = countWords(description)
  const descriptionTooLong = descriptionWordCount > POST_DESCRIPTION_MAX_WORDS
  const descriptionInvalid = descriptionTooLong

  return (
    <div className="space-y-6">

      {/* Campo: Título */}
      {!hideTitle && (
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
      )}

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
          <span className={descriptionInvalid ? 'font-semibold text-red-600' : 'text-gray-400'}>
            {descriptionWordCount} palabras
          </span>{' '}
          <span className={descriptionInvalid ? 'text-red-500' : 'text-gray-400'}>
            (máx. {POST_DESCRIPTION_MAX_WORDS})
          </span>
        </div>
      </div>

      {/* Campo: Fecha límite (opcional salvo announcement) */}
      <div className={hideDeadline ? 'hidden' : ''}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fecha límite {requiresDeadline && <span className="text-red-500">*</span>}
          {!requiresDeadline && <span className="text-gray-400 font-normal"> (opcional)</span>}
        </label>
        <input
          type="datetime-local"
          value={deadline_at}
          onChange={e => onChange({ title, description, deadline_at: e.target.value })}
          min={today}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <div className="text-xs text-gray-400 mt-1">
          Fecha y hora hasta la que el post es relevante
        </div>
      </div>

      {/* Sección: Tags (intereses) */}
      {onTagsChange && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags <span className="text-gray-400 font-normal">(opcional, máx. 6)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map(interest => {
              const active = tags.includes(interest.id)
              const IconComponent = interest.icon
              return (
                <button
                  key={interest.id}
                  type="button"
                  onClick={() => {
                    if (active) {
                      onTagsChange(tags.filter(t => t !== interest.id))
                    } else if (tags.length < 6) {
                      onTagsChange([...tags, interest.id])
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    active
                      ? 'bg-purple-100 text-purple-700 border-purple-300'
                      : tags.length >= 6
                        ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                  disabled={!active && tags.length >= 6}
                >
                  <IconComponent className="w-3.5 h-3.5 shrink-0" />
                  {interest.label}
                </button>
              )
            })}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {tags.length}/6 seleccionados
          </div>
        </div>
      )}

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
          <div className="flex justify-center mb-2">
            <ImageIcon className="w-10 h-10 text-gray-400" />
          </div>
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

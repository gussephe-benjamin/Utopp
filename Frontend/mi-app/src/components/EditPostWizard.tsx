import { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Pin } from 'lucide-react'
import { useRole, ROLE_ADMIN, ROLE_ROOT, ROLE_OFICINA } from '../hooks/useRole'
import { updatePost } from '../api/posts.api'
import {
  listImages, addImage, deleteImage, reorderImages,
  type PostImage,
} from '../api/post-images.api'
import {
  listLinks, addLink, deleteLink, reorderLinks, updateLink,
  type LinkCreate,
} from '../api/post-links.api'
import {
  type WizardImage, type WizardLink,
  type PostType, type SubPostType, type PostLinkType,
} from '../types/post.types'
import Step3LinksForm from './Step3_LinksForm'
import Step4GeneralInfo from './Step4_GeneralInfo'
import StepFrameEditor from './StepFrameEditor'
import Step5Preview from './Step5_Preview'
import ModernStepper from './ModernStepper'
import {
  countWords,
  isPostDescriptionWordCountValid,
  POST_DESCRIPTION_MAX_WORDS,
} from '../shared/lib/wordCount'

interface PostItem {
  id: number
  title?: string
  description: string
  post_type: string
  subtype?: string
  status: string
  time_status?: string
  tags?: string[]
  deadline_at?: string
  created_at: string
  is_pinned?: boolean
}

interface EditPostWizardProps {
  post: PostItem | null
  onClose: () => void
  onSaved: (updated: PostItem) => void
}

// ── Helpers ──────────────────────────────────────────────────

function toTempId(backendId: number) { return `existing:${backendId}` }
function parseBackendId(tempId: string): number | null {
  if (!tempId.startsWith('existing:')) return null
  const n = parseInt(tempId.slice(9), 10)
  return isNaN(n) ? null : n
}

function isoToDatetimeLocal(value?: string | null): string {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ── Componente principal ─────────────────────────────────────

export default function EditPostWizard({ post, onClose, onSaved }: EditPostWizardProps) {
  const postId = post?.id ?? null

  // ── Form state ──────────────────────────────────────────────
  const [title, setTitle]           = useState(post?.title ?? '')
  const [description, setDescription] = useState(post?.description ?? '')
  const [deadlineAt, setDeadlineAt] = useState(isoToDatetimeLocal(post?.deadline_at))
  const [tags, setTags]             = useState<string[]>(post?.tags ?? [])
  const [isPinned, setIsPinned]     = useState(post?.is_pinned ?? false)
  const { roleName } = useRole()
  const canPin = roleName === ROLE_ADMIN || roleName === ROLE_ROOT || roleName === ROLE_OFICINA
  const [images, setImages]         = useState<WizardImage[]>([])
  const [links, setLinks]           = useState<WizardLink[]>([])

  // ── Loading / saving state ───────────────────────────────────
  const [loading, setLoading]           = useState(true)
  const [currentStep, setCurrentStep]   = useState(1)
  const [saving, setSaving]             = useState(false)
  const [saveProgress, setSaveProgress] = useState<string | null>(null)
  const [saveError, setSaveError]       = useState<string | null>(null)

  // ── Dirty tracking + exit confirm ──────────────────────────
  const [dirty, setDirty]                   = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const initialLoadDone = useRef(false)
  const markDirty = () => { if (initialLoadDone.current) setDirty(true) }

  // ── Track initial backend data for diffing on save ──────────
  const initialImages = useRef<PostImage[]>([])
  const initialLinks  = useRef<Array<{ id: number; label: string; url: string; type: string; display_type: string; position: number }>>([])

  // ── Lock body scroll ─────────────────────────────────────────
  useEffect(() => {
    if (!postId) return
    const w = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    document.body.style.paddingRight = `${w}px`
    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }, [postId])

  // ── Load initial data ────────────────────────────────────────
  useEffect(() => {
    if (!postId || !post) return
    setTitle(post.title ?? '')
    setDescription(post.description)
    setDeadlineAt(isoToDatetimeLocal(post.deadline_at))
    setTags(post.tags ?? [])
    setCurrentStep(1)
    setSaveError(null)
    setLoading(true)

    Promise.all([
      listImages(postId).catch(() => [] as PostImage[]),
      listLinks(postId).catch(() => []),
    ]).then(([imgs, lnks]) => {
      initialImages.current = imgs as PostImage[]
      initialLinks.current  = lnks

      const wizImages: WizardImage[] = (imgs as PostImage[])
        .sort((a, b) => a.position - b.position)
        .map(img => ({
          tempId:        toTempId(img.id),
          previewUrl:    img.url,
          cloudinaryUrl: img.url,
          cloudinaryId:  img.cloudinary_id,
          status:        'done' as const,
          objectPosition: img.object_position ?? 'center center',
          scale:          img.scale ?? 1,
        }))

      const wizLinks: WizardLink[] = lnks
        .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
        .map((lnk: { id: number; label: string; url: string; type: string; display_type: string; position: number }) => ({
          tempId:       toTempId(lnk.id),
          label:        lnk.label,
          url:          lnk.url,
          type:         lnk.type as PostLinkType,
          display_type: lnk.display_type as 'button' | 'link',
          position:     lnk.position,
        }))

      setImages(wizImages)
      setLinks(wizLinks)
    }).catch(console.error)
      .finally(() => { setLoading(false); initialLoadDone.current = true; setDirty(false) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId])

  // ── Step logic ───────────────────────────────────────────────
  const readyImages = images.filter(img => img.status === 'done' && img.cloudinaryUrl)
  const hasImages   = readyImages.length > 0
  const TOTAL_STEPS = hasImages ? 4 : 3    // Links, Info, [Frame,] Preview
  const PREVIEW_STEP = TOTAL_STEPS
  const descriptionWordCount = countWords(description)
  const descriptionWordCountValid = isPostDescriptionWordCountValid(description)

  const canAdvance = (): boolean => {
    if (currentStep === 1) return true
    if (currentStep === 2) {
      return (
        description.trim().length > 0 &&
        descriptionWordCountValid &&
        !images.some(img => img.status === 'uploading')
      )
    }
    return true
  }

  const handleNext = () => {
    if (canAdvance() && currentStep < TOTAL_STEPS) setCurrentStep(s => s + 1)
  }

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(s => s - 1)
  }

  const tryClose = () => {
    if (dirty) { setShowExitConfirm(true); return }
    onClose()
  }

  const handleImagesChange = (imgs: WizardImage[]) => { setImages(imgs); markDirty() }
  const handleLinksChange  = (lnks: WizardLink[]) => { setLinks(lnks); markDirty() }

  // ── Save ──────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!postId || !post) return
    if (!descriptionWordCountValid) {
      setSaveError(
        `La descripción debe tener como máximo ${POST_DESCRIPTION_MAX_WORDS} palabras. Actualmente tiene ${descriptionWordCount}.`,
      )
      return
    }
    setSaving(true)
    setSaveError(null)

    try {
      // 1. Patch core fields
      setSaveProgress('Guardando datos...')
      const updated = await updatePost(postId, {
        title:       title.trim() || undefined,
        description: description.trim(),
        tags:        tags.length > 0 ? tags : undefined,
        ...(deadlineAt ? { deadline_at: new Date(deadlineAt).toISOString() } : { deadline_at: null }),
        is_pinned: isPinned,
      })

      // 2. Image diff
      const finalTempIds  = new Set(images.map(i => i.tempId))
      const initialIdMap  = new Map(initialImages.current.map(img => [toTempId(img.id), img]))

      // 2a. Deleted images
      for (const initImg of initialImages.current) {
        if (!finalTempIds.has(toTempId(initImg.id))) {
          setSaveProgress('Eliminando imágenes...')
          await deleteImage(postId, initImg.id).catch(console.error)
        }
      }

      // 2b. New images (no backendId)
      const newImages = images.filter(img => parseBackendId(img.tempId) === null && img.status === 'done' && img.cloudinaryId && img.cloudinaryUrl)
      if (newImages.length > 0) setSaveProgress(`Agregando imágenes (${newImages.length})...`)
      for (let i = 0; i < newImages.length; i++) {
        const img = newImages[i]
        await addImage(postId, {
          cloudinary_id:   img.cloudinaryId!,
          url:             img.cloudinaryUrl!,
          position:        images.indexOf(img),
          object_position: img.objectPosition,
          scale:           img.scale,
        })
      }

      // 2c. Existing images with changed crop → delete + re-add
      const cropChanged = images.filter(img => {
        const bid = parseBackendId(img.tempId)
        if (!bid) return false
        const orig = initialIdMap.get(img.tempId)
        if (!orig) return false
        return (
          (img.objectPosition ?? 'center center') !== (orig.object_position ?? 'center center') ||
          (img.scale ?? 1) !== (orig.scale ?? 1)
        )
      })
      for (const img of cropChanged) {
        const bid = parseBackendId(img.tempId)!
        setSaveProgress('Actualizando encuadre...')
        await deleteImage(postId, bid).catch(console.error)
        await addImage(postId, {
          cloudinary_id:   img.cloudinaryId ?? img.cloudinaryUrl!,
          url:             img.cloudinaryUrl!,
          position:        images.indexOf(img),
          object_position: img.objectPosition,
          scale:           img.scale,
        })
      }

      // 2d. Reorder remaining existing images (that didn't get crop-deleted)
      const reorderList = images
        .filter(img => {
          const bid = parseBackendId(img.tempId)
          return bid !== null && !cropChanged.some(c => c.tempId === img.tempId)
        })
        .map((img, idx) => ({ image_id: parseBackendId(img.tempId)!, position: idx }))
      if (reorderList.length > 1) {
        setSaveProgress('Reordenando imágenes...')
        await reorderImages(postId, reorderList).catch(console.error)
      }

      // 3. Link diff
      const finalLinkTempIds = new Set(links.map(l => l.tempId))
      const initLinkMap = new Map(initialLinks.current.map(l => [toTempId(l.id), l]))

      // 3a. Deleted links
      for (const initLink of initialLinks.current) {
        if (!finalLinkTempIds.has(toTempId(initLink.id))) {
          setSaveProgress('Eliminando links...')
          await deleteLink(postId, initLink.id).catch(console.error)
        }
      }

      // 3b. New links
      const newLinks = links.filter(l => parseBackendId(l.tempId) === null)
      if (newLinks.length > 0) setSaveProgress(`Agregando links (${newLinks.length})...`)
      for (const lnk of newLinks) {
        await addLink(postId, {
          label:        lnk.label,
          url:          lnk.url,
          type:         lnk.type,
          display_type: lnk.display_type,
          position:     links.indexOf(lnk),
        } as LinkCreate)
      }

      // 3c. Updated existing links
      for (const lnk of links) {
        const bid = parseBackendId(lnk.tempId)
        if (!bid) continue
        const orig = initLinkMap.get(lnk.tempId)
        if (!orig) continue
        if (orig.label !== lnk.label || orig.url !== lnk.url || orig.display_type !== lnk.display_type) {
          setSaveProgress('Actualizando links...')
          await updateLink(postId, bid, { label: lnk.label, url: lnk.url, display_type: lnk.display_type }).catch(console.error)
        }
      }

      // 3d. Reorder existing links
      const reorderLinkList = links
        .filter(l => parseBackendId(l.tempId) !== null)
        .map((l, idx) => ({ link_id: parseBackendId(l.tempId)!, position: idx }))
      if (reorderLinkList.length > 1) {
        setSaveProgress('Reordenando links...')
        await reorderLinks(postId, reorderLinkList).catch(console.error)
      }

      onSaved({ ...post, ...updated, title: title.trim() || undefined, tags, deadline_at: updated.deadline_at })
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar los cambios')
    } finally {
      setSaving(false)
      setSaveProgress(null)
    }
  }

  // We will handle the early return inside the portal rendering

  const renderStep = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
          <div className="w-5 h-5 border-2 border-gray-200 border-t-purple-500 rounded-full animate-spin" />
          <span className="text-sm">Cargando publicación...</span>
        </div>
      )
    }

    switch (currentStep) {
      case 1:
        return (
          <Step3LinksForm
            links={links}
            onChange={handleLinksChange}
          />
        )
      case 2:
        return (
          <Step4GeneralInfo
            title={title}
            description={description}
            deadline_at={deadlineAt}
            images={images}
            tags={tags}
            requiresDeadline={post.post_type === 'announcement'}
            onChange={d => {
              setTitle(d.title)
              setDescription(d.description)
              setDeadlineAt(d.deadline_at)
              markDirty()
            }}
            onImagesChange={handleImagesChange}
            onTagsChange={t => { setTags(t); markDirty() }}
          />
        )
      case 3:
        if (hasImages) {
          return <StepFrameEditor images={images} onUpdate={handleImagesChange} />
        }
        return (
          <Step5Preview
            postType={post.post_type as PostType}
            subtype={(post.subtype ?? '') as SubPostType | ''}
            title={title}
            description={description}
            deadline_at={deadlineAt}
            images={images}
            links={links}
          />
        )
      case 4:
        return (
          <Step5Preview
            postType={post.post_type as PostType}
            subtype={(post.subtype ?? '') as SubPostType | ''}
            title={title}
            description={description}
            deadline_at={deadlineAt}
            images={images}
            links={links}
          />
        )
      default:
        return null
    }
  }

  const stepLabel = loading ? 'Cargando...' :
    currentStep === 1 ? 'Links' :
    currentStep === 2 ? 'Contenido' :
    hasImages && currentStep === 3 ? 'Encuadre' : 'Vista previa'

  return ReactDOM.createPortal(
    <AnimatePresence>
      {(post && postId) && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] flex items-center justify-center p-4" onClick={tryClose}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className={`relative isolate bg-white rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col ${currentStep === PREVIEW_STEP ? 'max-h-[95vh]' : 'max-h-[90vh]'}`} onClick={e => e.stopPropagation()}
          >

        {/* Header */}
        <div className="pt-3 pb-1 px-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Editar publicación</h2>
              <p className="text-xs text-gray-400 mt-0.5">{stepLabel}</p>
            </div>
            <button
              onClick={tryClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="mt-1 mb-2">
            <ModernStepper currentStep={currentStep} totalSteps={TOTAL_STEPS} onStepClick={() => {}} />
          </div>
        </div>

        {/* Unsaved-changes banner */}
        {showExitConfirm && (
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between gap-3">
            <p className="text-sm text-amber-800">Tienes cambios sin guardar. ¿Salir de todas formas?</p>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setShowExitConfirm(false)} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors">Cancelar</button>
              <button onClick={onClose} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors">Salir</button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {saveError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {saveError}
            </div>
          )}
          {currentStep === 2 && !descriptionWordCountValid ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              La descripción debe tener como máximo {POST_DESCRIPTION_MAX_WORDS} palabras.
            </div>
          ) : null}
          {renderStep()}
        </div>

        {/* Navigation */}
        {!loading && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex justify-between items-center gap-2 sm:gap-4">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="px-3 py-2 sm:px-6 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium"
              >
                Anterior
              </button>

              {/* Toggle prioridad máxima — solo para admin/root/oficina */}
              {canPin && (
                <button
                  type="button"
                  onClick={() => { setIsPinned(v => !v); markDirty() }}
                  className={`flex items-center justify-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-[10px] sm:text-xs font-semibold border transition-all min-w-max ${
                    isPinned
                      ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-amber-400 hover:text-amber-600'
                  }`}
                  title="Prioridad máxima: siempre aparece primero en el feed"
                >
                  <Pin className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{isPinned ? 'Prioritario' : 'Prioridad máxima'}</span>
                </button>
              )}

              {currentStep === PREVIEW_STEP ? (
                <button
                  onClick={handleSave}
                  disabled={
                    saving ||
                    images.some(img => img.status === 'uploading') ||
                    !descriptionWordCountValid
                  }
                  className="px-3 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed sm:min-w-[160px] text-sm sm:text-base font-medium whitespace-nowrap"
                >
                  {saving ? (saveProgress ?? 'Guardando...') : 'Guardar'}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={!canAdvance()}
                  className="px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium"
                >
                  Siguiente
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>,
document.body
)
}

import { useReducer, useState, useEffect } from 'react'
import { Pin } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRole, ROLE_ADMIN, ROLE_ROOT, ROLE_OFICINA } from '../hooks/useRole'
import {
  type PostType,
  type SubPostType,
  type WizardImage,
  type WizardLink,
  type WizardFormData,
  normalizeWizardLinks,
} from '../types/post.types'
import Step1TypeSelection from './Step1_TypeSelection'
import Step2SubtypeSelection from './Step2_SubtypeSelection'
import Step3LinksForm from './Step3_LinksForm'
import Step4GeneralInfo from './Step4_GeneralInfo'
import StepFrameEditor from './StepFrameEditor'
import Step5Preview from './Step5_Preview'
import ModernStepper from './ModernStepper'
import { trackEvent } from '../features/analytics/analyticsTracker'
import { createPost, createSimplePost, publishPost } from '../api/posts.api'
import { addImage } from '../api/post-images.api'
import { addLink } from '../api/post-links.api'
import {
  countWords,
  isPostDescriptionWordCountValid,
  POST_DESCRIPTION_MAX_WORDS,
} from '../shared/lib/wordCount'
import { DEFAULT_POST_ASPECT_RATIO, normalizeAspectRatio, type PostAspectRatio } from '../shared/lib/aspectRatio'
import { formatApiError } from '../shared/lib/apiError'
import { openUtoppFormularioSso } from '../shared/lib/utoppFormularioUrl'

// Estado inicial vacío del formulario
const initialFormData: WizardFormData = {
  post_type: '',
  subtype: '',
  links: [],
  images: [],
  title: '',
  description: '',
  deadline_at: '',
  tags: [],
  aspect_ratio: DEFAULT_POST_ASPECT_RATIO,
}

// Acciones del reducer para actualizar el estado del wizard
type WizardAction =
  | { type: 'SET_POST_TYPE'; payload: PostType }
  | { type: 'SET_SUBTYPE'; payload: SubPostType }
  | { type: 'SET_LINKS'; payload: WizardLink[] }
  | { type: 'SET_IMAGES'; payload: WizardImage[] }
  | { type: 'SET_GENERAL_INFO'; payload: { title: string; description: string; deadline_at: string } }
  | { type: 'SET_TAGS'; payload: string[] }
  | { type: 'SET_ASPECT_RATIO'; payload: PostAspectRatio }
  | { type: 'RESET' }

/** Reducer puro que maneja todas las actualizaciones de estado del formulario */
function wizardReducer(state: WizardFormData, action: WizardAction): WizardFormData {
  switch (action.type) {
    case 'SET_POST_TYPE':
      // Al cambiar el tipo, resetear el subtipo para forzar nueva selección
      return { ...state, post_type: action.payload, subtype: '' }
    case 'SET_SUBTYPE':
      return { ...state, subtype: action.payload }
    case 'SET_LINKS':
      return { ...state, links: action.payload }
    case 'SET_IMAGES':
      return { ...state, images: action.payload }
    case 'SET_GENERAL_INFO':
      return { ...state, ...action.payload }
    case 'SET_TAGS':
      return { ...state, tags: action.payload }
    case 'SET_ASPECT_RATIO':
      return { ...state, aspect_ratio: action.payload }
    case 'RESET':
      return initialFormData
    default:
      return state
  }
}

interface PublicationWizardProps {
  isOpen: boolean
  onClose: () => void
  allowedTypes?: PostType[]
}

const DEFAULT_SIMPLE_POST_SUBTYPE: SubPostType = 'informativo'

/**
 * Wizard de 5 pasos para crear y publicar un post.
 *
 * Flujo completo:
 *   Paso 1: Seleccionar tipo de publicación
 *   Paso 2: Seleccionar subtipo
 *   Paso 3: Configurar enlaces/botones de acción
 *   Paso 4: Escribir título, descripción, subir imágenes y fijar deadline
 *   Paso 5: Vista previa → clic en "Publicar" llama al backend:
 *           (a) POST /posts/        → crea borrador, obtiene post.id
 *           (b) POST /posts/{id}/images  → registra cada imagen en el backend
 *           (c) POST /posts/{id}/links   → registra cada enlace
 *           (d) POST /posts/{id}/publish → cambia status a published
 */
export default function PublicationWizard({ isOpen, onClose, allowedTypes }: PublicationWizardProps) {
  const [formData, dispatch] = useReducer(wizardReducer, initialFormData)
  const [currentStep, setCurrentStep] = useState(1)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const { roleName } = useRole()
  const canPin = roleName === ROLE_ADMIN || roleName === ROLE_ROOT || roleName === ROLE_OFICINA
  // Mensaje de progreso durante la publicación (visible en el botón)
  const [publishProgress, setPublishProgress] = useState<string | null>(null)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [showConfirmClose, setShowConfirmClose] = useState(false)

  const handleOpenUtoppFormulario = () => {
    setPublishError(null)
    openUtoppFormularioSso()
      .then(() => onClose())
      .catch(() => {
        setPublishError('No se pudo abrir Utopp Formulario. Intenta de nuevo.')
      })
  }

  // Bloquear el scroll del body mientras el modal está abierto
  useEffect(() => {
    if (!isOpen) return
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    document.body.style.paddingRight = `${scrollbarWidth}px`
    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }, [isOpen])

  const singleAllowedType =
    allowedTypes && allowedTypes.length === 1 ? allowedTypes[0] : null
  const skipsTypeStep = singleAllowedType !== null

  // Al abrir, preconfigurar el único tipo permitido (p. ej. alumnos → simple_post)
  useEffect(() => {
    if (!isOpen) return
    dispatch({ type: 'RESET' })
    setCurrentStep(1)
    setPublishError(null)
    setPublishProgress(null)
    setShowConfirmClose(false)
    setIsPinned(false)

    if (singleAllowedType) {
      dispatch({ type: 'SET_POST_TYPE', payload: singleAllowedType })
      if (singleAllowedType === 'simple_post') {
        dispatch({ type: 'SET_SUBTYPE', payload: DEFAULT_SIMPLE_POST_SUBTYPE })
      }
    }
  }, [isOpen, singleAllowedType])

  // Determina si el paso actual es válido para permitir avanzar
  // Imágenes listas (subidas a Cloudinary) que habilitan el paso de encuadre
  const readyImages = formData.images.filter(img => img.status === 'done' && img.cloudinaryUrl)
  const hasImages   = readyImages.length > 0

  // Flujo de pasos (internos): 1=Tipo, 2=Subtipo, 3=Links, 4=Info,
  // 5=FrameEditor (solo con imágenes), 6=Preview.
  //   Anuncios omiten el paso 2 (subtipo).
  //   Publicaciones simples (alumnos) omiten el paso 3 (enlaces).
  //   Un solo tipo permitido omite pasos 1 (tipo) y 2 (subtipo).
  const skipsSubtypeStep = formData.post_type === 'announcement' || skipsTypeStep
  const skipsLinksStep = formData.post_type === 'simple_post'
  const isSimplePost = formData.post_type === 'simple_post'

  const contentInternalSteps = [1, 2, 3, 4].filter(
    step =>
      !(step === 1 && skipsTypeStep) &&
      !(step === 2 && skipsSubtypeStep) &&
      !(step === 3 && skipsLinksStep),
  )
  const tailInternalSteps = hasImages ? [5, 6] : [5]
  const displaySteps = [...contentInternalSteps, ...tailInternalSteps]

  const TOTAL_STEPS = displaySteps.length
  const PREVIEW_STEP = TOTAL_STEPS

  const wizardStepFromDisplay = (displayStep: number): number =>
    displaySteps[displayStep - 1] ?? displayStep

  const descriptionWordCount = countWords(formData.description)
  const descriptionWordCountValid = isPostDescriptionWordCountValid(formData.description)

  const canAdvance = (): boolean => {
    const step = wizardStepFromDisplay(currentStep)
    switch (step) {
      case 1: return formData.post_type !== ''
      case 2: return formData.subtype !== ''
      case 3: return true // Los links son opcionales
      case 4:
        return (
          // Las publicaciones simples no requieren título
          (isSimplePost || formData.title.trim().length > 0) &&
          formData.description.trim().length > 0 &&
          descriptionWordCountValid &&
          !formData.images.some(img => img.status === 'uploading')
        )
      case 5: return true // Frame editor siempre puede avanzar
      case 6: return true
      default: return false
    }
  }

  const handleNext = () => {
    if (canAdvance() && currentStep < TOTAL_STEPS) setCurrentStep(s => s + 1)
  }

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(s => s - 1)
  }

  // Detecta si el usuario ingresó algo (para mostrar confirmación al cerrar)
  const hasChanges = () => {
    const contentChanged =
      formData.title.trim() !== '' ||
      formData.description.trim() !== '' ||
      formData.links.length > 0 ||
      formData.images.length > 0 ||
      formData.tags.length > 0

    if (skipsTypeStep) return contentChanged
    return formData.post_type !== '' || contentChanged
  }

  const handleClose = () => {
    if (hasChanges()) {
      setShowConfirmClose(true)
    } else {
      handleForceClose()
    }
  }

  const handleForceClose = () => {
    dispatch({ type: 'RESET' })
    setCurrentStep(1)
    setPublishError(null)
    setPublishProgress(null)
    setShowConfirmClose(false)
    onClose()
  }

  /**
   * Ejecuta el flujo completo de publicación en 4 pasos secuenciales:
   * draft → imágenes → links → publish
   */
  const handlePublish = async () => {
    if (!formData.post_type) return
    if (formData.post_type !== 'announcement' && !isSimplePost && !formData.subtype) return
    if (!descriptionWordCountValid) {
      setPublishError(
        `La descripción debe tener como máximo ${POST_DESCRIPTION_MAX_WORDS} palabras. Actualmente tiene ${descriptionWordCount}.`,
      )
      return
    }

    setIsPublishing(true)
    setPublishError(null)

    try {
      // 1. Crear el post en estado draft
      setPublishProgress('Creando publicación...')
      // Las publicaciones simples (alumnos) usan su endpoint dedicado: sin título.
      const post = isSimplePost
        ? await createSimplePost({
            subtype: (formData.subtype || DEFAULT_SIMPLE_POST_SUBTYPE) as string,
            description: formData.description,
            tags: formData.tags.length > 0 ? formData.tags : undefined,
          })
        : await createPost({
            title: formData.title,
            description: formData.description,
            post_type: formData.post_type,
            ...(formData.subtype ? { subtype: formData.subtype } : {}),
            deadline_at: formData.deadline_at ? new Date(formData.deadline_at).toISOString() : undefined,
            is_pinned: isPinned,
            tags: formData.tags.length > 0 ? formData.tags : undefined,
            aspect_ratio: normalizeAspectRatio(formData.aspect_ratio),
          })

      const postId: number = post.id

      // 2. Registrar imágenes (solo las que subieron exitosamente a Cloudinary)
      const readyImages = formData.images.filter(
        img => img.status === 'done' && img.cloudinaryId && img.cloudinaryUrl
      )
      if (readyImages.length > 0) {
        setPublishProgress(`Guardando imágenes (${readyImages.length})...`)
        for (let i = 0; i < readyImages.length; i++) {
          const img = readyImages[i]
          await addImage(postId, {
            cloudinary_id: img.cloudinaryId!,
            url: img.cloudinaryUrl!,
            position: i,
            object_position: img.objectPosition,
            scale: img.scale,
          })
        }
      }

      // 3. Registrar enlaces (las publicaciones simples no admiten enlaces)
      if (!isSimplePost && formData.links.length > 0) {
        const linksToSave = normalizeWizardLinks(formData.links)
        setPublishProgress(`Guardando enlaces (${linksToSave.length})...`)
        for (const link of linksToSave) {
          await addLink(postId, {
            label: link.label,
            url: link.url,
            type: link.type,
            display_type: link.display_type,
            position: link.position,
          })
        }
      }

      // 4. Publicar el post → aparece en el feed
      setPublishProgress('Publicando...')
      await publishPost(postId)

      trackEvent("post_created", { post_id: postId })

      // Éxito: resetear wizard y cerrar
      dispatch({ type: 'RESET' })
      setCurrentStep(1)
      setPublishProgress(null)
      onClose()

      // Notificar al Feed para que recargue los posts
      window.dispatchEvent(new CustomEvent('postPublished'))

    } catch (err) {
      setPublishError(formatApiError(err, 'Error desconocido al publicar'))
      setPublishProgress(null)
    } finally {
      setIsPublishing(false)
    }
  }

  // Renderiza el contenido del paso actual
  const renderStep = () => {
    switch (wizardStepFromDisplay(currentStep)) {
      case 1:
        return (
          <Step1TypeSelection
            selectedType={formData.post_type}
            onSelectType={type => dispatch({ type: 'SET_POST_TYPE', payload: type })}
            allowedTypes={allowedTypes}
            onOpenUtoppFormulario={handleOpenUtoppFormulario}
          />
        )
      case 2:
        return (
          <Step2SubtypeSelection
            publicationType={formData.post_type as PostType}
            selectedSubtype={formData.subtype as SubPostType | ''}
            onSelectSubtype={sub => dispatch({ type: 'SET_SUBTYPE', payload: sub })}
          />
        )
      case 3:
        return (
          <Step3LinksForm
            links={formData.links}
            onChange={links => dispatch({ type: 'SET_LINKS', payload: links })}
          />
        )
      case 4:
        return (
          <Step4GeneralInfo
            title={formData.title}
            description={formData.description}
            deadline_at={formData.deadline_at}
            images={formData.images}
            tags={formData.tags}
            requiresDeadline={false}
            hideTitle={isSimplePost}
            hideDeadline={isSimplePost}
            onChange={data => dispatch({ type: 'SET_GENERAL_INFO', payload: data })}
            onImagesChange={images => dispatch({ type: 'SET_IMAGES', payload: images })}
            onTagsChange={tags => dispatch({ type: 'SET_TAGS', payload: tags })}
          />
        )
      case 5:
        // Con imágenes → editor de encuadre; sin imágenes → preview directamente
        if (hasImages) {
          return (
            <StepFrameEditor
              images={formData.images}
              aspectRatio={formData.aspect_ratio}
              onAspectRatioChange={ratio => dispatch({ type: 'SET_ASPECT_RATIO', payload: ratio })}
              onUpdate={images => dispatch({ type: 'SET_IMAGES', payload: images })}
            />
          )
        }
        // fallthrough to preview
        return (
          <Step5Preview
            postType={formData.post_type as PostType}
            subtype={formData.subtype as SubPostType | ''}
            title={formData.title}
            description={formData.description}
            deadline_at={formData.deadline_at}
            images={formData.images}
            links={formData.links}
            tags={formData.tags}
            aspectRatio={formData.aspect_ratio}
          />
        )
      case 6:
        return (
          <Step5Preview
            postType={formData.post_type as PostType}
            subtype={formData.subtype as SubPostType | ''}
            title={formData.title}
            description={formData.description}
            deadline_at={formData.deadline_at}
            images={formData.images}
            links={formData.links}
            tags={formData.tags}
            aspectRatio={formData.aspect_ratio}
          />
        )
      default:
        return null
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className={`relative isolate bg-white rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col ${currentStep === PREVIEW_STEP ? 'max-h-[95vh]' : 'max-h-[90vh]'}`}
          >

        {/* Encabezado con título y stepper */}
        <div className={`pt-3 pb-1 px-6 border-b border-gray-100 ${showConfirmClose ? 'pointer-events-none select-none' : ''}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {skipsTypeStep ? 'Nueva publicación' : 'Crear Publicación'}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-1 mb-2">
            <ModernStepper currentStep={currentStep} totalSteps={TOTAL_STEPS} onStepClick={() => {}} />
          </div>
        </div>

        {/* Área de contenido del paso actual */}
        <div className={`p-6 flex-1 overflow-y-auto ${showConfirmClose ? 'pointer-events-none select-none' : ''}`}>
          {publishError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {publishError}
            </div>
          )}
          {wizardStepFromDisplay(currentStep) === 4 && !descriptionWordCountValid ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              La descripción debe tener como máximo {POST_DESCRIPTION_MAX_WORDS} palabras.
            </div>
          ) : null}
          {renderStep()}
        </div>

        {/* Botones de navegación */}
        <div className={`px-6 py-4 border-t border-gray-200 ${showConfirmClose ? 'pointer-events-none select-none' : ''}`}>
          <div className="flex justify-between items-center gap-2 sm:gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="px-3 py-2 sm:px-6 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium"
            >
              Anterior
            </button>

            {/* Toggle de prioridad máxima — solo para admin/root/oficina */}
            {canPin && (
              <button
                type="button"
                onClick={() => setIsPinned(v => !v)}
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
              // En el último paso el botón publica directamente
              <button
                onClick={handlePublish}
                disabled={
                  isPublishing ||
                  formData.images.some(img => img.status === 'uploading') ||
                  !descriptionWordCountValid
                }
                className="px-3 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed sm:min-w-[140px] text-sm sm:text-base font-medium whitespace-nowrap"
              >
                {isPublishing ? (publishProgress ?? 'Publicando...') : 'Publicar'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canAdvance()}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium"
              >
                Siguiente
              </button>
            )}
          </div>
        </div>

        {/* Confirmación de cierre cuando hay cambios sin guardar */}
        {showConfirmClose && (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm rounded-2xl flex items-center justify-center p-4">
            <div className="relative z-[51] bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">¿Cerrar sin guardar?</h3>
              </div>
              <p className="text-gray-500 text-sm mb-6">
                Perderás todo el progreso de esta publicación.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmClose(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleForceClose}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// @ts-check
// @filename: PublicationWizard.tsx
// Este archivo es el único archivo que debe modificarse en este contexto
// NO modificar otros archivos bajo ninguna circunstancia

import { useState, useReducer } from 'react'
import Step1TypeSelection from './Step1_TypeSelection'
import Step2SubtypeSelection from './Step2_SubtypeSelection'
import Step3CTAForm from './Step3_LinksForm'
import Step4GeneralInfo from './Step4_GeneralInfo'
import Step6Publication from './Step6_Publication'
import ModernStepper from './ModernStepper'
import { useEffect } from "react"

// Tipos para el formulario
interface CTAItem 
{
  id: string
  label: string
  url: string
}

interface PublicationFormData {
  // Paso 1-2: Tipo y Subtipo
  publication_type: string
  subtype: string
  
  // Paso 3: CTAs (Botones de acción)
  ctas: CTAItem[]
  
  // Paso 4: Información General
  title: string
  content: string
  deadline?: Date
  
  specific_fields?: any  

  // Metadatos
  user_id: number
  current_step: number
  is_valid: boolean
}

// Estado inicial
const initialState: PublicationFormData = {
  publication_type: '',
  subtype: '',
  ctas: [
    { id: crypto.randomUUID(), label: '¡Aplica ahora!', url: '' },
    { id: crypto.randomUUID(), label: 'Más información', url: '' }
  ],
  specific_fields: {},   
  title: '',
  content: '',
  deadline: undefined,
  user_id: 0,
  current_step: 1,
  is_valid: false
}

// Acciones del reducer
type PublicationAction = 
  | { type: 'SET_TYPE'; payload: { publication_type: string; subtype: string } }
  | { type: 'SET_CTAS'; payload: CTAItem[] }
  | { type: 'SET_GENERAL_INFO'; payload: { title: string; content: string; deadline?: Date } }
  | { type: 'SET_USER_ID'; payload: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'RESET' }

// Reducer para manejar el estado
function publicationReducer(state: PublicationFormData, action: PublicationAction): PublicationFormData {
  switch (action.type) {
    case 'SET_TYPE':
      return {
        ...state,
        publication_type: action.payload.publication_type,
        subtype: action.payload.subtype
      }
    
    case 'SET_CTAS':
      return { ...state, ctas: action.payload }
    
    case 'SET_GENERAL_INFO':
      return {
        ...state,
        title: action.payload.title,
        content: action.payload.content,
        deadline: action.payload.deadline
      }
    
    case 'SET_USER_ID':
      return { ...state, user_id: action.payload }
    
    case 'NEXT_STEP':
      return { ...state, current_step: Math.min(state.current_step + 1, 5) }
    
    case 'PREV_STEP':
      return { ...state, current_step: Math.max(state.current_step - 1, 1) }
    
    case 'SET_STEP':
      return { ...state, current_step: Math.max(1, Math.min(5, action.payload)) }
    
    

    case 'RESET':
      return initialState
    
    default:
      return state
  }
}

interface PublicationWizardProps {
  isOpen: boolean
  onClose: () => void
  initialUserId?: number
}

export default function PublicationWizard({ isOpen, onClose, initialUserId = 0 }: PublicationWizardProps) {
  const [formData, dispatch] = useReducer(publicationReducer, initialState)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirmClose, setShowConfirmClose] = useState(false)

  useEffect(() => {
  if (isOpen) {
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth

    document.body.style.overflow = "hidden"
    document.body.style.paddingRight = `${scrollbarWidth}px`
  } else {
    document.body.style.overflow = "auto"
    document.body.style.paddingRight = "0px"
  }

  return () => {
    document.body.style.overflow = "auto"
    document.body.style.paddingRight = "0px"
  }
}, [isOpen])

  
  // Validación por paso
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const hasUnsavedChanges = (): boolean => {
    // Verificar si hay cambios significativos en el formulario
    return (
      formData.publication_type !== '' ||
      formData.subtype !== '' ||
      formData.title.trim() !== '' ||
      formData.content.trim() !== '' ||
      formData.deadline !== undefined ||
      formData.ctas.some(cta => cta.label.trim() !== '' || cta.url.trim() !== '') ||
      Object.keys(formData.specific_fields).length > 0
    )
  }

  const handleClose = () => {
    if (hasUnsavedChanges()) {
      setShowConfirmClose(true)
    } else {
      handleForceClose()
    }
  }

  const handleForceClose = () => {
    dispatch({ type: 'RESET' })
    setShowConfirmClose(false)
    onClose()
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.publication_type !== ''
      case 2:
        return formData.subtype !== ''
      case 3:
        // Requerir que TODOS los CTAs tengan URLs válidas
        if (formData.ctas.length === 0) return true // Permitir avanzar sin CTAs
        return formData.ctas.every(cta => cta.url.trim() !== '' && isValidUrl(cta.url))
      case 4:
        return formData.title.trim() !== '' && formData.content.trim() !== '' && formData.deadline !== undefined
      case 5:
        return validateSpecificFields() // Paso final de publicación
      default:
        return false
    }
  }

  
  const validateSpecificFields = (): boolean => {
    if (formData.publication_type === 'oportunidad_internacional') {
      const fields = formData.specific_fields
      
      switch (formData.subtype) {
        case 'intercambio':
          return !!(fields?.duration && 
                  fields?.country && 
                  Array.isArray(fields?.requirements) && 
                  fields.requirements.length > 0)
        case 'pasantia':
          return !!(fields?.company && 
                  fields?.duration && 
                  fields?.remuneration !== undefined)
        case 'investigacion':
          return !!(fields?.institution && 
                  fields?.field && 
                  fields?.funding)
        case '4+1':
          return !!(fields?.university && 
                  Array.isArray(fields?.requirements) && 
                  fields.requirements.length > 0 && 
                  fields?.credits)
        default:
          return false
      }
    }
    // Para otros tipos, no se requiere validación específica por ahora
    return true
  }

  // Navegación
  const handleNext = () => {
    if (validateStep(formData.current_step)) {
      dispatch({ type: 'NEXT_STEP' })
    }
  }

  const handlePrevious = () => {
    dispatch({ type: 'PREV_STEP' })
  }

  const handleStepClick = (step: number) => {
    if (validateStep(step - 1)) {
      dispatch({ type: 'SET_STEP', payload: step })
    }
  }

  // Publicación final
  const handlePublish = async () => {
    // Eliminar validación de términos - solo validar paso 4
    if (!validateStep(4)) return

    setIsLoading(true)
    setError(null)
  
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No se encontró token de autenticación')
      }

      // Obtener user_id del token si no se proporcionó
      let userId = initialUserId
      if (!userId) {
        const payload = JSON.parse(atob(token.split('.')[1]))
        userId = payload.user_id
      }

      const publicationData = {
        ...formData,
        user_id: userId
      }

      const response = await fetch('http://localhost:8000/publications/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(publicationData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Error al crear publicación')
      }

      // Éxito
      dispatch({ type: 'RESET' })
      onClose()
      // Recargar la página o mostrar mensaje de éxito
      window.location.reload()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  // Renderizado de componentes de paso
  const renderStep = () => {

    switch (formData.current_step) {
      case 1:
        return (
          <Step1TypeSelection
            selectedType={formData.publication_type}
            onSelectType={(type, subtype) => dispatch({ 
              type: 'SET_TYPE', 
              payload: { publication_type: type, subtype } 
            })}
          />
        )
      case 2:
        return (
          <Step2SubtypeSelection
            publicationType={formData.publication_type}
            selectedSubtype={formData.subtype}
            onSelectSubtype={(subtype) => dispatch({ 
              type: 'SET_TYPE', 
              payload: { publication_type: formData.publication_type, subtype } 
            })}
          />
        )
      case 3:
        return (
          <Step3CTAForm
            ctas={formData.ctas}
            onChange={(ctas) => dispatch({ type: 'SET_CTAS', payload: ctas })}
          />
        )
      case 4:
        return (
          <Step4GeneralInfo
            title={formData.title}
            content={formData.content}
            deadline={formData.deadline}
            onChange={(data) => dispatch({ 
              type: 'SET_GENERAL_INFO', 
              payload: data 
            })}
          />
        )
      case 5:
        return (
          <Step6Publication
            publicationType={formData.publication_type}
            subtype={formData.subtype}
            title={formData.title}
            content={formData.content}
            deadline={formData.deadline}
            ctas ={formData.ctas}
            onPublish={handlePublish}
            onBack={handlePrevious}
            isLoading={isLoading}
          />
        )
      default:
        return null
    }
  }

  if (!isOpen) return null


return (
  
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="pt-3 pb-1 px-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Crear Publicación</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stepper Moderno */}
        <div className="mt-1 mb-2">
          <ModernStepper 
            currentStep={formData.current_step}
            onStepClick={handleStepClick}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 overflow-y-auto">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        
        {renderStep()}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={formData.current_step === 1}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>

          {formData.current_step === 5 ? (
            <button
              onClick={handlePublish}
              disabled={isLoading || !validateStep(4)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Publicando...' : 'Publicar'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!validateStep(formData.current_step)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          )}
        </div>
      </div>

      {/* Modal de Confirmación de Cierre */}
      {showConfirmClose && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                ¿Cerrar sin guardar?
              </h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Tienes cambios sin guardar en tu publicación. Si cierras ahora, perderás toda la información ingresada.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmClose(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleForceClose}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Cerrar sin guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
)
}
import { useState } from 'react'
import { X, ChevronLeft, ChevronRight, Edit3, Send } from 'lucide-react'
import { useCreatePost } from '../context/CreatePostContext'

interface CreatePostWizardProps {
  onClose: () => void
}

export default function CreatePostWizardSimple({ onClose }: CreatePostWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [localData, setLocalData] = useState({
    type: '',
    title: '',
    description: '',
    requirements: '',
    link_form: '',
    closing_date: '',
    form_completed: false
  })

  const { 
    setTitle, 
    setDescription, 
    setRequirements, 
    setLinkForm, 
    setClosingDate, 
    setPostType, 
    handleCreatePost, 
    createLoading 
  } = useCreatePost()

  const postTypes = [
    { type: "Oportunidad Internacional", desc: "Intercambios, pasantías, investigación exterior, programas 4+1", icon: "🌍" },
    { type: "Eventos", desc: "Conferencias, talleres, voluntariados, deportes, visitas académicas", icon: "📅" },
    { type: "Proyectos", desc: "Investigaciones, hackatones, retos académicos", icon: "🚀" },
    { type: "Competencias", desc: "Concursos, competencias académicas y profesionales", icon: "🏆" },
    { type: "Convocatorias", desc: "Becas, empleos, prácticas, convocatorias institucionales", icon: "📢" },
    { type: "Programas", desc: "Programas académicos, de formación y desarrollo", icon: "📚" },
    { type: "Publicación General", desc: "Comunicados o información sin inscripción", icon: "📄" }
  ]

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return localData.type.trim() !== ''
      case 2:
        return localData.title.trim() !== '' && 
               localData.description.trim() !== '' && 
               localData.requirements.trim() !== ''
      case 3:
        return localData.link_form.trim() !== '' && localData.form_completed
      case 4:
        return localData.closing_date.trim() !== ''
      case 5:
        return true
      default:
        return false
    }
  }

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handlePublish = async () => {
    if (validateCurrentStep()) {
      try {
        // Establecer los datos en el contexto
        setTitle(localData.title)
        setDescription(localData.description)
        setRequirements(localData.requirements) 
        setLinkForm(localData.link_form)
        setClosingDate(localData.closing_date)
        setPostType(localData.type as "Oportunidad Internacional" | "Eventos" | "Proyectos" | "Competencias" | "Convocatorias" | "Programas" | "Publicación General")
        
        // Llamar a la función del contexto para crear el post
        await handleCreatePost({
          title: localData.title,
          description: localData.description,
          requirements: localData.requirements,
          link_form: localData.link_form,
          closing_date: localData.closing_date,
          post_type: localData.type as "Oportunidad Internacional" | "Eventos" | "Proyectos" | "Competencias" | "Convocatorias" | "Programas" | "Publicación General",
        })
        
        // Cerrar el wizard
        onClose()
      } catch (error) {
        console.error('Error al publicar:', error)
      }
    }
  }

  const handleEdit = () => {
    if (currentStep > 4) {
      setCurrentStep(4)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-gray-900">Crear Publicación</h2>
            {localData.type && (
              <span className="bg-purple-100 text-purple-700 text-sm px-3 py-1 rounded-full font-medium">
                {localData.type}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress indicators */}
        <div className="flex items-center justify-center px-6 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    currentStep === step
                      ? 'bg-purple-600 text-white'
                      : currentStep > step
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step}
                </div>
                {step < 5 && (
                  <div
                    className={`w-8 h-0.5 transition-colors ${
                      currentStep > step ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipo de oportunidad</h3>
                <p className="text-gray-600 mb-6">Selecciona qué tipo de oportunidad deseas crear</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {postTypes.map((option) => (
                  <button
                    key={option.type}
                    onClick={() => setLocalData({ ...localData, type: option.type })}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      localData.type === option.type
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{option.icon}</span>
                      <div>
                        <h4 className="font-medium text-gray-900">{option.type}</h4>
                        <p className="text-sm text-gray-600 mt-1">{option.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información general</h3>
                <p className="text-gray-600 mb-6">Completa los detalles básicos de la publicación</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={localData.title}
                    onChange={(e) => setLocalData({ ...localData, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Título de la publicación"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción *
                  </label>
                  <textarea
                    value={localData.description}
                    onChange={(e) => setLocalData({ ...localData, description: e.target.value })}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg p-3 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Describe los detalles de la oportunidad..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Requisitos *
                  </label>
                  <textarea
                    value={localData.requirements}
                    onChange={(e) => setLocalData({ ...localData, requirements: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg p-3 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ej: Estudiante activo, 3er ciclo adelante, disponibilidad 10 horas/semana"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Inscripción</h3>
                <p className="text-gray-600 mb-6">Configura el formulario de inscripción</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link a formulario de Google Forms *
                  </label>
                  <input
                    type="url"
                    value={localData.link_form}
                    onChange={(e) => setLocalData({ ...localData, link_form: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="https://forms.google.com/..."
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="form_completed"
                    checked={localData.form_completed}
                    onChange={(e) => setLocalData({ ...localData, form_completed: e.target.checked })}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="form_completed" className="text-sm font-medium text-gray-700">
                    Confirmo que el formulario ha sido completado
                  </label>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Fecha límite</h3>
                <p className="text-gray-600 mb-6">Establece cuándo cierra la inscripción</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de cierre *
                </label>
                <input
                  type="datetime-local"
                  value={localData.closing_date}
                  onChange={(e) => setLocalData({ ...localData, closing_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Vista previa</h3>
                <p className="text-gray-600 mb-6">Revisa cómo se verá tu publicación</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">
                      {postTypes.find(t => t.type === localData.type)?.icon || '📄'}
                    </span>
                    <span className="bg-purple-100 text-purple-700 text-sm px-3 py-1 rounded-full font-medium">
                      {localData.type}
                    </span>
                  </div>
                </div>
                
                <h4 className="text-xl font-bold text-gray-900 mb-2">{localData.title}</h4>
                <p className="text-gray-700 mb-4 whitespace-pre-wrap">{localData.description}</p>
                
                {localData.requirements && (
                  <div className="border-t border-gray-200 pt-4">
                    <h5 className="font-semibold text-gray-900 mb-2">Requisitos:</h5>
                    <p className="text-gray-700 whitespace-pre-wrap text-sm">{localData.requirements}</p>
                  </div>
                )}
                
                {localData.link_form && (
                  <div className="border-t border-gray-200 pt-4">
                    <h5 className="font-semibold text-gray-900 mb-2">Formulario:</h5>
                    <a 
                      href={localData.link_form} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-purple-600 hover:text-purple-700 text-sm underline break-words"
                    >
                      {localData.link_form}
                    </a>
                  </div>
                )}
                
                {localData.closing_date && (
                  <div className="border-t border-gray-200 pt-4">
                    <h5 className="font-semibold text-gray-900 mb-2">Fecha de cierre:</h5>
                    <p className="text-gray-700 text-sm">
                      {new Date(localData.closing_date).toLocaleString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </div>
          </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            {currentStep > 1 && currentStep < 5 && (
              <button
                onClick={prevStep}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {currentStep < 5 && (
              <button
                onClick={nextStep}
                disabled={!validateCurrentStep()}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {currentStep === 5 && (
              <>
                <button
                  onClick={handleEdit}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={handlePublish}
                  disabled={createLoading || !validateCurrentStep()}
                  className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50"
                >
                  {createLoading ? (
                    <span>Publicando...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Publicar</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import { ChevronLeft, ChevronRight, Edit3, Send } from "lucide-react"
import { useCreatePost } from "../context/CreatePostContext"

const postTypes = [
  "Oportunidad Internacional",
  "Eventos", 
  "Proyectos",
  "Competencias",
  "Convocatorias",
  "Programas",
  "Publicación General"
] as const

export default function CreatePostSteps() {
  const {
    currentStep,
    setCurrentStep,
    setIsEditing,
    title,
    setTitle,
    description,
    setDescription,
    requirements,
    setRequirements,
    link_form,
    setLinkForm,
    closing_date,
    setClosingDate,
    post_type,
    setPostType,
    nextStep,
    prevStep,
    canGoNext,
    canGoPrev,
    handleCreatePost,
    createLoading
  } = useCreatePost()

  const steps = [
    { id: 1, name: "Tipo de publicación", icon: "📝" },
    { id: 2, name: "Información principal", icon: "📄" },
    { id: 3, name: "Link del formulario", icon: "🔗" },
    { id: 4, name: "Fecha de cierre", icon: "📅" },
    { id: 5, name: "Vista previa", icon: "👁️" }
  ]

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Selecciona el tipo de publicación</h3>
            <div className="grid grid-cols-1 gap-3">
              {postTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setPostType(type)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    post_type === type
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                  }`}
                >
                  <div className="text-left">
                    <div className="font-medium">{type}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Información principal</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título *
              </label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Título de la publicación"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción *
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-3 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe los detalles de la oportunidad..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requisitos
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-3 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
                value={requirements}
                onChange={e => setRequirements(e.target.value)}
                placeholder="Ej: Estudiante activo, 3er ciclo adelante, disponibilidad 10 horas/semana"
              />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Link del formulario</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link de Formulario (opcional)
              </label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={link_form}
                onChange={e => setLinkForm(e.target.value)}
                placeholder="https://forms.gle/..."
              />
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Fecha de cierre</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de cierre (opcional)
              </label>
              <input
                type="datetime-local"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={closing_date}
                onChange={e => setClosingDate(e.target.value)}
              />
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Vista previa</h3>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-xl font-bold text-gray-900">
                    {title || "Sin título"}
                  </h4>
                  <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium">
                    {post_type}
                  </span>
                </div>
              </div>
              
              {description && (
                <div className="mb-3">
                  <p className="text-gray-800 whitespace-pre-wrap">
                    {description}
                  </p>
                </div>
              )}
              
              {requirements && (
                <div className="border-t border-gray-300 pt-3">
                  <h5 className="font-semibold text-gray-900 mb-2">Requisitos:</h5>
                  <p className="text-gray-700 whitespace-pre-wrap text-sm">
                    {requirements}
                  </p>
                </div>
              )}

              {link_form && (
                <div className="border-t border-gray-300 pt-3">
                  <h5 className="font-semibold text-gray-900 mb-2">Formulario:</h5>
                  <a href={link_form} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700 text-sm">
                    {link_form}
                  </a>
                </div>
              )}

              {closing_date && (
                <div className="border-t border-gray-300 pt-3">
                  <h5 className="font-semibold text-gray-900 mb-2">Fecha de cierre:</h5>
                  <p className="text-gray-700 text-sm">
                    {new Date(closing_date).toLocaleString('es-ES')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const renderFooter = () => {
    if (currentStep === 5) {
      return (
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={() => {
              setIsEditing(true)
              setCurrentStep(2)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Editar
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep(4)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Anterior
            </button>
            <button
              onClick={handleCreatePost}
              disabled={createLoading || !title.trim() || !description.trim()}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              {createLoading ? "Publicando..." : "Publicar"}
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="flex items-center justify-between p-6 border-t border-gray-200">
        <button
          onClick={prevStep}
          disabled={!canGoPrev()}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </button>
        
        <button
          onClick={nextStep}
          disabled={!canGoNext()}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Siguiente
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
      {/* Header con pasos */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Crear Publicación</h2>
          {post_type && (
            <span className="bg-purple-100 text-purple-700 text-sm px-3 py-1 rounded-full font-medium">
              {post_type}
            </span>
          )}
        </div>
        
        {/* Progress steps */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  currentStep >= step.id
                    ? "bg-purple-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {step.icon}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-full h-1 mx-2 transition-colors ${
                    currentStep > step.id ? "bg-purple-600" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        
        <div className="flex justify-between mt-2">
          {steps.map((step) => (
            <span
              key={step.id}
              className={`text-xs ${
                currentStep === step.id ? "text-purple-600 font-medium" : "text-gray-500"
              }`}
            >
              {step.name}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {renderStepContent()}
      </div>

      {/* Footer */}
      {renderFooter()}
    </div>
  )
}

import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { useState } from "react"
import { Home, User, X, MoreVertical, LogOut } from "lucide-react"
import { useCreatePost } from "../context/CreatePostContext"
import CreatePostWizardSimple from "../components/CreatePostWizardSimple"
import PublicationWizard from "../components/PublicationWizard"

export default function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showCreateModal, setShowCreateModal } = useCreatePost()
  const [showOptionsModal, setShowOptionsModal] = useState(false)
  const [showTypeModal, setShowTypeModal] = useState(false)

  const isActive = (path: string) =>
    location.pathname === path

  const handleTypeSelect = (type: string, subtype: string) => {
    // Aquí podrías redirigir a un formulario específico
    // Por ahora, mostramos el wizard simple con el tipo seleccionado
    console.log('Tipo seleccionado:', type, subtype)
    setShowTypeModal(false)
    // Futuro: redirigir a formulario específico según tipo/subtipo
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className={`min-h-screen flex flex-col ${showCreateModal ? 'overflow-hidden' : ''}`}>
      
      {/* Modal del wizard paso a paso */}
      {showCreateModal && (
        <CreatePostWizardSimple 
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Contenido dinámico */}
      <main className="flex-1 bg-gray-50 pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center py-3 max-w-sm mx-auto">
          {/* Logo agrandado */}
          <div className="flex items-center justify-center">
            <img
              src="/utopp-logo.png"
              alt="Utopp"
              style={{ 
                width: '32px', 
                height: '32px', 
                objectFit: 'contain'
              }}
            />
          </div>

          {/* Botón Inicio - solo ícono */}
          <button
            onClick={() => navigate("/app/inicio")}
            className={`p-2 rounded-lg transition-colors ${
              isActive("/app/inicio") 
                ? "text-purple-600 bg-purple-50" 
                : "text-gray-600 hover:text-gray-900"
            }`}
            title="Inicio"
          >
            <Home style={{ width: '20px', height: '20px' }} />
          </button>

          {/* Botón Central Destacado de Creación */}
          <button
            onClick={() => setShowTypeModal(true)}
            className="relative group"
            title="Crear Publicación"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 rounded-full p-4 shadow-lg transform transition-all duration-300 hover:scale-110 hover:shadow-xl">
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="white" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="animate-pulse"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
          </button>

          {/* Botón Perfil - solo ícono */}
          <button
            onClick={() => navigate("/app/perfil")}
            className={`p-2 rounded-lg transition-colors ${
              isActive("/app/perfil") 
                ? "text-purple-600 bg-purple-50" 
                : "text-gray-600 hover:text-gray-900"
            }`}
            title="Perfil"
          >
            <User style={{ width: '20px', height: '20px' }} />
          </button>

          {/* Botón Opciones - solo ícono */}
          <button
            onClick={() => setShowOptionsModal(true)}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 transition-colors"
            title="Más opciones"
          >
            <MoreVertical style={{ width: '20px', height: '20px' }} />
          </button>
        </div>
      </nav>

      {/* Modal del wizard de publicación */}
      <PublicationWizard 
        isOpen={showTypeModal}
        onClose={() => setShowTypeModal(false)}
      />

      {/* Modal de opciones */}
      {showOptionsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            {/* Header del modal */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Opciones</h2>
                <button
                  onClick={() => setShowOptionsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenido del modal */}
            <div className="p-6 space-y-4">
              {/* Botón de logout */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    handleLogout()
                    setShowOptionsModal(false)
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>

            {/* Footer del modal */}
            <div className="flex items-center justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setShowOptionsModal(false)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
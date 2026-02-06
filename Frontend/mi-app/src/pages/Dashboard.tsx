import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { useState } from "react"
import { Plus, Home, User, X, MoreVertical, LogOut } from "lucide-react"
import { useCreatePost } from "../context/CreatePostContext"
import CreatePostWizardSimple from "../components/CreatePostWizardSimple"

export default function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showCreateModal, setShowCreateModal } = useCreatePost()
  const [showOptionsModal, setShowOptionsModal] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  const isActive = (path: string) =>
    location.pathname === path ? "bg-purple-100 text-purple-700 border-l-4 border-purple-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className={`min-h-screen flex ${showCreateModal ? 'overflow-hidden' : ''} ${darkMode ? 'dark' : ''}`}>
      
      {/* Modal del wizard paso a paso */}
      {showCreateModal && (
        <CreatePostWizardSimple 
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Sidebar con hover expand y transición suave */}
      <aside 
        className="sidebar-container bg-white border-r border-gray-200"
        style={{ 
          width: '80px',
          position: 'fixed',
          left: 0,
          top: 0,
          height: '100vh',
          zIndex: 40,
          transition: 'width 0.3s ease-in-out',
          display: 'flex',
          flexDirection: 'column'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.width = '256px'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.width = '80px'
        }}
      >
        {/* Logo - logo a la izquierda, texto a la derecha */}
        <div style={{ padding: '16px', borderBottom: '1px solid rgb(229 231 235)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '12px' }}>
            <img
              src="/utopp-logo.png"
              alt="Utopp"
              className="logo-img"
              style={{ 
                width: '32px', 
                height: '32px', 
                objectFit: 'contain',
                flexShrink: 0
              }}
            />
            <span 
              style={{
                fontFamily: "'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
                fontSize: '20px',
                fontWeight: '600',
                color: '#1f2937',
                letterSpacing: '-0.025em',
                transition: 'opacity 0.2s ease-in-out',
                whiteSpace: 'nowrap'
              }}
              className="logo-text"
            >
              Utopp
            </span>
          </div>
        </div>

        {/* Navegación - solo íconos por defecto, texto en hover */}
        <nav style={{ flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button
            onClick={() => navigate("/app/inicio")}
            className={`nav-button ${isActive("/app/inicio")}`}
            title="Inicio"
          >
            <Home style={{ width: '20px', height: '20px', flexShrink: 0 }} />
            <span className="nav-text">Inicio</span>
          </button>

          {/* Botón Crear Publicación */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="nav-button"
            title="Crear"
          >
            <Plus style={{ width: '20px', height: '20px', flexShrink: 0 }} />
            <span className="nav-text">Crear</span>
          </button>

          {/* Botón Perfil - movido abajo */}
          <button
            onClick={() => navigate("/app/perfil")}
            className={`nav-button ${isActive("/app/perfil")}`}
            title="Perfil"
          >
            <User style={{ width: '20px', height: '20px', flexShrink: 0 }} />
            <span className="nav-text">Perfil</span>
          </button>
        </nav>

        {/* Más opciones - donde estaba perfil antes */}
        <div style={{ padding: '8px', borderTop: '1px solid rgb(229 231 235)', marginTop: 'auto' }}>
          <button
            onClick={() => setShowOptionsModal(true)}
            className="nav-button"
            title="Más opciones"
          >
            <MoreVertical style={{ width: '20px', height: '20px', flexShrink: 0 }} />
            <span className="nav-text">Opciones</span>
          </button>
        </div>
      </aside>

      {/* Contenido dinámico - completamente separado */}
      <main className="flex-1 bg-gray-50 dark:bg-gray-900">
        <Outlet />
      </main>

      {/* Modal de opciones */}
      {showOptionsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
            {/* Header del modal */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Opciones</h2>
                <button
                  onClick={() => setShowOptionsModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenido del modal */}
            <div className="p-6 space-y-4">
              {/* Toggle de modo oscuro */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Modo oscuro</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Cambiar entre tema claro y oscuro</p>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    darkMode ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      darkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Botón de logout */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
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
            <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-gray-700">
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

      <style>{`
        .sidebar-container .logo-text {
          opacity: 0;
          transition: opacity 0.2s ease-in-out;
        }
        
        .sidebar-container:hover .nav-text,
        .sidebar-container:hover .logo-text {
          opacity: 1 !important;
        }
        
        .sidebar-container:hover .nav-icon-plus {
          opacity: 1;
        }
        
        .sidebar-container:hover .logo-img {
          width: 32px !important;
          height: 32px !important;
          max-height: 32px !important;
        }
        
        .nav-button {
          width: 100%;
          display: flex;
          align-items: center;
          padding: 12px;
          border-radius: 8px;
          transition: all 0.2s ease-in-out;
          position: relative;
          background: transparent;
          border: none;
          cursor: pointer;
        }
        
        .nav-text {
          margin-left: 12px;
          font-weight: 500;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.2s ease-in-out;
        }
        
        .nav-icon-plus {
          width: 16px;
          height: 16px;
          margin-left: auto;
          opacity: 0;
          transition: opacity 0.2s ease-in-out;
        }

        .logo-img {
          transition: all 0.3s ease-in-out !important;
        }

        @media (min-width: 1024px) {
          .sidebar-container {
            position: sticky;
            top: 0;
            height: 100vh;
            z-index: auto;
          }
        }
      `}</style>
    </div>
  )
}
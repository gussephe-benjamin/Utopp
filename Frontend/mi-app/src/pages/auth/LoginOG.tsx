import { useNavigate } from "react-router-dom";
import GoogleLogin from "../../auth/GoogleLogin";

export default function LoginOG() {
  const navigate = useNavigate();

return (
   <div className="min-h-screen 
  bg-[linear-gradient(to_bottom_right,rgba(79,70,229,0.8),rgba(99,102,241,0.8),rgba(139,92,246,0.8)),url('https://posgrado.utec.edu.pe/sites/default/files/2023-08/Campus-utec---nuestro-enfoque---web.jpg')] 
  bg-cover bg-center 
  flex items-center justify-center p-6 relative overflow-hidden">

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-400/10 rounded-full blur-2xl" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-10 w-40 h-0.5 bg-white rotate-45" />
          <div className="absolute top-32 right-20 w-32 h-0.5 bg-white rotate-45" />
          <div className="absolute bottom-40 left-10 w-48 h-0.5 bg-white rotate-45" />
        </div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Logo */}

        <div className="w-32 h-32 rounded-3xl overflow-hidden shadow-2xl mb-6 ring-4 ring-white/30 bg-white/10 backdrop-blur-sm mx-auto">
          <img
            src="https://raw.githubusercontent.com/gussephe-benjamin/Utopp/refs/heads/main/Frontend/mi-app/public/tempo-image-20251218T034846856Z.png"
            alt="Utopp"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-xl">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#4F46E5] mb-2">¡Hola!</h1>
            <p className="text-gray-500 text-sm">Inicia sesión para continuar</p>
          </div>

        

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-400 text-sm"> utopp</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <GoogleLogin />

          <p className="text-center mt-6 text-gray-500 text-sm">
            ¿No tienes cuenta?{" "}
            <button
              onClick={() => navigate("/register")}
              className="text-[#4F46E5] font-semibold hover:underline transition-all"
            >
              Regístrate
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

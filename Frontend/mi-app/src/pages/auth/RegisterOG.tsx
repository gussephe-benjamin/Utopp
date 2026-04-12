import { useNavigate } from "react-router-dom";
import GoogleRegister from "../../auth/GoogleRegister";

export default function Register() {
  const navigate = useNavigate();



  return (
    <div className="min-h-screen
  bg-[linear-gradient(to_bottom_right,rgba(124,58,237,0.85),rgba(168,85,247,0.85),rgba(236,72,153,0.85)),url('https://posgrado.utec.edu.pe/sites/default/files/2023-08/Campus-utec---nuestro-enfoque---web.jpg')]
  bg-cover bg-center
  flex items-center justify-center p-6 relative overflow-hidden">

      {/* Background decorativos */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-10 w-40 h-0.5 bg-white rotate-45" />
          <div className="absolute top-32 right-20 w-32 h-0.5 bg-white rotate-45" />
          <div className="absolute bottom-40 left-10 w-48 h-0.5 bg-white rotate-45" />
        </div>
      </div>
      <div className="w-full max-w-md relative z-10">
      
        {/* Logo */}

        <div className="w-32 h-32 rounded-3xl overflow-hidden shadow-2xl mb-6 ring-4 ring-white/30 bg-white/10 backdrop-blur-sm mx-auto">
          <img
            src="https://raw.githubusercontent.com/gussephe-benjamin/Utopp/refs/heads/main/Frontend/mi-app/public/tempo-image-20251218T034846856Z.png"
            alt="Utopp"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#4F46E5]">Crear cuenta</h1>
            <p className="text-gray-500 text-sm">Únete a la comunidad Utopp</p>
          </div>

         

            {/* Separator */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-400">utopp</span>
              </div>
            </div>

            <GoogleRegister />

            <p className="text-center mt-6 text-gray-500 text-sm">
            ¿Ya tienes cuenta?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-[#4F46E5] font-semibold hover:underline transition-all"
            >
              Inicia sesión
            </button>
          </p>

          </div>

          
        </div>
      </div>
  );
}

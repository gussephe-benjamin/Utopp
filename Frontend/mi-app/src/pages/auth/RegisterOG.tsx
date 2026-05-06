import { useNavigate } from "react-router-dom";
import GoogleRegister from "../../auth/GoogleRegister";
import { AuthScreenLayout } from "../../shared/layout/AuthScreenLayout";

export default function RegisterOG() {
  const navigate = useNavigate();

  return (
    <AuthScreenLayout>
      <div className="bg-white rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#4F46E5]">Crear cuenta</h1>
          <p className="text-gray-500 text-sm">Únete a la comunidad Utopp</p>
        </div>

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
            type="button"
            onClick={() => navigate("/login")}
            className="text-[#4F46E5] font-semibold hover:underline transition-all"
          >
            Inicia sesión
          </button>
        </p>
      </div>
    </AuthScreenLayout>
  );
}

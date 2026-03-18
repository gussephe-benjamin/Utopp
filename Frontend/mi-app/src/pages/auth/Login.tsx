import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { login as apiLogin, getMe } from "../../api/auth.api";
import { isComplete } from "../../api/onboarding.api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import GoogleLogin from "../../auth/GoogleLogin";
import type { AxiosError } from "axios";

/** Parsea el error de la API y devuelve un mensaje legible en español */
function parseApiError(err: unknown): string {
  const axiosErr = err as AxiosError<{ detail?: string }>;
  const detail = axiosErr?.response?.data?.detail;
  if (detail) {
    if (detail.includes("Credenciales") || detail.includes("credenciales"))
      return "Correo o contraseña incorrectos. Verifica tus datos.";
    if (detail.includes("organización") || detail.includes("utec"))
      return "Solo se permiten correos institucionales UTEC (@utec.edu.pe).";
    if (detail.includes("expirado"))
      return "Tu sesión expiró. Por favor inicia sesión nuevamente.";
    return detail;
  }
  const status = axiosErr?.response?.status;
  if (status === 401) return "Correo o contraseña incorrectos.";
  if (status === 403) return "No tienes permiso para acceder.";
  if (axiosErr?.code === "ERR_NETWORK") return "No se pudo conectar al servidor. Verifica tu conexión.";
  return "Error inesperado. Intenta de nuevo.";
}

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  // Si viene del registro, el email llega pre-cargado desde el state de navegación
  const registeredEmail = (location.state as { registeredEmail?: string } | null)?.registeredEmail ?? "";

  const [email, setEmail]               = useState(registeredEmail);
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiLogin(email, password);
      // La función login() de auth.api ya devuelve el objeto directamente (no .data)
      const token = data.access_token;
      login(token);

      const user = await getMe();

      // Revisar si completó el onboarding
      const response = await isComplete(user.id);
      if (!response.onboarding_completed) {
        navigate("/onboarding");
      } else {
        navigate("/app/inicio");
      }
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

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
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20">
            <img src="/utopp-logo.png" alt="Utopp" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-xl">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#4F46E5] mb-2">¡Hola!</h1>
            <p className="text-gray-500 text-sm">Inicia sesión para continuar</p>
          </div>

          {/* Banner de registro exitoso */}
          {registeredEmail && !error && (
            <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-green-800 text-sm font-medium">¡Cuenta creada exitosamente!</p>
                <p className="text-green-700 text-xs mt-0.5">Ingresa tu contraseña para continuar.</p>
              </div>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail className="w-5 h-5" />
              </div>
              <Input
                type="email"
                placeholder="Email institucional UTEC"
                autoComplete="username"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                className="w-full h-14 pl-12 pr-4 rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-[#4F46E5] focus:ring-[#4F46E5]/20 transition-all duration-200"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock className="w-5 h-5" />
              </div>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                className="w-full h-14 pl-12 pr-12 rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-[#4F46E5] focus:ring-[#4F46E5]/20 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Banner de error inline */}
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <p className="text-red-700 text-sm leading-snug">{error}</p>
              </div>
            )}

            {/* Botón login */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:from-[#4338CA] hover:to-[#5B21B6] text-white font-semibold rounded-2xl shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/40 active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Iniciar sesión"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-400 text-sm">o</span>
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

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../../api/auth.api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { User, Mail, Lock, Eye, EyeOff, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import GoogleRegister from "../../auth/GoogleRegister";
import type { AxiosError } from "axios";

type RegisterFormData = {
  full_name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

/** Parsea el error de la API y devuelve un mensaje legible en español */
function parseApiError(err: unknown): string {
  const axiosErr = err as AxiosError<{ detail?: string | { msg: string }[] }>;
  const detail = axiosErr?.response?.data?.detail;
  if (!detail) {
    if (axiosErr?.code === "ERR_NETWORK") return "No se pudo conectar al servidor. Verifica tu conexión.";
    return "Error inesperado. Intenta de nuevo.";
  }
  if (typeof detail === "string") {
    if (detail.includes("ya registrado")) return "Este email ya está registrado. Intenta iniciar sesión.";
    if (detail.includes("organización") || detail.includes("dominio") || detail.includes("utec"))
      return "Solo se permiten correos institucionales UTEC (@utec.edu.pe).";
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg).join(" ");
  }
  return "Error al registrar. Intenta de nuevo.";
}

/** Calcula la fortaleza de la contraseña: 0-3 */
function passwordStrength(pwd: string): number {
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd) || /[0-9]/.test(pwd) || /[^a-zA-Z0-9]/.test(pwd)) score++;
  return score;
}

const STRENGTH_LABELS = ["Muy débil", "Débil", "Regular", "Fuerte"];
const STRENGTH_COLORS = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-500"];
const STRENGTH_TEXT   = ["text-red-500", "text-orange-500", "text-yellow-600", "text-green-600"];

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState<RegisterFormData>({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  // Reglas de validación de contraseña calculadas en tiempo real
  const rules = useMemo(() => [
    { label: "Mínimo 6 caracteres",     ok: form.password.length >= 6 },
    { label: "Las contraseñas coinciden", ok: form.password === form.confirmPassword && form.confirmPassword.length > 0 },
  ], [form.password, form.confirmPassword]);

  const strength = useMemo(() => passwordStrength(form.password), [form.password]);

  const confirmBorderClass =
    form.confirmPassword.length === 0
      ? "border-gray-200"
      : form.password === form.confirmPassword
        ? "border-green-400 focus:border-green-500 focus:ring-green-400/20"
        : "border-red-400 focus:border-red-500 focus:ring-red-400/20";

  const validate = (): string | null => {
    if (!form.email)                                     return "El email es obligatorio";
    if (!form.password)                                  return "La contraseña es obligatoria";
    if (form.password.length < 6)                        return "La contraseña debe tener al menos 6 caracteres";
    if (form.password !== form.confirmPassword)          return "Las contraseñas no coinciden";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError(null);
    try {
      await register(form.email, form.password, form.full_name || undefined);
      // Redirige al Login con el email prefillado y un mensaje de éxito
      navigate("/login", { state: { registeredEmail: form.email } });
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen 
  bg-[linear-gradient(to_bottom_right,rgba(79,70,229,0.8),rgba(99,102,241,0.8),rgba(139,92,246,0.8)),url('https://posgrado.utec.edu.pe/sites/default/files/2023-08/Campus-utec---nuestro-enfoque---web.jpg')] 
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
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20">
            <img src="/utopp-logo.png" alt="Utopp" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#4F46E5]">Crear cuenta</h1>
            <p className="text-gray-500 text-sm">Únete a la comunidad Utopp</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre completo */}
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                name="full_name"
                placeholder="Nombre completo (opcional)"
                value={form.full_name}
                onChange={handleChange}
                className="h-14 pl-12 rounded-2xl bg-gray-50 border-gray-200"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="email"
                name="email"
                placeholder="Email institucional UTEC"
                value={form.email}
                onChange={handleChange}
                required
                className="h-14 pl-12 rounded-2xl bg-gray-50 border-gray-200"
              />
            </div>

            {/* Contraseña */}
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Contraseña"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  className="h-14 pl-12 pr-12 rounded-2xl bg-gray-50 border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Barra de fortaleza — aparece al escribir */}
              {form.password.length > 0 && (
                <div className="space-y-1.5 px-1">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                          i < strength ? STRENGTH_COLORS[strength] : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${STRENGTH_TEXT[strength]}`}>
                    {STRENGTH_LABELS[strength]}
                  </p>
                </div>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirmar contraseña"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
                className={`h-14 pl-12 pr-12 rounded-2xl bg-gray-50 border ${confirmBorderClass} transition-colors`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Checklist de reglas — visible al escribir contraseña */}
            {form.password.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 border border-gray-100">
                {rules.map((rule) => (
                  <div key={rule.label} className="flex items-center gap-2">
                    {rule.ok
                      ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      : <XCircle     className="w-4 h-4 text-gray-300 shrink-0" />}
                    <span className={`text-xs ${rule.ok ? "text-green-700" : "text-gray-400"}`}>
                      {rule.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Banner de error */}
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <p className="text-red-700 text-sm leading-snug">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:from-[#4338CA] hover:to-[#5B21B6] text-white font-semibold rounded-2xl shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:shadow-xl active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Crear cuenta"
              )}
            </Button>

            {/* Separator */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-400">O regístrate con</span>
              </div>
            </div>

            <GoogleRegister />
          </form>

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

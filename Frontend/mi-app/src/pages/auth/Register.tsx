import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {register} from "../../api/apiFunctions/auth";
import { Button } from "../../componets/ui/button";
import { Input } from "../../componets/ui/input";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";

type RegisterFormData = {
  full_name?: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState<RegisterFormData>({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const validate = (): string | null => {
    if (!form.email) return "El email es obligatorio";
    if (!form.password) return "La contraseña es obligatoria";
    if (form.password.length < 6)
      return "La contraseña debe tener al menos 6 caracteres";
    if (form.password !== form.confirmPassword)
      return "Las contraseñas no coinciden";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      try{
        const res = await register(form.email, form.password, form.full_name)
        console.log(res.data)
      } catch(error){
        console.error(error);
      }     
      
      alert("Registro exitoso");
      navigate("/login");
    } catch (err) {
      console.error(err);
      setError("Error al registrar usuario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4F46E5] via-[#6366F1] to-[#8B5CF6] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decor */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-2xl">
            <img
              src="/utopp-logo.png"
              alt="Utopp"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#4F46E5]">
              Crear cuenta
            </h1>
            <p className="text-gray-500 text-sm">
              Únete a la comunidad Utopp
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                name="full_name"
                placeholder="Nombre completo (opcional)"
                value={form.full_name}
                onChange={handleChange}
                className="h-14 pl-12 rounded-2xl bg-gray-50"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                required
                className="h-14 pl-12 rounded-2xl bg-gray-50"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Contraseña"
                value={form.password}
                onChange={handleChange}
                required
                className="h-14 pl-12 pr-12 rounded-2xl bg-gray-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>

            {/* Confirm Password */}
            <Input
              type="password"
              name="confirmPassword"
              placeholder="Confirmar contraseña"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              className="h-14 rounded-2xl bg-gray-50"
            />

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white rounded-2xl"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Registrarse"
              )}
            </Button>
          </form>

          <p className="text-center mt-6 text-gray-500 text-sm">
            ¿Ya tienes cuenta?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-[#4F46E5] font-semibold hover:underline"
            >
              Inicia sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

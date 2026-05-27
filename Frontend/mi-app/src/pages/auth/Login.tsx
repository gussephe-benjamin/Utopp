import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { login as apiLogin } from "../../api/auth.api";
import { redirectAfterAuthSession } from "../../auth/postAuthRedirect";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import GoogleLogin from "../../auth/GoogleLogin";
import { AuthScreenLayout } from "../../shared/layout/AuthScreenLayout";
import { parseAuthApiError } from "../../shared/lib/apiErrors";
import { TW_AUTH_FOOTER_LINK, TW_AUTH_HEADING, TW_AUTH_INPUT_FOCUS, TW_UTOPP_GRADIENT_R } from "../../shared/constants/brand";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const registeredEmail =
    (location.state as { registeredEmail?: string } | null)?.registeredEmail ?? "";

  const [email, setEmail] = useState(registeredEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiLogin(email, password);
      const token = data.access_token;
      login(token);
      await redirectAfterAuthSession(navigate, { replace: false });
    } catch (err) {
      setError(parseAuthApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthScreenLayout contentClassName="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-xl">
        <div className="text-center mb-6">
          <h1 className={`text-2xl font-bold mb-2 ${TW_AUTH_HEADING}`}>¡Hola!</h1>
          <p className="text-gray-500 text-sm">Inicia sesión para continuar</p>
        </div>

        {registeredEmail && !error && (
          <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-green-800 text-sm font-medium">¡Cuenta creada exitosamente!</p>
              <p className="text-green-700 text-xs mt-0.5">Ingresa tu contraseña para continuar.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Mail className="w-5 h-5" />
            </div>
            <Input
              type="email"
              required
              placeholder="Email institucional UTEC"
              autoComplete="username"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              className={`w-full h-14 pl-12 pr-4 rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white ${TW_AUTH_INPUT_FOCUS} transition-all duration-200`}
            />
          </div>

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Lock className="w-5 h-5" />
            </div>
            <Input
              type={showPassword ? "text" : "password"}
              required
              placeholder="Contraseña"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              className={`w-full h-14 pl-12 pr-12 rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white ${TW_AUTH_INPUT_FOCUS} transition-all duration-200`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <p className="text-red-700 text-sm leading-snug">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || !canSubmit}
            className={`w-full h-14 ${TW_UTOPP_GRADIENT_R} hover:brightness-105 text-white font-semibold rounded-2xl shadow-lg shadow-[#9333EA]/25 transition-all duration-300 hover:shadow-xl active:scale-[0.98]`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Iniciar sesión"
            )}
          </Button>
        </form>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-400 text-sm">o</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <GoogleLogin />

        <p className="text-center mt-6 text-gray-500 text-sm">
          ¿No tienes cuenta?{" "}
          <button
            type="button"
            onClick={() => navigate("/register")}
            className={TW_AUTH_FOOTER_LINK}
          >
            Regístrate
          </button>
        </p>
      </div>
    </AuthScreenLayout>
  );
}

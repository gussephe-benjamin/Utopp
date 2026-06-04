import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../../api/auth.api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { User, Mail, Lock, Eye, EyeOff, CheckCircle2, XCircle, AlertCircle, ShieldCheck, Loader2, Lightbulb } from "lucide-react";
import GoogleRegister from "../../auth/GoogleRegister";
import { checkUsername, checkEmail } from "../../api/users.api";
import { AuthScreenLayout } from "../../shared/layout/AuthScreenLayout";
import { parseRegisterApiError } from "../../shared/lib/apiErrors";
import {
  TW_AUTH_CHECKBOX,
  TW_AUTH_FOOTER_LINK,
  TW_AUTH_HEADING,
  TW_AUTH_LEGAL_LINK,
  TW_UTOPP_GRADIENT_R,
} from "../../shared/constants/brand";
import { getCurrentPrivacy, getCurrentTerms, type TermsCurrent } from "../../api/legal.api";

/** Registro completo por email/contraseña. No está montado en App; la ruta `/register` usa RegisterOG. */

type RegisterFormData = {
  full_name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const STRENGTH_LABELS = ["Muy débil", "Débil", "Regular", "Fuerte", "Muy fuerte"];
const STRENGTH_COLORS = ["bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-lime-500", "bg-green-500"];
const STRENGTH_TEXT   = ["text-red-500", "text-orange-500", "text-yellow-600", "text-lime-600", "text-green-600"];
const STRENGTH_BG     = ["bg-red-50 border-red-200", "bg-orange-50 border-orange-200", "bg-yellow-50 border-yellow-200", "bg-lime-50 border-lime-200", "bg-green-50 border-green-200"];

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
  const [zxcvbnScore, setZxcvbnScore]       = useState(0);
  const [zxcvbnFeedback, setZxcvbnFeedback] = useState<string>("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [emailStatus, setEmailStatus]       = useState<"idle" | "checking" | "available" | "taken">("idle");
  const debounceRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emailDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [termsDoc, setTermsDoc] = useState<TermsCurrent | null>(null);
  const [privacyDoc, setPrivacyDoc] = useState<TermsCurrent | null>(null);
  const [termsLoadError, setTermsLoadError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [t, p] = await Promise.all([getCurrentTerms(), getCurrentPrivacy()]);
        if (!cancelled) {
          setTermsDoc(t);
          setPrivacyDoc(p);
        }
      } catch {
        if (!cancelled) setTermsLoadError("No se pudieron cargar los textos legales.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const legalReady = !!termsDoc && !!privacyDoc && !termsLoadError;

  const evaluatePassword = useCallback(async (pwd: string) => {
    if (!pwd) { setZxcvbnScore(0); setZxcvbnFeedback(""); return; }
    const { default: zxcvbn } = await import("zxcvbn");
    const result = zxcvbn(pwd);
    setZxcvbnScore(result.score);
    if (result.feedback.warning) {
      setZxcvbnFeedback(result.feedback.warning);
    } else if (result.feedback.suggestions.length > 0) {
      setZxcvbnFeedback(result.feedback.suggestions[0]);
    } else {
      setZxcvbnFeedback("");
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    setForm(updated);
    if (error) setError(null);
    if (e.target.name === "password") evaluatePassword(e.target.value);
    if (e.target.name === "full_name") {
      const val = e.target.value.trim();
      setUsernameStatus(val.length >= 3 ? "checking" : "idle");
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (val.length >= 3) {
        debounceRef.current = setTimeout(async () => {
          try {
            const { available } = await checkUsername(val);
            setUsernameStatus(available ? "available" : "taken");
          } catch {
            setUsernameStatus("idle");
          }
        }, 500);
      }
    }
    if (e.target.name === "email") {
      const val = e.target.value.trim();
      setEmailStatus(isValidInstitutionalEmail(val) ? "checking" : "idle");
      if (emailDebounceRef.current) clearTimeout(emailDebounceRef.current);
      if (isValidInstitutionalEmail(val)) {
        emailDebounceRef.current = setTimeout(async () => {
          try {
            const { available } = await checkEmail(val);
            setEmailStatus(available ? "available" : "taken");
          } catch {
            setEmailStatus("idle");
          }
        }, 600);
      }
    }
  };

  // Reglas de validación de contraseña calculadas en tiempo real

  const rules = useMemo(() => [
    { label: "Mínimo 6 caracteres",            ok: form.password.length >= 6 },
    { label: "Contiene mayúsculas",            ok: /[A-Z]/.test(form.password) },
    { label: "Contiene minúsculas",            ok: /[a-z]/.test(form.password) },
    { label: "Contiene números",               ok: /[0-9]/.test(form.password) },
    { label: "Contiene caracteres especiales", ok: /[^A-Za-z0-9]/.test(form.password) },
    { label: "Las contraseñas coinciden",      ok: form.password === form.confirmPassword && form.confirmPassword.length > 0 },
  ], [form.password, form.confirmPassword]);


  const isValidInstitutionalEmail = (email: string): boolean => {
    return /^[^\s@]+@utec\.edu\.pe$/i.test(email);
  };

  const emailBorderClass =
    form.email.length === 0
      ? "border-gray-200"
      : !isValidInstitutionalEmail(form.email)
        ? "border-red-400 focus:border-red-500 focus:ring-red-400/20"
        : emailStatus === "taken"
          ? "border-red-400 focus:border-red-500 focus:ring-red-400/20"
          : emailStatus === "available"
            ? "border-green-400 focus:border-green-500 focus:ring-green-400/20"
            : "border-gray-200";

  const confirmBorderClass =
    form.confirmPassword.length === 0
      ? "border-gray-200"
      : form.password === form.confirmPassword
        ? "border-green-400 focus:border-green-500 focus:ring-green-400/20"
        : "border-red-400 focus:border-red-500 focus:ring-red-400/20";

  const validate = (): string | null => {
    if (!form.full_name.trim())                          return "El nombre de usuario es obligatorio";
    if (usernameStatus === "taken")                      return "El nombre de usuario ya está en uso";
    if (!form.email)                                     return "El email es obligatorio";
    if (!isValidInstitutionalEmail(form.email))                   return "Usa tu correo institucional autorizado para registrarte";
    if (emailStatus === "taken")                         return "Este correo ya está registrado. Intenta iniciar sesión.";
    if (!form.password)                                  return "La contraseña es obligatoria";
    if (form.password.length < 6)                        return "La contraseña debe tener al menos 6 caracteres";
    if (!/[A-Z]/.test(form.password))                    return "La contraseña debe contener al menos una mayúscula";
    if (!/[a-z]/.test(form.password))                    return "La contraseña debe contener al menos una minúscula";
    if (!/[0-9]/.test(form.password))                    return "La contraseña debe contener al menos un número";
    if (!/[^A-Za-z0-9]/.test(form.password))             return "La contraseña debe contener al menos un carácter especial";
    if (form.password !== form.confirmPassword)          return "Las contraseñas no coinciden";
    if (!legalReady)                                     return "Espera a que carguen los textos legales o recarga la página.";
    if (!termsAccepted)                                  return "Debes aceptar los términos y condiciones para registrarte.";
    if (!privacyAccepted)                                return "Debes aceptar la política de datos y privacidad para registrarte.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError(null);
    try {
      await register(
        form.email,
        form.password,
        form.full_name || undefined,
        termsDoc!.id,
        privacyDoc!.id
      );
      // Redirige al Login con el email prefillado y un mensaje de éxito
      navigate("/login", { state: { registeredEmail: form.email } });
    } catch (err) {
      setError(parseRegisterApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenLayout contentClassName="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <h1 className={`text-2xl font-bold ${TW_AUTH_HEADING}`}>Crear cuenta</h1>
            <p className="text-gray-500 text-sm">Únete a la comunidad Utopp</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre completo */}
            <div className="space-y-1">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  name="full_name"
                  placeholder="Nombre de usuario"
                  value={form.full_name}
                  onChange={handleChange}
                  required
                  className={`h-14 pl-12 pr-10 rounded-2xl bg-gray-50 border transition-colors ${
                    usernameStatus === "available" ? "border-green-400" :
                    usernameStatus === "taken"     ? "border-red-400"   :
                    "border-gray-200"
                  }`}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {usernameStatus === "checking"  && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
                  {usernameStatus === "available" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  {usernameStatus === "taken"     && <XCircle className="w-4 h-4 text-red-500" />}
                </div>
              </div>
              {usernameStatus === "taken" && (
                <p className="text-xs text-red-500 px-1">El nombre de usuario ya está en uso</p>
              )}
              {usernameStatus === "available" && (
                <p className="text-xs text-green-600 px-1">Nombre de usuario disponible</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="email"
                  name="email"
                  placeholder="Tu correo institucional"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className={`h-14 pl-12 pr-10 rounded-2xl bg-gray-50 border ${emailBorderClass} transition-colors`}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {isValidInstitutionalEmail(form.email) && emailStatus === "checking"  && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
                  {isValidInstitutionalEmail(form.email) && emailStatus === "available" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  {isValidInstitutionalEmail(form.email) && emailStatus === "taken"     && <XCircle className="w-4 h-4 text-red-500" />}
                </div>
              </div>
              {form.email.length > 0 && !isValidInstitutionalEmail(form.email) && (
                <p className="text-xs text-red-500 px-1">Ingresa un correo institucional válido</p>
              )}
              {isValidInstitutionalEmail(form.email) && emailStatus === "taken" && (
                <p className="text-xs text-red-500 px-1">Este correo ya está registrado. Intenta iniciar sesión.</p>
              )}
              {isValidInstitutionalEmail(form.email) && emailStatus === "available" && (
                <p className="text-xs text-green-600 px-1">Correo disponible</p>
              )}
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
                <div className="space-y-2 px-1">
                  <div className="flex gap-1.5">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-2 flex-1 rounded-full transition-all duration-400 ${
                          i <= zxcvbnScore ? STRENGTH_COLORS[zxcvbnScore] : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-semibold ${STRENGTH_TEXT[zxcvbnScore]}`}>
                      {STRENGTH_LABELS[zxcvbnScore]}
                    </p>
                    {zxcvbnScore >= 3 && (
                      <ShieldCheck className={`w-4 h-4 ${STRENGTH_TEXT[zxcvbnScore]}`} />
                    )}
                  </div>
                  {zxcvbnFeedback && (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 leading-snug flex items-start gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      {zxcvbnFeedback}
                    </p>
                  )}
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
              <div className={`rounded-xl p-3 space-y-1.5 border transition-colors duration-300 ${STRENGTH_BG[zxcvbnScore]}`}>
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

            {termsLoadError && (
              <p className="text-red-600 text-sm">{termsLoadError}</p>
            )}

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className={`mt-0.5 size-4 rounded border-gray-300 ${TW_AUTH_CHECKBOX}`}
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                disabled={!legalReady}
              />
              <span className="text-sm text-gray-700">
                He leído y acepto los{" "}
                <Link
                  to="/terms"
                  className={TW_AUTH_LEGAL_LINK}
                >
                  términos y condiciones
                </Link>
                .
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className={`mt-0.5 size-4 rounded border-gray-300 ${TW_AUTH_CHECKBOX}`}
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                disabled={!legalReady}
              />
              <span className="text-sm text-gray-700">
                He leído y acepto la{" "}
                <Link
                  to="/privacy"
                  className={TW_AUTH_LEGAL_LINK}
                >
                  política de datos y privacidad
                </Link>
                .
              </span>
            </label>

            <Button
              type="submit"
              disabled={loading || !legalReady || !termsAccepted || !privacyAccepted}
              className={`w-full h-14 ${TW_UTOPP_GRADIENT_R} hover:brightness-105 text-white font-semibold rounded-2xl shadow-lg shadow-[#9333EA]/25 transition-all duration-300 hover:shadow-xl active:scale-[0.98]`}
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

            <GoogleRegister
              legalReady={legalReady && termsAccepted && privacyAccepted}
            />
          </form>

          <p className="text-center mt-6 text-gray-500 text-sm">
            ¿Ya tienes cuenta?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className={TW_AUTH_FOOTER_LINK}
            >
              Inicia sesión
            </button>
          </p>
        </div>
    </AuthScreenLayout>
  );
}

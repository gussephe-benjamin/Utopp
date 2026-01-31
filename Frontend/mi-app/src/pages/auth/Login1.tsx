import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../componets/ui/button";
import { Input } from "../../componets/ui/input";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import api from "../../api/axios";
//import { useAuth } from "../auth/useAuth";

import LoginPage from "./LoginPage";

import type { FormEvent } from "react";

export default function Login1() {
  //const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Login real
      const res = await api.post("/auth/login", { email, password });

      const token = res.data.access_token;

      localStorage.setItem("token", token)

      // Revisar onboarding
      const response = await api.post("/auth/onboarding", { email });

      if (!response.data.onboarding_completed) {
        navigate("/onboarding");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error en login", error);
      alert("Correo o contraseña incorrectos");
    } finally {
      setIsLoading(false);
    }
  };

  // const handleGoogleLogin = () => {
  //   setIsLoading(true);
  //   // Aquí podrías integrar la lógica real de Google login

  //   <LoginPage/>
      
  //   setTimeout(() => {
  //     setIsLoading(false);
  //     navigate("/onboarding");
  //   }, 800);
  // };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4F46E5] via-[#6366F1] to-[#8B5CF6] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Fondos decorativos */}
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
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl">
            <img
              src="/utopp-logo.png"
              alt="Utopp"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#4F46E5] mb-2">¡Hola!</h1>
            <p className="text-gray-500 text-sm">Inicia sesión para continuar</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail className="w-5 h-5" />
              </div>
              <Input
                type="email"
                placeholder="Email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                placeholder="Password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          {/* Google Login */}

            <LoginPage/>

        </div>
      </div>
    </div>
  );
}

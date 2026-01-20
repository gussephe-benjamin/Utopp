
//import { useAuth } from "../auth/useAuth";

import LoginPage from "./LoginPage";


export default function Login2() {
  //const { login } = useAuth();


//   const handleGoogleLogin = () => {
//     setIsLoading(true);
//     // Aquí podrías integrar la lógica real de Google login

//     <LoginPage/>
      
//     setTimeout(() => {
//       setIsLoading(false);
//       navigate("/onboarding");
//     }, 800);
//   };

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

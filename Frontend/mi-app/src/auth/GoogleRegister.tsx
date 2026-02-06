import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { useState } from "react";

export default function GoogleRegister() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return;
    
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8000/google/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error en registro");

      // Usar AuthContext para actualizar el token
      login(data.access_token);

      // Redirigir directamente al onboarding
      navigate("/onboarding", { replace: true });
    } catch (error) {
      console.error("Error:", error);
      alert("Error al registrar con Google");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={() => {
          console.error("Registro con Google falló");
          alert("Error al registrar con Google");
        }}
        type="standard"
        theme="outline"
        size="large"
        text="continue_with"
        shape="rectangular"
        logo_alignment="center"
        width="100%"
      />
    </div>
  );
}

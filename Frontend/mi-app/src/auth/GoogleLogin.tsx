import { GoogleLogin as GoogleLoginButton } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { useState } from "react";

export default function GoogleLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return;
    
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8000/google/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error en login");

      // Usar AuthContext para actualizar el token
      login(data.access_token);

      const userRes = await fetch("http://localhost:8000/auth/me", {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });

      const user = await userRes.json();

      // Redirección basada en datos reales
      if (!user.onboarding_completed) {
        navigate("/onboarding", { replace: true });
      } else {
        navigate("/app/inicio", { replace: true });
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {isLoading ? (
        <p>Validando cuenta... por favor espera.</p> 
      ) : (
        <GoogleLoginButton
          onSuccess={handleGoogleSuccess}
          onError={() => console.error("Login con Google falló")}
        />
      )}
    </div>
  );
}

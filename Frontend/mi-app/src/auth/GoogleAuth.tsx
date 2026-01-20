import * as React from "react"
import { useNavigate } from "react-router-dom";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";

export default function GoogleAuthABC() {
  const [isLoading, setIsLoading] = React.useState(false); // Estado de carga real
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setIsLoading(true); // Empezamos a cargar
    const token = credentialResponse.credential;

    try {
      const res = await fetch("http://localhost:8000/auth/google/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error en login");

      localStorage.setItem("access_token", data.access_token);

      const userRes = await fetch("http://localhost:8000/auth/me", {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });

      const user = await userRes.json();

      // Redirección basada en datos reales
      if (!user.onboarding_completed) {
        navigate("/onboarding", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al iniciar sesión");
    } finally {
      setIsLoading(false); // Terminamos de cargar (éxito o error)
    }
  };

  return(
    null
  ) 
 

  return (
    <div className="flex flex-col items-center gap-4">
      {isLoading ? (
        <p>Validando cuenta... por favor espera.</p> 
      ) : (
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => console.error("Login con Google falló")}
        />
      )}
    </div>
  );
}

import GoogleAuthABC from "../auth/GoogleAuth";

export default function LoginPage() {
  return (
    <div className="login-container">
      <p className="text-center text-gray-500 mb-4"></p>
      
      {/* El componente ya maneja su propia lógica y carga */}
      
      <GoogleAuthABC />
    </div>
  );
}


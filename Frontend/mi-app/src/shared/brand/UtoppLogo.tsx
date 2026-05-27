import { UTOPP_LOGO_SRC } from "../constants/brand";

type UtoppLogoProps = {
  className?: string;
};

/** Logo cuadrado con ring usado en pantallas de autenticación. */
export function UtoppLogo({ className }: UtoppLogoProps) {
  return (
    <div
      className={
        className ??
        "w-32 h-32 rounded-3xl overflow-hidden shadow-2xl mb-6 ring-4 ring-white/30 bg-white/10 backdrop-blur-sm mx-auto"
      }
    >
      <img src={UTOPP_LOGO_SRC} alt="Utopp" className="w-full h-full object-cover" />
    </div>
  );
}

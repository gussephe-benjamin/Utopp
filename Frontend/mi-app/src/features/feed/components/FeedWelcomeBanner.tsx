import { GradientMesh } from "../../../components/ui/gradient-mesh";

type FeedWelcomeBannerProps = {
  userName: string;
};

export function FeedWelcomeBanner({ userName }: FeedWelcomeBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#dbcffb]/80 shadow-[0_4px_20px_-4px_rgba(139,92,246,0.18)] w-full min-h-[120px]">
      {/* Fondo animado (WebGL): el degradé en movimiento ES el fondo del cuadro.
          OJO: el shader usa "color dodge" (duplica el brillo) → los colores deben ser
          saturados/oscuros; con tonos claros se lavan a blanco. Usamos los de marca. */}
      <GradientMesh
        colors={["#3b0a8f", "#4c1d95", "#5b21b6"]}
        speed={0.45}
        swirl={0.3}
        waveAmp={0.05}
        grain={0.02}
        scale={1.15}
      />
      {/* Contenido */}
      <div className="relative z-10 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0 w-full sm:w-auto">
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold flex items-center gap-2 text-white [text-shadow:0_2px_14px_rgba(0,0,0,0.35)]">
            <span>Hola </span>
            <span>{userName}</span>
          </h2>
          <p className="text-sm sm:text-base font-medium text-white/90 mt-1 break-words [text-shadow:0_1px_10px_rgba(0,0,0,0.35)]">
            Bienvenido a Utopp
          </p>
        </div>
      </div>
    </div>
  );
}

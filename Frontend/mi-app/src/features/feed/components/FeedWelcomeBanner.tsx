import { GradientMesh } from "../../../components/ui/gradient-mesh";

/** Colores estables para el mesh (evita remount del canvas en cada render). */
const BANNER_MESH_COLORS: string[] = ["#3b0a8f", "#4c1d95", "#5b21b6"];

type FeedWelcomeBannerProps = {
  userName: string;
  /** `mobile`: ancho completo con esquinas inferiores redondeadas (solo teléfono). */
  variant?: "default" | "mobile";
};

export function FeedWelcomeBanner({ userName, variant = "default" }: FeedWelcomeBannerProps) {
  const isMobile = variant === "mobile";

  const shellClass = isMobile
    ? "relative mb-2 block w-full min-h-[88px] overflow-hidden border-b border-[#dbcffb]/50 shadow-lg md:hidden"
    : "relative min-h-[120px] w-full overflow-hidden rounded-2xl border border-[#dbcffb]/80 shadow-[0_4px_20px_-4px_rgba(139,92,246,0.18)]";

  return (
    <div
      className={`${shellClass} bg-gradient-to-br from-[#3b0a8f] via-[#4c1d95] to-[#5b21b6]`}
    >
      {/* Fondo animado (WebGL): el degradé en movimiento ES el fondo del cuadro. */}
      <GradientMesh
        colors={BANNER_MESH_COLORS}
        speed={0.45}
        swirl={0.3}
        waveAmp={0.05}
        grain={0.02}
        scale={1.15}
      />

      {/* Contenido */}
      <div
        className={
          isMobile
            ? "relative z-10 flex flex-col gap-0.5 px-5 pb-4 pt-4"
            : "relative z-10 flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6"
        }
      >
        <div className="min-w-0 w-full sm:w-auto">
          {isMobile ? (
            <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/85">
              Utopp
            </p>
          ) : null}
          <h2
            className={`font-display font-extrabold flex flex-wrap items-center gap-x-2 gap-y-0.5 text-white [text-shadow:0_2px_14px_rgba(0,0,0,0.35)] ${
              isMobile ? "text-xl tracking-tight" : "text-2xl sm:text-3xl"
            }`}
          >
            {isMobile ? (
              <>
                <span>Hola,</span>
                <span>{userName}</span>
              </>
            ) : (
              <>
                <span>Hola</span>
                <span>{userName}</span>
              </>
            )}
          </h2>
          {!isMobile ? (
            <p className="mt-1 text-sm font-medium text-white/90 break-words [text-shadow:0_1px_10px_rgba(0,0,0,0.35)] sm:text-base">
              Bienvenido a Utopp
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

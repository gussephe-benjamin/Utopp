/** Formas decorativas del panel izquierdo auth (sin interactividad). */
export function AuthDecorativeShapes() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-[#6D5DFC]/25 blur-3xl" />
      <div className="absolute -right-16 top-1/3 h-64 w-64 rounded-full bg-[#8B5CF6]/20 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-[#A855F7]/15 blur-3xl" />
      <div className="absolute right-1/4 top-0 h-48 w-48 rounded-full bg-[#6D5DFC]/10 blur-2xl" />
    </div>
  )
}

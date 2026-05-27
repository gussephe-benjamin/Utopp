/**
 * Posiciones en el segmento entre el borde interior del + y el borde de la barra (longitud D).
 * Con n = count funcionalidades se usan n+1 segmentos iguales de tamaño D/(n+1).
 * Cada control va en el borde entre segmentos: D/(n+1), 2D/(n+1), …, nD/(n+1).
 * No hay control en 0 ni en D (márgenes simétricos de D/(n+1)).
 */
export function distributeSegmentSlots(segmentLength: number, count: number): number[] {
  if (count <= 0 || segmentLength <= 0) return [];

  const step = segmentLength / (count + 1);
  return Array.from({ length: count }, (_, i) => (i + 1) * step);
}

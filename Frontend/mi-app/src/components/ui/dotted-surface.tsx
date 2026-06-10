import { useEffect, useRef, type ComponentProps } from "react";
import * as THREE from "three";
import { cn } from "../../lib/utils";

/**
 * Campo de puntos animado (olas senoidales) con los colores de marca Utopp.
 * Adaptado de la versión Next.js (next-themes) para Vite + TS:
 *  - Sin dependencia de tema: el gradiente de color es fijo (azul → fucsia Utopp).
 *  - Se dimensiona a su contenedor (no a `window`), pensado para vivir dentro
 *    de un panel `relative` y no como overlay de pantalla completa.
 */

type DottedSurfaceProps = Omit<ComponentProps<"div">, "ref">;

// Paradas del gradiente de marca (0–1 RGB).
const BRAND_FROM = { r: 47 / 255, g: 85 / 255, b: 246 / 255 }; // #2f55f6 azul
const BRAND_TO = { r: 186 / 255, g: 78 / 255, b: 248 / 255 }; //  #ba4ef8 fucsia

export function DottedSurface({ className, ...props }: DottedSurfaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const SEPARATION = 150;
    const AMOUNTX = 40;
    const AMOUNTY = 60;

    // Tamaño inicial basado en el contenedor (fallback a la ventana).
    const initialWidth = container.clientWidth || window.innerWidth;
    const initialHeight = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      60,
      initialWidth / initialHeight,
      1,
      10000,
    );
    camera.position.set(0, 355, 1220);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(initialWidth, initialHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Geometría de partículas con color de marca interpolado por columna.
    const positions: number[] = [];
    const colors: number[] = [];
    const geometry = new THREE.BufferGeometry();

    for (let ix = 0; ix < AMOUNTX; ix++) {
      const t = AMOUNTX > 1 ? ix / (AMOUNTX - 1) : 0;
      const r = BRAND_FROM.r + (BRAND_TO.r - BRAND_FROM.r) * t;
      const g = BRAND_FROM.g + (BRAND_TO.g - BRAND_FROM.g) * t;
      const b = BRAND_FROM.b + (BRAND_TO.b - BRAND_FROM.b) * t;
      for (let iy = 0; iy < AMOUNTY; iy++) {
        const x = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
        const z = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;
        positions.push(x, 0, z);
        colors.push(r, g, b);
      }
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 9,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      sizeAttenuation: true,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let count = 0;
    let animationId = 0;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const positionAttribute = geometry.attributes.position;
      const pos = positionAttribute.array as Float32Array;

      let i = 0;
      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          const index = i * 3;
          pos[index + 1] =
            Math.sin((ix + count) * 0.3) * 50 + Math.sin((iy + count) * 0.5) * 50;
          i++;
        }
      }

      positionAttribute.needsUpdate = true;
      renderer.render(scene, camera);
      count += 0.1;
    };

    // Redimensiona con el contenedor (no con la ventana).
    const resize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    window.addEventListener("resize", resize);

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      ro.disconnect();
      window.removeEventListener("resize", resize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      {...props}
    />
  );
}

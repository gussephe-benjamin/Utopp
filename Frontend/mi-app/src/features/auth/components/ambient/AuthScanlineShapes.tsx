import { AUTH_AMBIENT } from "../../constants/authTheme"

type BlobConfig = {
  id: string
  className: string
  viewBox: string
  path: string
  animation: string
  delay: string
  patternColor: string
  scanlineDuration: string
}

const BLOBS: BlobConfig[] = [
  {
    id: "blob-desktop-1",
    className: "auth-ambient-shape-desktop auth-ambient-drift -left-[5%] top-[15%] h-[280px] w-[340px]",
    viewBox: "0 0 340 280",
    path: "M48,56 C148,14 289,42 306,126 C323,210 204,266 102,246 C14,228 6,126 48,56 Z",
    animation: "auth-ambient-drift",
    delay: "0s",
    patternColor: "rgba(109, 93, 252, 0.62)",
    scanlineDuration: "4s",
  },
  {
    id: "blob-desktop-2",
    className:
      "auth-ambient-shape-desktop auth-ambient-drift-alt -right-[8%] top-[38%] h-[220px] w-[300px]",
    viewBox: "0 0 300 220",
    path: "M60,22 C165,4 276,55 264,121 C252,187 135,216 54,180 C6,154 15,77 60,22 Z",
    animation: "auth-ambient-drift-alt",
    delay: "-8s",
    patternColor: "rgba(139, 92, 246, 0.55)",
    scanlineDuration: "4.5s",
  },
  {
    id: "blob-desktop-3",
    className:
      "auth-ambient-shape-desktop auth-ambient-drift-slow bottom-[-4%] left-[18%] h-[180px] w-[260px]",
    viewBox: "0 0 260 180",
    path: "M26,54 C91,14 195,36 239,90 C254,130 182,171 91,162 C21,155 6,99 26,54 Z",
    animation: "auth-ambient-drift-slow",
    delay: "-14s",
    patternColor: "rgba(109, 93, 252, 0.58)",
    scanlineDuration: "3.5s",
  },
  {
    id: "blob-tablet-1",
    className:
      "auth-ambient-shape-tablet auth-ambient-drift -left-[3%] top-[20%] h-[240px] w-[300px]",
    viewBox: "0 0 300 240",
    path: "M36,43 C150,10 264,48 276,120 C288,187 165,230 66,206 C12,190 18,96 36,43 Z",
    animation: "auth-ambient-drift",
    delay: "-4s",
    patternColor: "rgba(109, 93, 252, 0.58)",
    scanlineDuration: "4s",
  },
  {
    id: "blob-tablet-2",
    className:
      "auth-ambient-shape-tablet auth-ambient-drift-alt -right-[6%] bottom-[6%] h-[200px] w-[260px]",
    viewBox: "0 0 260 200",
    path: "M47,24 C135,12 234,56 224,116 C214,176 109,188 39,156 C10,138 21,70 47,24 Z",
    animation: "auth-ambient-drift-alt",
    delay: "-10s",
    patternColor: "rgba(139, 92, 246, 0.52)",
    scanlineDuration: "4.5s",
  },
  {
    id: "blob-mobile",
    className: "auth-ambient-shape-mobile auth-ambient-drift -left-[8%] top-[28%] h-[200px] w-[280px]",
    viewBox: "0 0 280 200",
    path: "M39,40 C134,12 241,44 252,104 C263,160 162,188 70,168 C17,156 11,92 39,40 Z",
    animation: "auth-ambient-drift",
    delay: "-6s",
    patternColor: "rgba(109, 93, 252, 0.55)",
    scanlineDuration: "4s",
  },
]

function ScanlineBlob({ blob }: { blob: BlobConfig }) {
  const patternId = `scanline-${blob.id}`
  const glowId = `glow-${blob.id}`

  return (
    <svg
      className={`auth-scanline-shape pointer-events-none absolute overflow-visible ${blob.className} ${blob.animation}`}
      viewBox={blob.viewBox}
      fill="none"
      aria-hidden
      style={{
        animationDelay: blob.delay,
        opacity: AUTH_AMBIENT.shapeOpacity.all,
      }}
    >
      <defs>
        <pattern
          id={patternId}
          patternUnits="userSpaceOnUse"
          width="100%"
          height="7"
        >
          <g>
            <animateTransform
              attributeName="transform"
              type="translate"
              from="0 0"
              to="0 7"
              dur={blob.scanlineDuration}
              repeatCount="indefinite"
            />
            <rect width="100%" height="2" y="5" fill={blob.patternColor} />
            <rect width="100%" height="2" y="-2" fill={blob.patternColor} />
          </g>
        </pattern>
        <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d={blob.path}
        fill={`url(#${patternId})`}
        opacity="0.68"
        filter={`url(#${glowId})`}
      />
    </svg>
  )
}

/** Formas orgánicas con patrón de scanlines horizontales animadas (Layer 3). */
export function AuthScanlineShapes() {
  return (
    <div className="auth-ambient-parallax-shapes absolute inset-0" aria-hidden>
      {BLOBS.map((blob) => (
        <ScanlineBlob key={blob.id} blob={blob} />
      ))}
    </div>
  )
}
